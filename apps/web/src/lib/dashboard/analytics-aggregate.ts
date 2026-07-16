/**
 * WS08-T006 — Owner analytics aggregation helpers (pure).
 *
 * Canonical event source: `analytics_events` for counts and duration.
 * Traffic sources: `public_profile_events.source` (written with each profile_view;
 * not double-counted into profile view totals).
 *
 * Do not also sum legacy `project_view_events` / `public_profile_events` row
 * counts into the same totals — the API writes parallel rows for views.
 */

export type AnalyticsEventRow = {
  event_type: string;
  target_id: string | null;
  target_type: string | null;
  metadata: unknown;
  created_at?: string;
};

export type ProfileSourceRow = {
  source: string | null;
};

export type OwnedProjectRow = {
  id: string;
  title: string;
  poster_url?: string | null;
};

export type OwnedResearchRow = {
  id: string;
  title: string;
};

export type TrafficSourceStat = {
  label: string;
  value: number;
  pct: number;
};

export type TopProjectStat = {
  id: string;
  title: string;
  posterUrl?: string;
  views: number;
  linkClicks: number;
  timeSpentSec: number;
};

export type TopResearchStat = {
  id: string;
  title: string;
  views: number;
  pdfDownloads: number;
  citationCopies: number;
  timeSpentSec: number;
  avgReadTimeSec: number;
};

export type OwnerAnalyticsTotals = {
  profileViews: number;
  projectViews: number;
  linkClicks: number;
  profileShares: number;
  qrDownloads: number;
  researchViews: number;
  pdfDownloads: number;
  citationCopies: number;
  /** Sum of valid `metadata.seconds` on project_time_spent events. */
  projectTimeSpentSec: number;
  /** Sum of valid `metadata.seconds` on time_spent_on_research events. */
  researchTimeSpentSec: number;
};

export type OwnerAnalyticsSummary = OwnerAnalyticsTotals & {
  profileId: string;
  displayName: string;
  profileSlug: string;
  isPublic: boolean;
  sources: TrafficSourceStat[];
  topProjects: TopProjectStat[];
  topResearch: TopResearchStat[];
  /** True when at least one supported audience event exists. */
  hasAnyEvents: boolean;
};

export function readDurationSeconds(metadata: unknown): number {
  if (!metadata || typeof metadata !== 'object' || !('seconds' in metadata)) return 0;
  const seconds = (metadata as { seconds?: unknown }).seconds;
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || !Number.isInteger(seconds)) {
    return 0;
  }
  if (seconds < 1) return 0;
  return seconds;
}

function sourceLabel(raw: string | null | undefined): string {
  if (!raw) return 'Direct';
  const map: Record<string, string> = {
    direct_link: 'Direct',
    qr: 'QR code',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    twitter: 'Twitter',
    search: 'Search',
    referral: 'Referral',
    share: 'Share',
  };
  return map[raw] ?? raw.replace(/_/g, ' ');
}

export function aggregateOwnerAnalytics(input: {
  profileId: string;
  displayName: string;
  profileSlug: string;
  isPublic: boolean;
  events: AnalyticsEventRow[];
  profileSources: ProfileSourceRow[];
  projects: OwnedProjectRow[];
  researchPapers: OwnedResearchRow[];
}): OwnerAnalyticsSummary {
  const { events, projects, researchPapers } = input;
  const projectIds = new Set(projects.map((p) => p.id));
  const researchIds = new Set(researchPapers.map((p) => p.id));

  let profileViews = 0;
  let projectViews = 0;
  let linkClicks = 0;
  let profileShares = 0;
  let qrDownloads = 0;
  let researchViews = 0;
  let pdfDownloads = 0;
  let citationCopies = 0;
  let projectTimeSpentSec = 0;
  let researchTimeSpentSec = 0;

  const projectViewCounts = new Map<string, number>();
  const projectLinkClicks = new Map<string, number>();
  const projectTime = new Map<string, number>();
  const researchViewCounts = new Map<string, number>();
  const researchPdf = new Map<string, number>();
  const researchCite = new Map<string, number>();
  const researchTime = new Map<string, number>();
  const researchTimeSamples = new Map<string, number[]>();

  for (const event of events) {
    switch (event.event_type) {
      case 'profile_view':
        profileViews += 1;
        break;
      case 'project_view':
        if (event.target_id && projectIds.has(event.target_id)) {
          projectViews += 1;
          projectViewCounts.set(
            event.target_id,
            (projectViewCounts.get(event.target_id) ?? 0) + 1,
          );
        }
        break;
      case 'link_click':
        linkClicks += 1;
        if (event.target_type === 'project' && event.target_id && projectIds.has(event.target_id)) {
          projectLinkClicks.set(
            event.target_id,
            (projectLinkClicks.get(event.target_id) ?? 0) + 1,
          );
        }
        break;
      case 'profile_share':
        profileShares += 1;
        break;
      case 'qr_download':
        qrDownloads += 1;
        break;
      case 'research_view':
        if (event.target_id && researchIds.has(event.target_id)) {
          researchViews += 1;
          researchViewCounts.set(
            event.target_id,
            (researchViewCounts.get(event.target_id) ?? 0) + 1,
          );
        }
        break;
      case 'paper_download':
        if (event.target_id && researchIds.has(event.target_id)) {
          pdfDownloads += 1;
          researchPdf.set(event.target_id, (researchPdf.get(event.target_id) ?? 0) + 1);
        }
        break;
      case 'citation_copy':
        if (event.target_id && researchIds.has(event.target_id)) {
          citationCopies += 1;
          researchCite.set(event.target_id, (researchCite.get(event.target_id) ?? 0) + 1);
        }
        break;
      case 'project_time_spent': {
        const seconds = readDurationSeconds(event.metadata);
        if (seconds > 0 && event.target_id && projectIds.has(event.target_id)) {
          projectTimeSpentSec += seconds;
          projectTime.set(event.target_id, (projectTime.get(event.target_id) ?? 0) + seconds);
        }
        break;
      }
      case 'time_spent_on_research': {
        const seconds = readDurationSeconds(event.metadata);
        if (seconds > 0 && event.target_id && researchIds.has(event.target_id)) {
          researchTimeSpentSec += seconds;
          researchTime.set(event.target_id, (researchTime.get(event.target_id) ?? 0) + seconds);
          const samples = researchTimeSamples.get(event.target_id) ?? [];
          samples.push(seconds);
          researchTimeSamples.set(event.target_id, samples);
        }
        break;
      }
      default:
        break;
    }
  }

  const sourceCounts = new Map<string, number>();
  for (const row of input.profileSources) {
    const label = sourceLabel(row.source);
    sourceCounts.set(label, (sourceCounts.get(label) ?? 0) + 1);
  }
  const sourceTotal = [...sourceCounts.values()].reduce((a, b) => a + b, 0);
  const sources: TrafficSourceStat[] = [...sourceCounts.entries()]
    .map(([label, value]) => ({
      label,
      value,
      pct: sourceTotal > 0 ? Math.round((value / sourceTotal) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

  const topProjects: TopProjectStat[] = projects
    .map((project) => ({
      id: project.id,
      title: project.title,
      posterUrl: project.poster_url ?? undefined,
      views: projectViewCounts.get(project.id) ?? 0,
      linkClicks: projectLinkClicks.get(project.id) ?? 0,
      timeSpentSec: projectTime.get(project.id) ?? 0,
    }))
    .filter((p) => p.views > 0 || p.linkClicks > 0 || p.timeSpentSec > 0)
    .sort(
      (a, b) =>
        b.views - a.views ||
        b.timeSpentSec - a.timeSpentSec ||
        a.title.localeCompare(b.title),
    );

  const topResearch: TopResearchStat[] = researchPapers
    .map((paper) => {
      const samples = researchTimeSamples.get(paper.id) ?? [];
      const timeSpentSec = researchTime.get(paper.id) ?? 0;
      return {
        id: paper.id,
        title: paper.title,
        views: researchViewCounts.get(paper.id) ?? 0,
        pdfDownloads: researchPdf.get(paper.id) ?? 0,
        citationCopies: researchCite.get(paper.id) ?? 0,
        timeSpentSec,
        avgReadTimeSec: samples.length
          ? Math.round(samples.reduce((s, n) => s + n, 0) / samples.length)
          : 0,
      };
    })
    .filter(
      (p) =>
        p.views > 0 ||
        p.pdfDownloads > 0 ||
        p.citationCopies > 0 ||
        p.timeSpentSec > 0,
    )
    .sort(
      (a, b) =>
        b.views - a.views ||
        b.timeSpentSec - a.timeSpentSec ||
        a.title.localeCompare(b.title),
    );

  const hasAnyEvents =
    profileViews +
      projectViews +
      linkClicks +
      profileShares +
      qrDownloads +
      researchViews +
      pdfDownloads +
      citationCopies +
      projectTimeSpentSec +
      researchTimeSpentSec >
    0;

  return {
    profileId: input.profileId,
    displayName: input.displayName,
    profileSlug: input.profileSlug,
    isPublic: input.isPublic,
    profileViews,
    projectViews,
    linkClicks,
    profileShares,
    qrDownloads,
    researchViews,
    pdfDownloads,
    citationCopies,
    projectTimeSpentSec,
    researchTimeSpentSec,
    sources,
    topProjects,
    topResearch,
    hasAnyEvents,
  };
}

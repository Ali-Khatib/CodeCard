import { createClient } from '@/lib/supabase/server';
import { DashboardAnalyticsView } from '@/components/dashboard/dashboard-analytics-view';
import type { ResearchPaperAnalytics } from '@/lib/dashboard/analytics-data';

type ResearchPaperRow = {
  id: string;
  title: string;
};

type AnalyticsEventRow = {
  target_id: string | null;
  event_type: string;
  metadata: unknown;
};

function readSeconds(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || !('seconds' in metadata)) return 0;
  const seconds = (metadata as { seconds?: unknown }).seconds;
  return typeof seconds === 'number' && Number.isFinite(seconds) ? seconds : 0;
}

function buildPerPaperAnalytics(
  papers: ResearchPaperRow[],
  events: AnalyticsEventRow[],
): ResearchPaperAnalytics[] {
  return papers.map((paper) => {
    const paperEvents = events.filter((event) => event.target_id === paper.id);
    const views = paperEvents.filter((event) => event.event_type === 'research_view').length;
    const pdfDownloads = paperEvents.filter((event) => event.event_type === 'paper_download').length;
    const citationCopies = paperEvents.filter((event) => event.event_type === 'citation_copy').length;
    const readTimes = paperEvents
      .filter((event) => event.event_type === 'time_spent_on_research')
      .map((event) => readSeconds(event.metadata))
      .filter((seconds) => seconds > 0);
    const figureViews = paperEvents.filter((event) => event.event_type === 'figure_view').length;
    const abstractExpands = paperEvents.filter((event) => event.event_type === 'abstract_expand').length;

    const topSignal =
      [
        { label: 'PDF', value: pdfDownloads },
        { label: 'Citation', value: citationCopies },
        { label: 'Figures', value: figureViews },
        { label: 'Abstract', value: abstractExpands },
      ].sort((a, b) => b.value - a.value)[0]?.label ?? 'Views';

    return {
      id: paper.id,
      title: paper.title,
      views,
      pdfDownloads,
      citationCopies,
      avgReadTimeSec: readTimes.length
        ? Math.round(readTimes.reduce((sum, seconds) => sum + seconds, 0) / readTimes.length)
        : 0,
      topSignal,
    };
  });
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('owner_user_id', user!.id)
    .single();

  const { count: profileViews } = await supabase
    .from('public_profile_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile?.id ?? '');

  const { count: projectViews } = await supabase
    .from('project_view_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile?.id ?? '');

  const { count: researchViews } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile?.id ?? '')
    .eq('event_type', 'research_view');

  const { count: pdfDownloads } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile?.id ?? '')
    .eq('event_type', 'paper_download');

  const { count: citationCopies } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile?.id ?? '')
    .eq('event_type', 'citation_copy');

  const { data: topResearch } = await supabase
    .from('research_papers')
    .select('title')
    .eq('profile_id', profile?.id ?? '')
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: researchPapers } = await supabase
    .from('research_papers')
    .select('id, title')
    .eq('profile_id', profile?.id ?? '')
    .order('sort_order', { ascending: true })
    .limit(8);

  const researchRows = (researchPapers ?? []) as ResearchPaperRow[];
  const researchIds = researchRows.map((paper) => paper.id);
  const { data: researchEvents } = researchIds.length
    ? await supabase
        .from('analytics_events')
        .select('target_id, event_type, metadata')
        .eq('profile_id', profile?.id ?? '')
        .eq('target_type', 'research')
        .in('target_id', researchIds)
    : { data: [] };

  const perResearchPapers = buildPerPaperAnalytics(
    researchRows,
    (researchEvents ?? []) as AnalyticsEventRow[],
  );

  const displayName =
    profile?.display_name ?? user!.email?.split('@')[0] ?? 'there';

  return (
    <DashboardAnalyticsView
      displayName={displayName}
      profileViews={profileViews ?? undefined}
      projectViews={projectViews ?? undefined}
      researchViews={researchViews ?? undefined}
      pdfDownloads={pdfDownloads ?? undefined}
      citationCopies={citationCopies ?? undefined}
      topResearchTitle={topResearch?.title ?? undefined}
      perResearchPapers={perResearchPapers}
    />
  );
}

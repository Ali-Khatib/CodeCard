import type { SupabaseClient, User } from '@supabase/supabase-js';
import { PLANS } from '@codecard/config';
import {
  loadOwnerAnalytics,
  loadOwnerAnalyticsTrends,
} from '@/lib/dashboard/analytics-queries';
import {
  ACCOUNT_EXPORT_SCHEMA_VERSION,
  accountExportDocumentSchema,
  findForbiddenExportFields,
  isStablePublicHttpUrl,
  toUtcIso,
  type AccountExportDocument,
  type AccountExportProject,
  type AccountExportResearch,
} from '@/lib/account/export-schema';

export type BuildAccountExportResult =
  | { ok: true; document: AccountExportDocument }
  | { ok: false; error: 'query_failed' | 'validation_failed' | 'forbidden_fields' };

function providersFromUser(user: User): string[] {
  const identities = user.identities ?? [];
  const names = identities
    .map((identity) => identity.provider)
    .filter((provider): provider is string => Boolean(provider));
  return [...new Set(names)].sort();
}

function requireIso(value: string | null | undefined, fallback: string): string {
  return toUtcIso(value) ?? fallback;
}

/**
 * Build the WS10 account export document for the authenticated user.
 * Ownership is always `user.id` from the session — never client-supplied.
 */
export async function buildAccountExportDocument(
  supabase: SupabaseClient,
  user: User,
): Promise<BuildAccountExportResult> {
  const generatedAt = new Date().toISOString();
  const exportNotes = [
    'Technical export per docs/account-data-inventory.md — legal review pending.',
    'Raw analytics events are not included; analytics_summary uses owner aggregates only.',
    'Stripe customer/subscription identifiers and payment methods are not included.',
    'Signed storage URLs and storage object paths are not included.',
    'ZIP/binary file bundles are not supported; JSON metadata only.',
    'DMCA notices are not included (product/legal decision pending).',
    'Audit logs, jobs, and billing webhook payloads are not included.',
  ];

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      'id, slug, display_name, headline, bio, location, skills, is_public, avatar_url, created_at, updated_at',
    )
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (profileError) {
    return { ok: false, error: 'query_failed' };
  }

  let profileLinks: AccountExportDocument['profile_links'] = [];
  let projects: AccountExportProject[] = [];
  let research: AccountExportResearch[] = [];
  let analyticsSummary: AccountExportDocument['analytics_summary'] = null;
  let additional: AccountExportDocument['additional_account_data'] = {
    saved_connections: [],
    connection_notes: [],
    collections: [],
    subscription: null,
    moderation_reports: [],
    circle_activity: [],
  };

  if (!profile) {
    exportNotes.push('No profile row exists for this account yet.');
  } else {
    const linksResult = await supabase
      .from('profile_links')
      .select('id, type, label, url, sort_order, created_at, updated_at')
      .eq('profile_id', profile.id)
      .order('sort_order', { ascending: true });

    if (linksResult.error) {
      return { ok: false, error: 'query_failed' };
    }

    profileLinks = (linksResult.data ?? []).map((link) => ({
      id: link.id,
      type: link.type,
      label: link.label ?? null,
      url: link.url,
      sort_order: link.sort_order,
      created_at: requireIso(link.created_at, generatedAt),
      updated_at: requireIso(link.updated_at, generatedAt),
    }));

    const projectsResult = await loadOwnedProjects(supabase, user.id, profile.id, generatedAt);
    if (!projectsResult.ok) return projectsResult;
    projects = projectsResult.projects;

    const researchResult = await loadOwnedResearch(supabase, user.id, profile.id, generatedAt);
    if (!researchResult.ok) return researchResult;
    research = researchResult.research;

    const analyticsResult = await loadExportAnalytics(supabase, user.id);
    if (!analyticsResult.ok) return analyticsResult;
    analyticsSummary = analyticsResult.summary;

    const additionalResult = await loadAdditionalOwnerData(
      supabase,
      user.id,
      profile.id,
      generatedAt,
    );
    if (!additionalResult.ok) return additionalResult;
    additional = additionalResult.data;
  }

  const document: AccountExportDocument = {
    schema_version: ACCOUNT_EXPORT_SCHEMA_VERSION,
    generated_at: generatedAt,
    account: {
      user_id: user.id,
      email: user.email ?? null,
      created_at: toUtcIso(user.created_at),
      last_sign_in_at: toUtcIso(user.last_sign_in_at),
      providers: providersFromUser(user),
    },
    profile: profile
      ? {
          id: profile.id,
          slug: profile.slug,
          display_name: profile.display_name,
          headline: profile.headline ?? null,
          bio: profile.bio ?? null,
          location: profile.location ?? null,
          skills: Array.isArray(profile.skills) ? profile.skills : [],
          is_public: Boolean(profile.is_public),
          avatar_public_url: isStablePublicHttpUrl(profile.avatar_url),
          created_at: requireIso(profile.created_at, generatedAt),
          updated_at: requireIso(profile.updated_at, generatedAt),
        }
      : null,
    profile_links: profileLinks,
    projects,
    research,
    analytics_summary: analyticsSummary,
    additional_account_data: additional,
    export_notes: exportNotes,
  };

  const validated = accountExportDocumentSchema.safeParse(document);
  if (!validated.success) {
    return { ok: false, error: 'validation_failed' };
  }

  const forbidden = findForbiddenExportFields(validated.data);
  if (forbidden.length > 0) {
    return { ok: false, error: 'forbidden_fields' };
  }

  return { ok: true, document: validated.data };
}

async function loadOwnedProjects(
  supabase: SupabaseClient,
  ownerUserId: string,
  profileId: string,
  generatedAt: string,
): Promise<
  | { ok: true; projects: AccountExportProject[] }
  | { ok: false; error: 'query_failed' }
> {
  const { data: projectRows, error: projectsError } = await supabase
    .from('projects')
    .select(
      'id, slug, title, tagline, description, technologies, is_published, sort_order, user_role, status, started_at, ended_at, case_study_sections, created_at, updated_at',
    )
    .eq('owner_user_id', ownerUserId)
    .eq('profile_id', profileId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (projectsError) return { ok: false, error: 'query_failed' };

  const rows = projectRows ?? [];
  if (rows.length === 0) return { ok: true, projects: [] };

  const projectIds = rows.map((row) => row.id);

  const [domainsRes, focusRes, linksRes, mediaRes, orderingsRes] = await Promise.all([
    supabase
      .from('project_domains')
      .select('id, project_id, name, created_at')
      .in('project_id', projectIds)
      .order('name', { ascending: true }),
    supabase
      .from('project_focus_areas')
      .select('id, project_id, name, created_at')
      .in('project_id', projectIds)
      .order('name', { ascending: true }),
    supabase
      .from('project_links')
      .select('id, project_id, type, label, url, sort_order, created_at, updated_at')
      .in('project_id', projectIds)
      .order('sort_order', { ascending: true }),
    supabase
      .from('project_media_assets')
      .select('id, project_id, type, mime_type, file_size, sort_order, created_at, updated_at')
      .in('project_id', projectIds)
      .order('sort_order', { ascending: true }),
    supabase
      .from('project_orderings')
      .select('id, project_id, sort_order, created_at')
      .eq('profile_id', profileId)
      .in('project_id', projectIds),
  ]);

  if (
    domainsRes.error ||
    focusRes.error ||
    linksRes.error ||
    mediaRes.error ||
    orderingsRes.error
  ) {
    return { ok: false, error: 'query_failed' };
  }

  const domainsByProject = groupBy(domainsRes.data ?? [], 'project_id');
  const focusByProject = groupBy(focusRes.data ?? [], 'project_id');
  const linksByProject = groupBy(linksRes.data ?? [], 'project_id');
  const mediaByProject = groupBy(mediaRes.data ?? [], 'project_id');
  const orderingByProject = new Map(
    (orderingsRes.data ?? []).map((row) => [row.project_id as string, row]),
  );

  const projects: AccountExportProject[] = rows.map((row) => {
    const ordering = orderingByProject.get(row.id) ?? null;
    return {
      id: row.id,
      slug: row.slug ?? null,
      title: row.title,
      tagline: row.tagline ?? null,
      description: row.description ?? null,
      technologies: Array.isArray(row.technologies) ? row.technologies : [],
      is_published: Boolean(row.is_published),
      sort_order: row.sort_order,
      user_role: row.user_role ?? null,
      status: row.status ?? null,
      started_at: row.started_at ?? null,
      ended_at: row.ended_at ?? null,
      case_study_sections: row.case_study_sections ?? {},
      created_at: requireIso(row.created_at, generatedAt),
      updated_at: requireIso(row.updated_at, generatedAt),
      domains: (domainsByProject.get(row.id) ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        created_at: requireIso(d.created_at, generatedAt),
      })),
      focus_areas: (focusByProject.get(row.id) ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        created_at: requireIso(f.created_at, generatedAt),
      })),
      links: (linksByProject.get(row.id) ?? []).map((l) => ({
        id: l.id,
        type: l.type,
        label: l.label ?? null,
        url: l.url,
        sort_order: l.sort_order,
        created_at: requireIso(l.created_at, generatedAt),
        updated_at: requireIso(l.updated_at, generatedAt),
      })),
      media: (mediaByProject.get(row.id) ?? []).map((m) => ({
        id: m.id,
        resource_type: 'project-media',
        media_type: m.type ?? null,
        mime_type: m.mime_type ?? null,
        file_size: typeof m.file_size === 'number' ? m.file_size : null,
        sort_order: m.sort_order,
        public_url: null,
        created_at: requireIso(m.created_at, generatedAt),
        updated_at: requireIso(m.updated_at, generatedAt),
      })),
      ordering: ordering
        ? {
            id: ordering.id,
            sort_order: ordering.sort_order,
            created_at: requireIso(ordering.created_at, generatedAt),
          }
        : null,
    };
  });

  return { ok: true, projects };
}

async function loadOwnedResearch(
  supabase: SupabaseClient,
  ownerUserId: string,
  profileId: string,
  generatedAt: string,
): Promise<
  | { ok: true; research: AccountExportResearch[] }
  | { ok: false; error: 'query_failed' }
> {
  const { data: paperRows, error: papersError } = await supabase
    .from('research_papers')
    .select(
      'id, slug, title, abstract, authors, venue, publication_status, year, pdf_url, doi_url, citation_text, tags, cover_image_url, is_published, sort_order, related_project_id, created_at, updated_at',
    )
    .eq('owner_user_id', ownerUserId)
    .eq('profile_id', profileId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (papersError) return { ok: false, error: 'query_failed' };

  const papers = paperRows ?? [];
  if (papers.length === 0) return { ok: true, research: [] };

  const paperIds = papers.map((row) => row.id);
  const { data: figureRows, error: figuresError } = await supabase
    .from('research_figures')
    .select('id, research_paper_id, image_url, caption, sort_order, created_at, updated_at')
    .in('research_paper_id', paperIds)
    .order('sort_order', { ascending: true });

  if (figuresError) return { ok: false, error: 'query_failed' };

  const figuresByPaper = groupBy(figureRows ?? [], 'research_paper_id');

  const research: AccountExportResearch[] = papers.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    abstract: row.abstract ?? null,
    authors: Array.isArray(row.authors) ? row.authors : [],
    venue: row.venue ?? null,
    publication_status: row.publication_status ?? null,
    year: typeof row.year === 'number' ? row.year : null,
    pdf_url: row.pdf_url ?? null,
    doi_url: row.doi_url ?? null,
    citation_text: row.citation_text ?? null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    cover_image_public_url: isStablePublicHttpUrl(row.cover_image_url),
    is_published: Boolean(row.is_published),
    sort_order: row.sort_order,
    related_project_id: row.related_project_id ?? null,
    created_at: requireIso(row.created_at, generatedAt),
    updated_at: requireIso(row.updated_at, generatedAt),
    figures: (figuresByPaper.get(row.id) ?? []).map((figure) => ({
      id: figure.id,
      caption: figure.caption ?? null,
      sort_order: figure.sort_order,
      public_url: isStablePublicHttpUrl(figure.image_url),
      created_at: requireIso(figure.created_at, generatedAt),
      updated_at: requireIso(figure.updated_at, generatedAt),
    })),
  }));

  return { ok: true, research };
}

async function loadExportAnalytics(
  supabase: SupabaseClient,
  ownerUserId: string,
): Promise<
  | { ok: true; summary: AccountExportDocument['analytics_summary'] }
  | { ok: false; error: 'query_failed' }
> {
  const [summaryResult, trends7, trends30] = await Promise.all([
    loadOwnerAnalytics(supabase, ownerUserId),
    loadOwnerAnalyticsTrends(supabase, ownerUserId, 7),
    loadOwnerAnalyticsTrends(supabase, ownerUserId, 30),
  ]);

  if (!summaryResult.ok) {
    if (summaryResult.reason === 'no_profile') {
      return { ok: true, summary: null };
    }
    return { ok: false, error: 'query_failed' };
  }

  if (!trends7.ok && trends7.reason !== 'no_profile') {
    return { ok: false, error: 'query_failed' };
  }
  if (!trends30.ok && trends30.reason !== 'no_profile') {
    return { ok: false, error: 'query_failed' };
  }

  const summary = summaryResult.summary;
  return {
    ok: true,
    summary: {
      profile_id: summary.profileId,
      profile_slug: summary.profileSlug,
      display_name: summary.displayName,
      is_public: summary.isPublic,
      has_any_events: summary.hasAnyEvents,
      totals: {
        profileViews: summary.profileViews,
        projectViews: summary.projectViews,
        linkClicks: summary.linkClicks,
        profileShares: summary.profileShares,
        qrDownloads: summary.qrDownloads,
        researchViews: summary.researchViews,
        pdfDownloads: summary.pdfDownloads,
        citationCopies: summary.citationCopies,
        projectTimeSpentSec: summary.projectTimeSpentSec,
        researchTimeSpentSec: summary.researchTimeSpentSec,
      },
      sources: summary.sources.map((source) => ({
        label: source.label,
        value: source.value,
        pct: source.pct,
      })),
      top_projects: summary.topProjects.map((project) => ({
        id: project.id,
        title: project.title,
        views: project.views,
        link_clicks: project.linkClicks,
        time_spent_sec: project.timeSpentSec,
        poster_public_url: isStablePublicHttpUrl(project.posterUrl ?? null),
      })),
      top_research: summary.topResearch.map((paper) => ({
        id: paper.id,
        title: paper.title,
        views: paper.views,
        pdf_downloads: paper.pdfDownloads,
        citation_copies: paper.citationCopies,
        time_spent_sec: paper.timeSpentSec,
        avg_read_time_sec: paper.avgReadTimeSec,
      })),
      trends_7d:
        trends7.ok
          ? {
              start_day: trends7.trends.startDay,
              end_day: trends7.trends.endDay,
              totals: trends7.trends.totals,
            }
          : null,
      trends_30d:
        trends30.ok
          ? {
              start_day: trends30.trends.startDay,
              end_day: trends30.trends.endDay,
              totals: trends30.trends.totals,
            }
          : null,
      retention_note:
        'Raw analytics event rows are retained up to 90 days and are not included in this export.',
    },
  };
}

async function loadAdditionalOwnerData(
  supabase: SupabaseClient,
  ownerUserId: string,
  profileId: string,
  generatedAt: string,
): Promise<
  | { ok: true; data: AccountExportDocument['additional_account_data'] }
  | { ok: false; error: 'query_failed' }
> {
  const [connectionsRes, notesRes, collectionsRes, subscriptionRes, reportsRes, circleRes] =
    await Promise.all([
      supabase
        .from('saved_connections')
        .select('id, saved_profile_id, connected_at, met_at, source, context, created_at, updated_at')
        .eq('owner_user_id', ownerUserId)
        .order('created_at', { ascending: true }),
      supabase
        .from('connection_notes')
        .select('id, saved_connection_id, body, created_at, updated_at')
        .eq('owner_user_id', ownerUserId)
        .order('created_at', { ascending: true }),
      supabase
        .from('collections')
        .select('id, name, description, created_at, updated_at')
        .eq('owner_user_id', ownerUserId)
        .order('created_at', { ascending: true }),
      supabase
        .from('subscriptions')
        .select(
          'status, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at',
        )
        .eq('user_id', ownerUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('moderation_reports')
        .select('id, target_type, target_id, reason, status, created_at, updated_at')
        .eq('reporter_user_id', ownerUserId)
        .order('created_at', { ascending: true }),
      supabase
        .from('circle_activity')
        .select('id, event_type, target_type, target_id, dedupe_key, created_at')
        .eq('actor_profile_id', profileId)
        .order('created_at', { ascending: true }),
    ]);

  if (
    connectionsRes.error ||
    notesRes.error ||
    collectionsRes.error ||
    subscriptionRes.error ||
    reportsRes.error ||
    circleRes.error
  ) {
    return { ok: false, error: 'query_failed' };
  }

  const collections = collectionsRes.data ?? [];
  let collectionItemsByCollection = new Map<string, Array<Record<string, unknown>>>();
  if (collections.length > 0) {
    const collectionIds = collections.map((c) => c.id);
    const itemsRes = await supabase
      .from('collection_items')
      .select('id, collection_id, saved_connection_id, sort_order, created_at')
      .in('collection_id', collectionIds)
      .order('sort_order', { ascending: true });

    if (itemsRes.error) return { ok: false, error: 'query_failed' };
    collectionItemsByCollection = groupBy(itemsRes.data ?? [], 'collection_id');
  }

  const subscriptionRow = subscriptionRes.data;
  const subscription = subscriptionRow
    ? {
        plan_label:
          subscriptionRow.status === 'active' || subscriptionRow.status === 'trialing'
            ? PLANS.pro.name
            : PLANS.free.name,
        status: subscriptionRow.status,
        current_period_start: toUtcIso(subscriptionRow.current_period_start),
        current_period_end: toUtcIso(subscriptionRow.current_period_end),
        cancel_at_period_end: Boolean(subscriptionRow.cancel_at_period_end),
        created_at: requireIso(subscriptionRow.created_at, generatedAt),
        updated_at: requireIso(subscriptionRow.updated_at, generatedAt),
      }
    : null;

  return {
    ok: true,
    data: {
      saved_connections: (connectionsRes.data ?? []).map((row) => ({
        id: row.id,
        saved_profile_id: row.saved_profile_id,
        connected_at: toUtcIso(row.connected_at),
        met_at: toUtcIso(row.met_at),
        source: row.source,
        context: (row as { context?: string | null }).context ?? null,
        created_at: requireIso(row.created_at, generatedAt),
        updated_at: requireIso(row.updated_at, generatedAt),
      })),
      connection_notes: (notesRes.data ?? []).map((row) => ({
        id: row.id,
        saved_connection_id: row.saved_connection_id,
        body: row.body,
        created_at: requireIso(row.created_at, generatedAt),
        updated_at: requireIso(row.updated_at, generatedAt),
      })),
      collections: collections.map((collection) => ({
        id: collection.id,
        name: collection.name,
        description: collection.description ?? null,
        created_at: requireIso(collection.created_at, generatedAt),
        updated_at: requireIso(collection.updated_at, generatedAt),
        items: (collectionItemsByCollection.get(collection.id) ?? []).map((item) => ({
          id: item.id as string,
          saved_connection_id: item.saved_connection_id as string,
          sort_order: item.sort_order as number,
          created_at: requireIso(item.created_at as string, generatedAt),
        })),
      })),
      subscription,
      moderation_reports: (reportsRes.data ?? []).map((row) => ({
        id: row.id,
        target_type: row.target_type,
        target_id: row.target_id,
        reason: row.reason,
        status: row.status,
        created_at: requireIso(row.created_at, generatedAt),
        updated_at: requireIso(row.updated_at, generatedAt),
      })),
      circle_activity: (circleRes.data ?? []).map((row) => ({
        id: row.id,
        event_type: row.event_type,
        target_type: row.target_type,
        target_id: row.target_id,
        dedupe_key: row.dedupe_key,
        created_at: requireIso(row.created_at, generatedAt),
      })),
    },
  };
}

function groupBy<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T & string,
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const id = String(row[key]);
    const list = map.get(id) ?? [];
    list.push(row);
    map.set(id, list);
  }
  return map;
}

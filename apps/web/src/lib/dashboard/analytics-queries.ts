import type { SupabaseClient } from '@supabase/supabase-js';
import {
  aggregateOwnerAnalytics,
  type AnalyticsEventRow,
  type OwnerAnalyticsSummary,
  type OwnedProjectRow,
  type OwnedResearchRow,
  type ProfileSourceRow,
} from '@/lib/dashboard/analytics-aggregate';
import {
  buildTrendSeries,
  buildUtcRangeWindow,
  isAnalyticsTrendRange,
  type AnalyticsTrendRange,
  type AnalyticsTrendSeries,
} from '@/lib/dashboard/analytics-trends';

export type LoadOwnerAnalyticsResult =
  | { ok: true; summary: OwnerAnalyticsSummary }
  | { ok: false; reason: 'unauthenticated' | 'no_profile' | 'query_failed' };

const EVENT_TYPES = [
  'profile_view',
  'project_view',
  'link_click',
  'profile_share',
  'qr_download',
  'research_view',
  'paper_download',
  'citation_copy',
  'project_time_spent',
  'time_spent_on_research',
] as const;

/**
 * Owner-scoped analytics aggregates.
 * Profile ownership is resolved from `auth` user id — never from client input.
 */
export async function loadOwnerAnalytics(
  supabase: SupabaseClient,
  userId: string | null | undefined,
): Promise<LoadOwnerAnalyticsResult> {
  if (!userId) {
    return { ok: false, reason: 'unauthenticated' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, is_public, slug')
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (profileError) {
    return { ok: false, reason: 'query_failed' };
  }
  if (!profile) {
    return { ok: false, reason: 'no_profile' };
  }

  const [eventsResult, sourcesResult, projectsResult, researchResult] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('event_type, target_id, target_type, metadata, created_at')
      .eq('profile_id', profile.id)
      .in('event_type', [...EVENT_TYPES]),
    supabase
      .from('public_profile_events')
      .select('source')
      .eq('profile_id', profile.id),
    supabase
      .from('projects')
      .select('id, title')
      .eq('profile_id', profile.id)
      .eq('owner_user_id', userId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('research_papers')
      .select('id, title')
      .eq('profile_id', profile.id)
      .eq('owner_user_id', userId)
      .order('sort_order', { ascending: true }),
  ]);

  if (eventsResult.error || sourcesResult.error || projectsResult.error || researchResult.error) {
    return { ok: false, reason: 'query_failed' };
  }

  const summary = aggregateOwnerAnalytics({
    profileId: profile.id,
    displayName: profile.display_name ?? profile.slug ?? 'there',
    profileSlug: profile.slug ?? '',
    isPublic: Boolean(profile.is_public),
    events: (eventsResult.data ?? []) as AnalyticsEventRow[],
    profileSources: (sourcesResult.data ?? []) as ProfileSourceRow[],
    projects: (projectsResult.data ?? []) as OwnedProjectRow[],
    researchPapers: (researchResult.data ?? []) as OwnedResearchRow[],
  });

  return { ok: true, summary };
}

export async function loadOwnerAnalyticsTrends(
  supabase: SupabaseClient,
  userId: string | null | undefined,
  range: AnalyticsTrendRange,
  now: Date = new Date(),
): Promise<
  | { ok: true; trends: AnalyticsTrendSeries }
  | { ok: false; reason: 'unauthenticated' | 'no_profile' | 'query_failed' | 'invalid_range' }
> {
  if (!isAnalyticsTrendRange(range)) {
    return { ok: false, reason: 'invalid_range' };
  }
  if (!userId) {
    return { ok: false, reason: 'unauthenticated' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (profileError) return { ok: false, reason: 'query_failed' };
  if (!profile) return { ok: false, reason: 'no_profile' };

  const window = buildUtcRangeWindow(range, now);
  const { data, error } = await supabase
    .from('analytics_events')
    .select('event_type, created_at')
    .eq('profile_id', profile.id)
    .in('event_type', [
      'profile_view',
      'project_view',
      'link_click',
      'profile_share',
      'qr_download',
    ])
    .gte('created_at', window.rangeStart)
    .lt('created_at', window.rangeEndExclusive);

  if (error) return { ok: false, reason: 'query_failed' };

  const trends = buildTrendSeries({
    range,
    now,
    events: (data ?? []) as { event_type: string; created_at: string }[],
  });

  return { ok: true, trends };
}

export type { OwnerAnalyticsSummary, AnalyticsTrendSeries, AnalyticsTrendRange };

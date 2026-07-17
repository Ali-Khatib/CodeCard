import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CIRCLE_ACTIVITY_TABLE,
  CIRCLE_ACTIVITY_EVENT_TYPES,
} from '@/lib/circle/circle-activity-contract';
import {
  CIRCLE_UNREAD_BADGE_CAP,
  CIRCLE_VIEWER_STATE_TABLE,
  formatCircleUnreadBadge,
  type CircleUnreadSummary,
} from '@/lib/circle/circle-read-state-contract';

const UNREAD_SCAN_LIMIT = 40;

function readStateError(): string {
  return 'Could not update Circle read state.';
}

export async function getCircleLastSeenAt(
  supabase: SupabaseClient,
): Promise<{ ok: true; lastSeenAt: string | null } | { ok: false; error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'UNAUTHENTICATED' };

  const { data, error } = await supabase
    .from(CIRCLE_VIEWER_STATE_TABLE)
    .select('last_seen_at')
    .eq('viewer_user_id', user.id)
    .maybeSingle();

  if (error) return { ok: false, error: readStateError() };
  return { ok: true, lastSeenAt: (data?.last_seen_at as string | null) ?? null };
}

/**
 * Mark Circle as seen for the authenticated viewer only.
 * Call only after a deliberate, visible Circle page visit with a successful load.
 */
export async function markCircleSeen(
  supabase: SupabaseClient,
  options?: { seenAt?: string },
): Promise<{ ok: true; lastSeenAt: string } | { ok: false; error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'UNAUTHENTICATED' };

  const seenAt = options?.seenAt ?? new Date().toISOString();

  const { error } = await supabase.from(CIRCLE_VIEWER_STATE_TABLE).upsert(
    {
      viewer_user_id: user.id,
      last_seen_at: seenAt,
      updated_at: seenAt,
    },
    { onConflict: 'viewer_user_id' },
  );

  if (error) return { ok: false, error: readStateError() };
  return { ok: true, lastSeenAt: seenAt };
}

/**
 * Private unread summary for navigation. Never exposes actor-facing receipts.
 * Counts raw activity rows newer than last_seen for current Connections only.
 * Visibility of unpublished targets is refined on the feed page itself.
 */
export async function getCircleUnreadSummary(
  supabase: SupabaseClient,
): Promise<CircleUnreadSummary> {
  const empty: CircleUnreadSummary = { count: 0, badgeLabel: '', lastSeenAt: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const { data: viewerProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle();
  const viewerProfileId = viewerProfile?.id ?? null;

  const [{ data: state }, { data: connections }] = await Promise.all([
    supabase
      .from(CIRCLE_VIEWER_STATE_TABLE)
      .select('last_seen_at')
      .eq('viewer_user_id', user.id)
      .maybeSingle(),
    supabase
      .from('saved_connections')
      .select('saved_profile_id')
      .eq('owner_user_id', user.id),
  ]);

  const connectionIds = (connections ?? [])
    .map((row) => row.saved_profile_id as string)
    .filter((id) => id && id !== viewerProfileId);

  if (connectionIds.length === 0) {
    return {
      count: 0,
      badgeLabel: '',
      lastSeenAt: (state?.last_seen_at as string | null) ?? null,
    };
  }

  const lastSeenAt = (state?.last_seen_at as string | null) ?? null;
  const since = lastSeenAt && lastSeenAt !== '1970-01-01T00:00:00+00:00' ? lastSeenAt : null;

  let query = supabase
    .from(CIRCLE_ACTIVITY_TABLE)
    .select('id', { count: 'exact', head: true })
    .in('actor_profile_id', connectionIds)
    .in('event_type', [...CIRCLE_ACTIVITY_EVENT_TYPES]);

  if (since) {
    query = query.gt('created_at', since);
  }

  // Bound count work: prefer limited id select when head count is unreliable under RLS.
  const countRes = await query;
  let count = countRes.count ?? 0;

  if (countRes.error) {
    const fallback = supabase
      .from(CIRCLE_ACTIVITY_TABLE)
      .select('id')
      .in('actor_profile_id', connectionIds)
      .in('event_type', [...CIRCLE_ACTIVITY_EVENT_TYPES])
      .order('created_at', { ascending: false })
      .limit(UNREAD_SCAN_LIMIT);
    const withSince = since ? fallback.gt('created_at', since) : fallback;
    const { data } = await withSince;
    count = data?.length ?? 0;
  }

  // Soft-cap display scan so badge cannot imply huge engagement.
  if (count > CIRCLE_UNREAD_BADGE_CAP) {
    count = CIRCLE_UNREAD_BADGE_CAP + 1;
  }

  return {
    count: Math.max(0, count),
    badgeLabel: formatCircleUnreadBadge(count),
    lastSeenAt,
  };
}

export function isActivityNewSince(createdAt: string, lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return true;
  const created = Date.parse(createdAt);
  const seen = Date.parse(lastSeenAt);
  if (Number.isNaN(created) || Number.isNaN(seen)) return false;
  return created > seen;
}

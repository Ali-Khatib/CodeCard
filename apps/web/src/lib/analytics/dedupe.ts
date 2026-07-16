/**
 * WS08-T004 — 30-second analytics event deduplication.
 *
 * Boundary (server time): a prior equivalent event with age < 30_000 ms is a
 * duplicate (ignored). Age >= 30_000 ms is accepted as a new event.
 *
 * Redis SET NX EX is preferred when available (atomic). Otherwise a recent-row
 * query against analytics_events is used (best-effort under concurrency).
 *
 * Time-spent events include duration/section in the key so legitimate heartbeat
 * deltas are not discarded as duplicates of each other.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getRedis } from '@/lib/rate-limit';

/** Centralized rolling window for equivalent analytics events. */
export const ANALYTICS_DEDUPE_WINDOW_MS = 30_000;

const DEDUPE_REDIS_PREFIX = 'codecard:analytics:dedupe:';

export function normalizeAnalyticsSessionId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const sessionId = raw.trim();
  if (sessionId.length < 8 || sessionId.length > 64) return null;
  if (!/^[A-Za-z0-9._-]+$/.test(sessionId)) return null;
  return sessionId;
}

type DedupeInput = {
  event_type: string;
  session_id?: string | null;
  profile_id?: string | null;
  project_id?: string | null;
  research_paper_id?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  section_name?: string | null;
  source?: string | null;
  metadata?: Record<string, unknown> | null;
};

function resolveTarget(input: DedupeInput): { targetType: string; targetId: string } | null {
  const targetType =
    input.target_type ??
    (input.research_paper_id ? 'research' : input.project_id ? 'project' : input.profile_id ? 'profile' : null);
  const targetId =
    input.target_id ?? input.research_paper_id ?? input.project_id ?? input.profile_id ?? null;
  if (!targetType || !targetId) return null;
  return { targetType, targetId };
}

function qualifier(input: DedupeInput): string {
  const parts: string[] = [];
  if (input.event_type === 'link_click') {
    parts.push(`cat:${String(input.metadata?.link_category ?? '')}`);
    parts.push(`kind:${String(input.metadata?.link_kind ?? '')}`);
  }
  if (
    input.event_type === 'project_time_spent' ||
    input.event_type === 'project_section_time_spent' ||
    input.event_type === 'time_spent_on_research'
  ) {
    parts.push(`sec:${String(input.metadata?.seconds ?? '')}`);
  }
  if (input.section_name) parts.push(`section:${input.section_name}`);
  if (input.source) parts.push(`src:${input.source}`);
  return parts.join('|');
}

/** Opaque dedupe key for equivalent events (type + target + session + qualifiers). */
export function buildAnalyticsDedupeKey(input: DedupeInput): string | null {
  const sessionId = normalizeAnalyticsSessionId(input.session_id);
  if (!sessionId) return null;
  const target = resolveTarget(input);
  if (!target) return null;
  return [input.event_type, target.targetType, target.targetId, sessionId, qualifier(input)].join('|');
}

async function hasRecentDuplicateInDatabase(
  supabase: SupabaseClient,
  input: DedupeInput,
  keyParts: { targetType: string; targetId: string; sessionId: string },
): Promise<boolean> {
  const since = new Date(Date.now() - ANALYTICS_DEDUPE_WINDOW_MS + 1).toISOString();
  // Age < 30s ⇒ duplicate. Using created_at > (now - 30s + 1ms) approximates exclusive 30s boundary.
  let query = supabase
    .from('analytics_events')
    .select('id')
    .eq('event_type', input.event_type)
    .eq('target_type', keyParts.targetType)
    .eq('target_id', keyParts.targetId)
    .eq('session_id', keyParts.sessionId)
    .gt('created_at', since)
    .limit(1);

  if (input.event_type === 'link_click' && typeof input.metadata?.link_category === 'string') {
    query = query.contains('metadata', { link_category: input.metadata.link_category });
  }

  if (input.section_name) {
    query = query.eq('section_name', input.section_name);
  }

  const { data } = await query.maybeSingle();
  return Boolean(data);
}

/**
 * Returns true when an equivalent event should be ignored (not inserted).
 * Missing/invalid session IDs skip dedupe (event may still be recorded).
 */
export async function isDuplicateAnalyticsEvent(
  supabase: SupabaseClient,
  input: DedupeInput,
): Promise<boolean> {
  const key = buildAnalyticsDedupeKey(input);
  if (!key) return false;

  const sessionId = normalizeAnalyticsSessionId(input.session_id);
  const target = resolveTarget(input);
  if (!sessionId || !target) return false;

  const redis = getRedis();
  if (redis) {
    const redisKey = `${DEDUPE_REDIS_PREFIX}${key}`;
    const ttlSeconds = Math.ceil(ANALYTICS_DEDUPE_WINDOW_MS / 1000);
    const claimed = await redis.set(redisKey, '1', { nx: true, ex: ttlSeconds });
    // Upstash returns "OK" when set; null when the key already exists.
    return claimed === null;
  }

  return hasRecentDuplicateInDatabase(supabase, input, {
    targetType: target.targetType,
    targetId: target.targetId,
    sessionId,
  });
}

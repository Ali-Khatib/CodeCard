import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ANALYTICS_DEDUPE_WINDOW_MS,
  buildAnalyticsDedupeKey,
  isDuplicateAnalyticsEvent,
  normalizeAnalyticsSessionId,
} from './dedupe';

const mockGetRedis = vi.fn();

vi.mock('@/lib/rate-limit', () => ({
  getRedis: () => mockGetRedis(),
}));

const PROFILE_ID = '11111111-1111-4111-8111-111111111111';
const PROJECT_ID = '22222222-2222-4222-8222-222222222222';
const SESSION_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SESSION_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('WS08-T004 analytics dedupe helpers', () => {
  it('exposes a single 30-second window constant', () => {
    expect(ANALYTICS_DEDUPE_WINDOW_MS).toBe(30_000);
  });

  it('normalizes safe session ids and rejects invalid ones', () => {
    expect(normalizeAnalyticsSessionId(SESSION_A)).toBe(SESSION_A);
    expect(normalizeAnalyticsSessionId('short')).toBeNull();
    expect(normalizeAnalyticsSessionId('x'.repeat(65))).toBeNull();
    expect(normalizeAnalyticsSessionId('bad session!')).toBeNull();
  });

  it('builds keys that isolate type, target, session, and link category', () => {
    const base = {
      event_type: 'profile_view',
      session_id: SESSION_A,
      profile_id: PROFILE_ID,
      target_type: 'profile' as const,
      target_id: PROFILE_ID,
    };
    const a = buildAnalyticsDedupeKey(base);
    const b = buildAnalyticsDedupeKey({ ...base, session_id: SESSION_B });
    const c = buildAnalyticsDedupeKey({
      ...base,
      event_type: 'link_click',
      metadata: { link_category: 'github', link_kind: 'profile' },
    });
    const d = buildAnalyticsDedupeKey({
      event_type: 'link_click',
      session_id: SESSION_A,
      profile_id: PROFILE_ID,
      project_id: PROJECT_ID,
      target_type: 'project',
      target_id: PROJECT_ID,
      metadata: { link_category: 'repo', link_kind: 'project' },
    });
    const e = buildAnalyticsDedupeKey({
      event_type: 'project_time_spent',
      session_id: SESSION_A,
      project_id: PROJECT_ID,
      profile_id: PROFILE_ID,
      target_type: 'project',
      target_id: PROJECT_ID,
      metadata: { seconds: 5 },
    });
    const f = buildAnalyticsDedupeKey({
      event_type: 'project_time_spent',
      session_id: SESSION_A,
      project_id: PROJECT_ID,
      profile_id: PROFILE_ID,
      target_type: 'project',
      target_id: PROJECT_ID,
      metadata: { seconds: 15 },
    });

    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(c).not.toBe(d);
    expect(e).not.toBe(f);
  });
});

describe('WS08-T004 isDuplicateAnalyticsEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses Redis NX for atomic claim when available', async () => {
    const set = vi.fn()
      .mockResolvedValueOnce('OK')
      .mockResolvedValueOnce(null);
    mockGetRedis.mockReturnValue({ set });

    const input = {
      event_type: 'profile_view',
      session_id: SESSION_A,
      profile_id: PROFILE_ID,
      target_type: 'profile' as const,
      target_id: PROFILE_ID,
    };

    await expect(isDuplicateAnalyticsEvent({} as never, input)).resolves.toBe(false);
    await expect(isDuplicateAnalyticsEvent({} as never, input)).resolves.toBe(true);
    expect(set).toHaveBeenCalledWith(
      expect.stringContaining('codecard:analytics:dedupe:'),
      '1',
      { nx: true, ex: 30 },
    );
  });

  it('falls back to a recent-event query without Redis', async () => {
    mockGetRedis.mockReturnValue(null);
    const maybeSingle = vi.fn()
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: { id: 'evt-1' } });
    const query: Record<string, unknown> = {};
    const self = () => query;
    query.select = vi.fn(self);
    query.eq = vi.fn(self);
    query.gt = vi.fn(self);
    query.limit = vi.fn(self);
    query.contains = vi.fn(self);
    query.maybeSingle = maybeSingle;
    const supabase = { from: vi.fn(() => query) };

    const input = {
      event_type: 'profile_view',
      session_id: SESSION_A,
      profile_id: PROFILE_ID,
      target_type: 'profile' as const,
      target_id: PROFILE_ID,
    };

    await expect(isDuplicateAnalyticsEvent(supabase as never, input)).resolves.toBe(false);
    await expect(isDuplicateAnalyticsEvent(supabase as never, input)).resolves.toBe(true);
    expect(query.gt).toHaveBeenCalledWith('created_at', expect.any(String));
  });
});

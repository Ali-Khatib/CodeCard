import { describe, expect, it, vi, beforeEach } from 'vitest';
import { loadOwnerAnalytics, loadOwnerAnalyticsTrends } from './analytics-queries';

const OWNER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PROFILE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_OWNER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

type QueryResult = { data: unknown; error?: unknown | null };

function makeBuilder(result: QueryResult) {
  const builder: {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    gte: ReturnType<typeof vi.fn>;
    lt: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    then: (onFulfilled: (value: QueryResult) => unknown) => Promise<unknown>;
  } = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    gte: vi.fn(),
    lt: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(async () => ({
      data: result.data,
      error: result.error ?? null,
    })),
    then(onFulfilled) {
      return Promise.resolve(onFulfilled({ data: result.data, error: result.error ?? null }));
    },
  };
  const self = () => builder;
  builder.select.mockImplementation(self);
  builder.eq.mockImplementation(self);
  builder.in.mockImplementation(self);
  builder.gte.mockImplementation(self);
  builder.lt.mockImplementation(self);
  builder.order.mockImplementation(self);
  return builder;
}

describe('WS08-T006 loadOwnerAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated callers', async () => {
    const from = vi.fn();
    const supabase = { from } as unknown as Parameters<typeof loadOwnerAnalytics>[0];
    await expect(loadOwnerAnalytics(supabase, null)).resolves.toEqual({
      ok: false,
      reason: 'unauthenticated',
    });
    expect(from).not.toHaveBeenCalled();
  });

  it('scopes profile lookup to owner_user_id and never trusts a client profile id', async () => {
    const profileQuery = makeBuilder({
      data: {
        id: PROFILE_ID,
        display_name: 'Alex',
        is_public: true,
        slug: 'alex',
      },
    });
    const emptyList = makeBuilder({ data: [] });
    const from = vi.fn((table: string) => {
      if (table === 'profiles') return profileQuery;
      return emptyList;
    });
    const supabase = { from } as unknown as Parameters<typeof loadOwnerAnalytics>[0];

    const result = await loadOwnerAnalytics(supabase, OWNER_ID);
    expect(result.ok).toBe(true);
    expect(profileQuery.eq).toHaveBeenCalledWith('owner_user_id', OWNER_ID);
    expect(profileQuery.eq).not.toHaveBeenCalledWith('owner_user_id', OTHER_OWNER);
    if (result.ok) {
      expect(result.summary.profileId).toBe(PROFILE_ID);
      expect(result.summary.profileViews).toBe(0);
    }
  });

  it('returns no_profile when the owner has no profile row', async () => {
    const profileQuery = makeBuilder({ data: null });
    const from = vi.fn(() => profileQuery);
    const supabase = { from } as unknown as Parameters<typeof loadOwnerAnalytics>[0];
    await expect(loadOwnerAnalytics(supabase, OWNER_ID)).resolves.toEqual({
      ok: false,
      reason: 'no_profile',
    });
  });

  it('returns query_failed on database errors', async () => {
    const profileQuery = makeBuilder({ data: null, error: { message: 'boom' } });
    const from = vi.fn(() => profileQuery);
    const supabase = { from } as unknown as Parameters<typeof loadOwnerAnalytics>[0];
    await expect(loadOwnerAnalytics(supabase, OWNER_ID)).resolves.toEqual({
      ok: false,
      reason: 'query_failed',
    });
  });
});

describe('WS08-T007 loadOwnerAnalyticsTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated callers and invalid ranges', async () => {
    const from = vi.fn();
    const supabase = { from } as unknown as Parameters<typeof loadOwnerAnalyticsTrends>[0];
    await expect(loadOwnerAnalyticsTrends(supabase, null, 7)).resolves.toEqual({
      ok: false,
      reason: 'unauthenticated',
    });
    await expect(
      loadOwnerAnalyticsTrends(supabase, OWNER_ID, 14 as 7),
    ).resolves.toEqual({ ok: false, reason: 'invalid_range' });
    expect(from).not.toHaveBeenCalled();
  });

  it('scopes events to the authenticated owner profile with UTC range filters', async () => {
    const now = new Date('2026-07-15T12:00:00.000Z');
    const profileQuery = makeBuilder({ data: { id: PROFILE_ID } });
    const eventsQuery = makeBuilder({
      data: [
        { event_type: 'profile_view', created_at: '2026-07-14T10:00:00.000Z' },
        { event_type: 'link_click', created_at: '2026-07-15T01:00:00.000Z' },
      ],
    });
    const from = vi.fn((table: string) => {
      if (table === 'profiles') return profileQuery;
      if (table === 'analytics_events') return eventsQuery;
      return makeBuilder({ data: [] });
    });
    const supabase = { from } as unknown as Parameters<typeof loadOwnerAnalyticsTrends>[0];

    const result = await loadOwnerAnalyticsTrends(supabase, OWNER_ID, 7, now);
    expect(result.ok).toBe(true);
    expect(profileQuery.eq).toHaveBeenCalledWith('owner_user_id', OWNER_ID);
    expect(eventsQuery.eq).toHaveBeenCalledWith('profile_id', PROFILE_ID);
    expect(eventsQuery.gte).toHaveBeenCalledWith('created_at', '2026-07-09T00:00:00.000Z');
    expect(eventsQuery.lt).toHaveBeenCalledWith('created_at', '2026-07-16T00:00:00.000Z');
    if (result.ok) {
      expect(result.trends.buckets).toHaveLength(7);
      expect(result.trends.totals.profileViews).toBe(1);
      expect(result.trends.totals.linkClicks).toBe(1);
      expect(
        result.trends.buckets.reduce((n, b) => n + b.profileViews + b.linkClicks, 0),
      ).toBe(2);
    }
  });

  it('returns query_failed without fabricating trend zeros on error', async () => {
    const profileQuery = makeBuilder({ data: { id: PROFILE_ID } });
    const eventsQuery = makeBuilder({ data: null, error: { message: 'db down' } });
    const from = vi.fn((table: string) => {
      if (table === 'profiles') return profileQuery;
      return eventsQuery;
    });
    const supabase = { from } as unknown as Parameters<typeof loadOwnerAnalyticsTrends>[0];
    await expect(loadOwnerAnalyticsTrends(supabase, OWNER_ID, 30)).resolves.toEqual({
      ok: false,
      reason: 'query_failed',
    });
  });
});

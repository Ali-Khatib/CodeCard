import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mockRateLimit = vi.fn();
const mockFrom = vi.fn();
const mockGetUser = vi.fn();
const mockGetRedis = vi.fn(() => null);

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRedis: () => mockGetRedis(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

const PROFILE_ID = '11111111-1111-4111-8111-111111111111';
const PROJECT_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_PROFILE_ID = '33333333-3333-4333-8333-333333333333';
const TENANT_ID = '44444444-4444-4444-8444-444444444444';

type Row = Record<string, unknown>;

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://codecard.app/api/analytics', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://codecard.app',
      'sec-fetch-site': 'same-origin',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function chainable(result: { data: Row | Row[] | null; error?: unknown | null }) {
  const builder = {
    select: vi.fn(),
    insert: vi.fn(async (_row?: Row) => ({ data: null, error: null })),
    eq: vi.fn(),
    gt: vi.fn(),
    gte: vi.fn(),
    limit: vi.fn(),
    contains: vi.fn(),
    maybeSingle: vi.fn(async () => ({
      data: Array.isArray(result.data) ? result.data[0] ?? null : result.data,
      error: result.error ?? null,
    })),
    single: vi.fn(async () => ({
      data: Array.isArray(result.data) ? result.data[0] ?? null : result.data,
      error: result.error ?? null,
    })),
  };
  const self = () => builder;
  builder.select.mockImplementation(self);
  builder.eq.mockImplementation(self);
  builder.gt.mockImplementation(self);
  builder.gte.mockImplementation(self);
  builder.limit.mockImplementation(self);
  builder.contains.mockImplementation(self);
  return builder;
}

describe('WS08-T002 POST /api/analytics link_click', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it('records a public profile link_click without persisting destination URLs', async () => {
    const profileQuery = chainable({
      data: { tenant_id: TENANT_ID },
    });
    const insertQuery = chainable({ data: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profileQuery;
      if (table === 'analytics_events') return insertQuery;
      return chainable({ data: null });
    });

    const response = await POST(
      makeRequest({
        event_type: 'link_click',
        profile_id: PROFILE_ID,
        target_type: 'profile',
        target_id: PROFILE_ID,
        session_id: 'sess-1',
        metadata: {
          link_category: 'github',
          link_kind: 'profile',
          url: 'https://github.com/someone/secret',
        },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, status: 'recorded' });
    expect(insertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'link_click',
        profile_id: PROFILE_ID,
        target_type: 'profile',
        target_id: PROFILE_ID,
        metadata: { link_category: 'github', link_kind: 'profile' },
      }),
    );
    const inserted = insertQuery.insert.mock.calls[0]?.[0];
    expect(inserted).toBeDefined();
    expect(JSON.stringify(inserted)).not.toContain('https://github.com');
  });

  it('records a published project link_click when profile ownership matches', async () => {
    const projectQuery = chainable({
      data: {
        tenant_id: TENANT_ID,
        profile_id: PROFILE_ID,
        is_published: true,
      },
    });
    const profileQuery = chainable({ data: { id: PROFILE_ID } });
    const insertQuery = chainable({ data: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'projects') return projectQuery;
      if (table === 'profiles') return profileQuery;
      if (table === 'analytics_events') return insertQuery;
      return chainable({ data: null });
    });

    const response = await POST(
      makeRequest({
        event_type: 'link_click',
        profile_id: PROFILE_ID,
        project_id: PROJECT_ID,
        target_type: 'project',
        target_id: PROJECT_ID,
        session_id: 'sess-2',
        metadata: { link_category: 'repo', link_kind: 'project' },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, status: 'recorded' });
    expect(projectQuery.eq).toHaveBeenCalledWith('profile_id', PROFILE_ID);
    expect(projectQuery.eq).toHaveBeenCalledWith('is_published', true);
    expect(insertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'link_click',
        target_type: 'project',
        target_id: PROJECT_ID,
        metadata: { link_category: 'repo', link_kind: 'project' },
      }),
    );
  });

  it('rejects unknown link categories', async () => {
    const response = await POST(
      makeRequest({
        event_type: 'link_click',
        profile_id: PROFILE_ID,
        metadata: { link_category: 'mailto', link_kind: 'profile' },
      }),
    );
    expect(response.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('ignores unpublished or cross-profile project targets', async () => {
    const projectQuery = chainable({ data: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'projects') return projectQuery;
      return chainable({ data: null });
    });

    const response = await POST(
      makeRequest({
        event_type: 'link_click',
        profile_id: OTHER_PROFILE_ID,
        project_id: PROJECT_ID,
        metadata: { link_category: 'live', link_kind: 'project' },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, status: 'ignored' });
    expect(projectQuery.eq).toHaveBeenCalledWith('profile_id', OTHER_PROFILE_ID);
  });

  it('ignores private profile targets', async () => {
    const profileQuery = chainable({ data: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profileQuery;
      return chainable({ data: null });
    });

    const response = await POST(
      makeRequest({
        event_type: 'link_click',
        profile_id: PROFILE_ID,
        metadata: { link_category: 'website', link_kind: 'profile' },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, status: 'ignored' });
    expect(profileQuery.eq).toHaveBeenCalledWith('is_public', true);
  });

  it('rejects malformed payloads via shared schema', async () => {
    const response = await POST(
      makeRequest({
        event_type: 'link_click',
        profile_id: 'not-a-uuid',
        metadata: { link_category: 'github', link_kind: 'profile' },
      }),
    );
    expect(response.status).toBe(422);
  });
});

const OWNER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_USER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('WS08-T003 POST /api/analytics owner self-view exclusion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it('records anonymous profile_view and ignores authenticated owner', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const publicEvents = chainable({ data: null });
    const analyticsEvents = chainable({ data: null });
    const profileQuery = chainable({ data: { tenant_id: TENANT_ID } });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profileQuery;
      if (table === 'public_profile_events') return publicEvents;
      if (table === 'analytics_events') return analyticsEvents;
      return chainable({ data: null });
    });

    const anon = await POST(
      makeRequest({
        event_type: 'profile_view',
        profile_id: PROFILE_ID,
        session_id: 'anon-1',
      }),
    );
    expect(anon.status).toBe(200);
    expect(publicEvents.insert).toHaveBeenCalled();

    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    mockGetUser.mockResolvedValue({ data: { user: { id: OWNER_ID } } });
    const ownerProfile = chainable({ data: { owner_user_id: OWNER_ID } });
    const ownerInserts = chainable({ data: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return ownerProfile;
      return ownerInserts;
    });

    const owner = await POST(
      makeRequest({
        event_type: 'profile_view',
        profile_id: PROFILE_ID,
        session_id: 'owner-1',
        metadata: { isOwner: false, ownerUserId: OTHER_USER_ID },
      }),
    );
    expect(owner.status).toBe(200);
    const ownerBody = await owner.json();
    expect(ownerBody).toEqual({ ok: true, status: 'ignored' });
    expect(ownerInserts.insert).not.toHaveBeenCalled();
    expect(JSON.stringify(ownerBody)).not.toContain(OWNER_ID);
  });

  it('counts authenticated non-owner profile_view', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: OTHER_USER_ID } } });
    let profileCalls = 0;
    const ownership = chainable({ data: { owner_user_id: OWNER_ID } });
    const publicProfile = chainable({ data: { tenant_id: TENANT_ID } });
    const publicEvents = chainable({ data: null });
    const analyticsEvents = chainable({ data: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        profileCalls += 1;
        return profileCalls === 1 ? ownership : publicProfile;
      }
      if (table === 'public_profile_events') return publicEvents;
      if (table === 'analytics_events') return analyticsEvents;
      return chainable({ data: null });
    });

    const response = await POST(
      makeRequest({
        event_type: 'profile_view',
        profile_id: PROFILE_ID,
        session_id: 'visitor-1',
      }),
    );
    expect(response.status).toBe(200);
    expect(publicEvents.insert).toHaveBeenCalled();
    expect(analyticsEvents.insert).toHaveBeenCalled();
  });

  it('ignores owner project_view and project_time_spent', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: OWNER_ID } } });
    const projectOwnership = chainable({ data: { owner_user_id: OWNER_ID } });
    const inserts = chainable({ data: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'projects') return projectOwnership;
      return inserts;
    });

    for (const event_type of ['project_view', 'project_time_spent'] as const) {
      const response = await POST(
        makeRequest({
          event_type,
          profile_id: PROFILE_ID,
          project_id: PROJECT_ID,
          target_type: 'project',
          target_id: PROJECT_ID,
          metadata: event_type === 'project_time_spent' ? { seconds: 12 } : undefined,
        }),
      );
      expect(await response.json()).toEqual({ ok: true, status: 'ignored' });
    }
    expect(inserts.insert).not.toHaveBeenCalled();
  });

  it('still records owner link_click', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: OWNER_ID } } });
    const profileQuery = chainable({ data: { tenant_id: TENANT_ID } });
    const insertQuery = chainable({ data: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profileQuery;
      if (table === 'analytics_events') return insertQuery;
      return chainable({ data: null });
    });

    const response = await POST(
      makeRequest({
        event_type: 'link_click',
        profile_id: PROFILE_ID,
        metadata: { link_category: 'github', link_kind: 'profile' },
      }),
    );
    expect(await response.json()).toEqual({ ok: true, status: 'recorded' });
    expect(insertQuery.insert).toHaveBeenCalled();
  });
});

describe('WS08-T004 POST /api/analytics deduplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it('ignores a duplicate profile_view within the 30-second window', async () => {
    const profileQuery = chainable({ data: { tenant_id: TENANT_ID } });
    const recent = chainable({ data: { id: 'existing-event' } });
    const inserts = chainable({ data: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profileQuery;
      if (table === 'analytics_events') return recent;
      return inserts;
    });

    const response = await POST(
      makeRequest({
        event_type: 'profile_view',
        profile_id: PROFILE_ID,
        session_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      }),
    );

    expect(await response.json()).toEqual({ ok: true, status: 'ignored' });
    expect(inserts.insert).not.toHaveBeenCalled();
    expect(recent.insert).not.toHaveBeenCalled();
  });

  it('records the first profile_view when no recent duplicate exists', async () => {
    const profileQuery = chainable({ data: { tenant_id: TENANT_ID } });
    const analytics = chainable({ data: null });
    const publicEvents = chainable({ data: null });
    let analyticsSelects = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profileQuery;
      if (table === 'public_profile_events') return publicEvents;
      if (table === 'analytics_events') {
        analyticsSelects += 1;
        // First call is the dedupe lookup (no row); later calls are inserts on same builder.
        if (analyticsSelects === 1) {
          return analytics;
        }
        return analytics;
      }
      return chainable({ data: null });
    });

    const response = await POST(
      makeRequest({
        event_type: 'profile_view',
        profile_id: PROFILE_ID,
        session_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      }),
    );

    expect(await response.json()).toEqual({ ok: true, status: 'recorded' });
    expect(publicEvents.insert).toHaveBeenCalled();
    expect(analytics.insert).toHaveBeenCalled();
  });
});

describe('WS08-T005 POST /api/analytics bot filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it('ignores Googlebot without inserting events', async () => {
    const inserts = chainable({ data: null });
    mockFrom.mockReturnValue(inserts);

    const response = await POST(
      makeRequest(
        {
          event_type: 'profile_view',
          profile_id: PROFILE_ID,
          session_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        },
        {
          'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        },
      ),
    );

    expect(await response.json()).toEqual({ ok: true, status: 'ignored' });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('does not trust a user-agent field in the JSON body', async () => {
    const profileQuery = chainable({ data: { tenant_id: TENANT_ID } });
    const analytics = chainable({ data: null });
    const publicEvents = chainable({ data: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profileQuery;
      if (table === 'public_profile_events') return publicEvents;
      if (table === 'analytics_events') return analytics;
      return chainable({ data: null });
    });

    const response = await POST(
      makeRequest({
        event_type: 'profile_view',
        profile_id: PROFILE_ID,
        session_id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        user_agent: 'Googlebot/2.1',
        metadata: { userAgent: 'Googlebot/2.1' },
      }),
    );

    expect(await response.json()).toEqual({ ok: true, status: 'recorded' });
    expect(analytics.insert).toHaveBeenCalled();
    const inserted = analytics.insert.mock.calls[0]?.[0];
    expect(inserted).toBeDefined();
    expect(JSON.stringify(inserted).toLowerCase()).not.toContain('googlebot');
  });
});

describe('WS08-T009 POST /api/analytics duration validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it('rejects oversized and non-integer time_spent durations', async () => {
    for (const seconds of [2, 1801, 3.5, -1] as const) {
      const response = await POST(
        makeRequest({
          event_type: 'project_time_spent',
          profile_id: PROFILE_ID,
          project_id: PROJECT_ID,
          target_type: 'project',
          target_id: PROJECT_ID,
          metadata: { seconds },
        }),
      );
      expect(response.status).toBe(400);
    }
  });
});

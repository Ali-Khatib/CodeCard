import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mockRateLimit = vi.fn();
const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
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

function makeRequest(body: unknown) {
  return new Request('https://codecard.app/api/analytics', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://codecard.app',
      'sec-fetch-site': 'same-origin',
    },
    body: JSON.stringify(body),
  });
}

function chainable(result: { data: Row | Row[] | null; error?: unknown | null }) {
  const builder: Record<string, unknown> = {};
  const self = () => builder;
  builder.select = vi.fn(self);
  builder.insert = vi.fn(async () => ({ data: null, error: null }));
  builder.eq = vi.fn(self);
  builder.maybeSingle = vi.fn(async () => ({
    data: Array.isArray(result.data) ? result.data[0] ?? null : result.data,
    error: result.error ?? null,
  }));
  builder.single = vi.fn(async () => ({
    data: Array.isArray(result.data) ? result.data[0] ?? null : result.data,
    error: result.error ?? null,
  }));
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
    const inserted = vi.mocked(insertQuery.insert).mock.calls[0]?.[0] as Row;
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

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { loadOwnerOverviewContent } from './overview-queries';

const OWNER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PROFILE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_OWNER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

type QueryResult = { data: unknown; error?: unknown | null };

function makeBuilder(result: QueryResult) {
  const builder: {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    then: (onFulfilled: (value: QueryResult) => unknown) => Promise<unknown>;
  } = {
    select: vi.fn(),
    eq: vi.fn(),
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
  builder.order.mockImplementation(self);
  return builder;
}

describe('WS09-T003 loadOwnerOverviewContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated callers', async () => {
    const from = vi.fn();
    const supabase = { from } as unknown as Parameters<typeof loadOwnerOverviewContent>[0];
    await expect(loadOwnerOverviewContent(supabase, null)).resolves.toEqual({
      ok: false,
      reason: 'unauthenticated',
    });
    expect(from).not.toHaveBeenCalled();
  });

  it('scopes profile and content to owner_user_id', async () => {
    const profileQuery = makeBuilder({ data: { id: PROFILE_ID } });
    const projectsQuery = makeBuilder({
      data: [
        {
          id: 'p1',
          title: 'Alpha',
          is_published: true,
          updated_at: '2026-07-01T00:00:00.000Z',
          created_at: '2026-06-01T00:00:00.000Z',
        },
      ],
    });
    const researchQuery = makeBuilder({ data: [] });
    const from = vi.fn((table: string) => {
      if (table === 'profiles') return profileQuery;
      if (table === 'projects') return projectsQuery;
      if (table === 'research_papers') return researchQuery;
      return makeBuilder({ data: [] });
    });
    const supabase = { from } as unknown as Parameters<typeof loadOwnerOverviewContent>[0];

    const result = await loadOwnerOverviewContent(supabase, OWNER_ID);
    expect(result.ok).toBe(true);
    expect(profileQuery.eq).toHaveBeenCalledWith('owner_user_id', OWNER_ID);
    expect(profileQuery.eq).not.toHaveBeenCalledWith('owner_user_id', OTHER_OWNER);
    expect(projectsQuery.eq).toHaveBeenCalledWith('profile_id', PROFILE_ID);
    expect(projectsQuery.eq).toHaveBeenCalledWith('owner_user_id', OWNER_ID);
    if (result.ok) {
      expect(result.projects.total).toBe(1);
      expect(result.projects.published).toBe(1);
      expect(result.projects.recent[0]?.href).toBe('/dashboard/projects/p1/edit');
      expect(result.research.total).toBe(0);
    }
  });

  it('returns query_failed without fabricating content', async () => {
    const profileQuery = makeBuilder({ data: { id: PROFILE_ID } });
    const projectsQuery = makeBuilder({ data: null, error: { message: 'boom' } });
    const researchQuery = makeBuilder({ data: [] });
    const from = vi.fn((table: string) => {
      if (table === 'profiles') return profileQuery;
      if (table === 'projects') return projectsQuery;
      return researchQuery;
    });
    const supabase = { from } as unknown as Parameters<typeof loadOwnerOverviewContent>[0];
    await expect(loadOwnerOverviewContent(supabase, OWNER_ID)).resolves.toEqual({
      ok: false,
      reason: 'query_failed',
    });
  });
});

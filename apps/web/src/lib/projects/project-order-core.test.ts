import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  executeReorderProjects,
  sortProjectsByEffectiveOrder,
} from './project-order-core';

describe('sortProjectsByEffectiveOrder', () => {
  it('uses explicit ordering rows first and appends unordered projects deterministically', () => {
    const projects = [
      { id: 'a', sort_order: 2, created_at: '2026-01-03T00:00:00.000Z' },
      { id: 'b', sort_order: 0, created_at: '2026-01-01T00:00:00.000Z' },
      { id: 'c', sort_order: 1, created_at: '2026-01-02T00:00:00.000Z' },
    ];

    const sorted = sortProjectsByEffectiveOrder(projects, [
      { project_id: 'c', sort_order: 0 },
      { project_id: 'a', sort_order: 1 },
    ]);

    expect(sorted.map((project) => project.id)).toEqual(['c', 'a', 'b']);
  });

  it('preserves published relative order after filtering unpublished projects', () => {
    const projects = [
      { id: 'draft', sort_order: 0, created_at: '2026-01-01T00:00:00.000Z' },
      { id: 'pub-b', sort_order: 1, created_at: '2026-01-02T00:00:00.000Z' },
      { id: 'pub-d', sort_order: 2, created_at: '2026-01-03T00:00:00.000Z' },
    ];

    const sorted = sortProjectsByEffectiveOrder(projects, [
      { project_id: 'draft', sort_order: 0 },
      { project_id: 'pub-b', sort_order: 1 },
      { project_id: 'pub-d', sort_order: 2 },
    ]).filter((project) => project.id.startsWith('pub-'));

    expect(sorted.map((project) => project.id)).toEqual(['pub-b', 'pub-d']);
  });
});

const PROJECT_ONE = '11111111-1111-4111-8111-111111111111';
const PROJECT_TWO = '22222222-2222-4222-8222-222222222222';

function createMockSupabase(options: {
  user?: { id: string } | null;
  ownedProjectIds?: string[];
  upsertError?: { message: string } | null;
  updateError?: { message: string } | null;
} = {}) {
  const ownedProjectIds = options.ownedProjectIds ?? [PROJECT_ONE, PROJECT_TWO];
  const upsert = vi.fn().mockResolvedValue({ error: options.upsertError ?? null });
  const update = vi.fn().mockResolvedValue({ error: options.updateError ?? null });

  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'profile-1',
                tenant_id: 'tenant-1',
                owner_user_id: 'user-1',
                slug: 'alex-chen',
                is_public: true,
              },
              error: null,
            }),
          })),
        })),
      };
    }

    if (table === 'projects') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: ownedProjectIds.map((id) => ({ id })),
                error: null,
              }),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ error: options.updateError ?? null }),
            })),
          })),
        })),
      };
    }

    if (table === 'project_orderings') {
      return {
        upsert,
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  return Object.assign(
    {
      from,
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: options.user === undefined ? { id: 'user-1' } : options.user },
          error: null,
        }),
      },
    },
    { upsert, update },
  ) as unknown as SupabaseClient & { upsert: ReturnType<typeof vi.fn> };
}

describe('executeReorderProjects', () => {
  it('denies unauthenticated reorder', async () => {
    const supabase = createMockSupabase({ user: null });
    const result = await executeReorderProjects(supabase, [PROJECT_ONE, PROJECT_TWO]);
    expect(result.error).toContain('signed in');
  });

  it('rejects duplicate IDs', async () => {
    const supabase = createMockSupabase();
    const result = await executeReorderProjects(supabase, [PROJECT_ONE, PROJECT_ONE]);
    expect(result.error).toBe('Could not reorder projects.');
  });

  it('rejects foreign IDs', async () => {
    const supabase = createMockSupabase();
    const result = await executeReorderProjects(supabase, [PROJECT_ONE, '33333333-3333-4333-8333-333333333333']);
    expect(result.error).toBe('Could not reorder projects.');
  });

  it('persists contiguous ordering rows and syncs project sort_order', async () => {
    const supabase = createMockSupabase();
    const result = await executeReorderProjects(supabase, [PROJECT_TWO, PROJECT_ONE]);
    expect(result.success).toBe(true);
    expect(supabase.upsert).toHaveBeenCalledWith(
      [
        {
          tenant_id: 'tenant-1',
          profile_id: 'profile-1',
          project_id: PROJECT_TWO,
          sort_order: 0,
        },
        {
          tenant_id: 'tenant-1',
          profile_id: 'profile-1',
          project_id: PROJECT_ONE,
          sort_order: 1,
        },
      ],
      { onConflict: 'profile_id,project_id' },
    );
  });
});

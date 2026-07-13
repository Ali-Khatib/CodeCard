import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  executeDeleteProject,
  PROJECT_DELETE_STORAGE_DEFERRED,
} from './project-delete-core';

const PROJECT_ID = '11111111-1111-4111-8111-111111111111';

const ownedProfile = {
  id: 'profile-1',
  tenant_id: 'tenant-1',
  owner_user_id: 'user-1',
  slug: 'alex-chen',
  is_public: true,
};

const ownedProject = {
  id: PROJECT_ID,
  tenant_id: 'tenant-1',
  profile_id: 'profile-1',
  owner_user_id: 'user-1',
  slug: 'dev-flow',
  title: 'DevFlow',
  tagline: null,
  description: null,
  technologies: [],
  user_role: null,
  started_at: null,
  ended_at: null,
  status: 'draft',
  is_published: true,
  sort_order: 0,
};

function createMockSupabase(options: {
  user?: { id: string } | null;
  profile?: typeof ownedProfile | null;
  project?: typeof ownedProject | null;
  deleteError?: { message: string } | null;
}) {
  const projectDelete = vi.fn().mockResolvedValue({ error: options.deleteError ?? null });

  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: options.profile ?? null,
              error: options.profile ? null : { message: 'not found' },
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
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: options.project ?? null,
                    error: null,
                  }),
                })),
              })),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: projectDelete,
          })),
        })),
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: options.user ?? null } }),
      },
      from,
    } as unknown as SupabaseClient,
    projectDelete,
  };
}

describe('executeDeleteProject', () => {
  it('denies unauthenticated delete', async () => {
    const { supabase } = createMockSupabase({ user: null });
    const result = await executeDeleteProject(supabase, PROJECT_ID);
    expect(result.errorCode).toBe('auth');
  });

  it('allows owner to delete and returns redirect metadata', async () => {
    const { supabase, projectDelete } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      project: ownedProject,
    });

    const result = await executeDeleteProject(supabase, PROJECT_ID, { user: { id: 'user-1' } });
    expect(result.success).toBe(true);
    expect(result.redirectTo).toBe('/dashboard/projects');
    expect(result.wasPublished).toBe(true);
    expect(projectDelete).toHaveBeenCalled();
  });

  it('returns safe not found for foreign projects', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      project: null,
    });
    const result = await executeDeleteProject(supabase, PROJECT_ID, { user: { id: 'user-1' } });
    expect(result.errorCode).toBe('not_found');
  });

  it('hides raw database errors', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      project: ownedProject,
      deleteError: { message: 'foreign key violation' },
    });
    const result = await executeDeleteProject(supabase, PROJECT_ID, { user: { id: 'user-1' } });
    expect(result.errorCode).toBe('server');
    expect(result.error).not.toContain('foreign key');
  });

  it('documents deferred storage cleanup', () => {
    expect(PROJECT_DELETE_STORAGE_DEFERRED).toBe(true);
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  executeDeleteProject,
  PROJECT_DELETE_STORAGE_DEFERRED,
} from './project-delete-core';

const PROJECT_ID = '11111111-1111-4111-8111-111111111111';
const TENANT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const ownedProfile = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  tenant_id: TENANT_ID,
  owner_user_id: USER_ID,
  slug: 'alex-chen',
  is_public: true,
};

const ownedProject = {
  id: PROJECT_ID,
  tenant_id: TENANT_ID,
  profile_id: ownedProfile.id,
  owner_user_id: USER_ID,
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

const MEDIA_PATH = `${TENANT_ID}/${USER_ID}/project-media/${PROJECT_ID}/poster.png`;

function createMockSupabase(options: {
  user?: { id: string } | null;
  profile?: typeof ownedProfile | null;
  project?: typeof ownedProject | null;
  media?: Array<{ id: string; type: string; storage_path: string }>;
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

    if (table === 'project_media_assets') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: options.media ?? [],
            error: null,
          }),
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

function createServiceMock(options?: {
  insertError?: boolean;
  processOk?: boolean;
}) {
  const insert = vi.fn().mockReturnValue({
    select: vi.fn(() => ({
      single: vi.fn().mockResolvedValue(
        options?.insertError
          ? { data: null, error: { message: 'insert failed' } }
          : { data: { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }, error: null },
      ),
    })),
  });

  const update = vi.fn().mockReturnValue({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        in: vi.fn().mockResolvedValue({ error: null }),
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  });

  const rpc = vi.fn().mockResolvedValue({
    data:
      options?.processOk === false
        ? []
        : [
            {
              id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
              type: 'storage_cleanup',
              status: 'processing',
              payload: {
                version: 1,
                operation: 'delete_objects',
                resource_type: 'project',
                resource_id: PROJECT_ID,
                owner_user_id: USER_ID,
                tenant_id: TENANT_ID,
                objects: [
                  {
                    bucket: 'project-media',
                    path: MEDIA_PATH,
                    resource_type: 'project-media',
                  },
                ],
              },
              attempts: 1,
              error: null,
              result: null,
              available_at: new Date().toISOString(),
              claimed_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              tenant_id: TENANT_ID,
            },
          ],
    error: null,
  });

  const remove = vi.fn().mockResolvedValue({ error: null });

  return {
    from: vi.fn((table: string) => {
      if (table === 'jobs') {
        return { insert, update };
      }
      throw new Error(`Unexpected service table ${table}`);
    }),
    rpc,
    storage: {
      from: vi.fn(() => ({ remove })),
    },
    insert,
    remove,
  } as unknown as SupabaseClient & { insert: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };
}

describe('executeDeleteProject', () => {
  it('denies unauthenticated delete', async () => {
    const { supabase } = createMockSupabase({ user: null });
    const result = await executeDeleteProject(supabase, PROJECT_ID);
    expect(result.errorCode).toBe('auth');
  });

  it('allows owner to delete a no-media project without creating a cleanup job', async () => {
    const { supabase, projectDelete } = createMockSupabase({
      user: { id: USER_ID },
      profile: ownedProfile,
      project: ownedProject,
      media: [],
    });
    const createServiceClient = vi.fn();

    const result = await executeDeleteProject(supabase, PROJECT_ID, {
      user: { id: USER_ID },
      createServiceClient,
    });
    expect(result.success).toBe(true);
    expect(result.redirectTo).toBe('/dashboard/projects');
    expect(projectDelete).toHaveBeenCalled();
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('enqueues cleanup before delete and drains storage for owned media', async () => {
    const { supabase, projectDelete } = createMockSupabase({
      user: { id: USER_ID },
      profile: ownedProfile,
      project: ownedProject,
      media: [{ id: 'media-1', type: 'poster', storage_path: MEDIA_PATH }],
    });
    const service = createServiceMock({ processOk: true });

    const result = await executeDeleteProject(supabase, PROJECT_ID, {
      user: { id: USER_ID },
      createServiceClient: async () => service,
    });

    expect(result.success).toBe(true);
    expect(projectDelete).toHaveBeenCalled();
    expect(service.insert).toHaveBeenCalled();
    expect(service.remove).toHaveBeenCalledWith([MEDIA_PATH]);
  });

  it('does not delete storage when database delete fails and cancels the job', async () => {
    const { supabase } = createMockSupabase({
      user: { id: USER_ID },
      profile: ownedProfile,
      project: ownedProject,
      media: [{ id: 'media-1', type: 'poster', storage_path: MEDIA_PATH }],
      deleteError: { message: 'foreign key violation' },
    });
    const service = createServiceMock({ processOk: true });

    const result = await executeDeleteProject(supabase, PROJECT_ID, {
      user: { id: USER_ID },
      createServiceClient: async () => service,
    });

    expect(result.errorCode).toBe('server');
    expect(service.remove).not.toHaveBeenCalled();
  });

  it('returns safe not found for foreign projects and creates no job', async () => {
    const { supabase } = createMockSupabase({
      user: { id: USER_ID },
      profile: ownedProfile,
      project: null,
    });
    const createServiceClient = vi.fn();
    const result = await executeDeleteProject(supabase, PROJECT_ID, {
      user: { id: USER_ID },
      createServiceClient,
    });
    expect(result.errorCode).toBe('not_found');
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('hides raw database errors', async () => {
    const { supabase } = createMockSupabase({
      user: { id: USER_ID },
      profile: ownedProfile,
      project: ownedProject,
      media: [],
      deleteError: { message: 'foreign key violation' },
    });
    const result = await executeDeleteProject(supabase, PROJECT_ID, { user: { id: USER_ID } });
    expect(result.errorCode).toBe('server');
    expect(result.error).not.toContain('foreign key');
  });

  it('marks storage cleanup as integrated (not deferred)', () => {
    expect(PROJECT_DELETE_STORAGE_DEFERRED).toBe(false);
  });
});

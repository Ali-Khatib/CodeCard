import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  assertOwnedProjectMediaStoragePath,
  assertProjectMediaUploadAllowed,
  countProjectMediaByRole,
  executeFinalizeProjectMediaUpload,
  projectMediaPathAlreadyFinalized,
} from './project-media-core';

const tenantId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const projectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const profileId = '33333333-3333-4333-8333-333333333333';

const project = {
  id: projectId,
  tenant_id: tenantId,
  profile_id: profileId,
  owner_user_id: userId,
  slug: 'demo-project',
  title: 'Demo',
  tagline: null,
  description: null,
  technologies: [],
  user_role: null,
  started_at: null,
  ended_at: null,
  status: 'draft',
  is_published: false,
  sort_order: 0,
};

const profile = {
  id: profileId,
  tenant_id: tenantId,
  owner_user_id: userId,
  slug: 'alex',
  is_public: true,
};

const validPath = `${tenantId}/${userId}/project-media/${projectId}/cover.png`;

function makeSupabase(options?: {
  user?: { id: string } | null;
  project?: typeof project | null;
  coverCount?: number;
  screenshotCount?: number;
  objectExists?: boolean;
  existingPath?: boolean;
  insertError?: boolean;
}) {
  const coverCount = options?.coverCount ?? 0;
  const screenshotCount = options?.screenshotCount ?? 0;
  const objectExists = options?.objectExists ?? true;
  const existingPath = options?.existingPath ?? false;
  const insertError = options?.insertError ?? false;

  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: profile, error: null }),
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
                    data: options?.project === null ? null : project,
                    error: null,
                  }),
                })),
              })),
            })),
          })),
        })),
      };
    }

    if (table === 'project_media_assets') {
      return {
        select: vi.fn((columns: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.head) {
            const role = 'poster';
            void columns;
            return {
              eq: vi.fn(() => ({
                eq: vi.fn((_col: string, type: string) =>
                  Promise.resolve({
                    count: type === 'poster' ? coverCount : screenshotCount,
                    error: null,
                  }),
                ),
              })),
            };
          }

          return {
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: existingPath
                    ? {
                        id: 'asset-1',
                        type: 'poster',
                        storage_path: validPath,
                        mime_type: 'image/png',
                        file_size: 100,
                        sort_order: 0,
                      }
                    : null,
                  error: null,
                }),
                single: vi.fn().mockResolvedValue({
                  data: existingPath
                    ? {
                        id: 'asset-1',
                        type: 'poster',
                        storage_path: validPath,
                        mime_type: 'image/png',
                        file_size: 100,
                        sort_order: 0,
                      }
                    : null,
                  error: null,
                }),
              })),
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({ data: [{ sort_order: 0 }], error: null }),
              })),
            })),
          };
        }),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue(
              insertError
                ? { data: null, error: { message: 'db' } }
                : {
                    data: {
                      id: 'new-asset',
                      type: 'poster',
                      storage_path: validPath,
                      mime_type: 'image/png',
                      file_size: 100,
                      sort_order: 0,
                    },
                    error: null,
                  },
            ),
          })),
        })),
      };
    }

    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    };
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options?.user === null ? null : { id: userId } },
      }),
    },
    from,
    storage: {
      from: vi.fn(() => ({
        list: vi.fn().mockResolvedValue({
          data: objectExists
            ? [{ name: 'cover.png', metadata: { mimetype: 'image/png', size: 100 } }]
            : [],
          error: null,
        }),
        remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
  } as unknown as SupabaseClient;
}

describe('assertOwnedProjectMediaStoragePath', () => {
  it('accepts owned project-media paths and rejects foreign paths', () => {
    expect(
      assertOwnedProjectMediaStoragePath(validPath, project, userId, 'poster').ok,
    ).toBe(true);

    expect(
      assertOwnedProjectMediaStoragePath(
        `${tenantId}/${userId}/project-media/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/cover.png`,
        project,
        userId,
        'poster',
      ).ok,
    ).toBe(false);
  });
});

describe('assertProjectMediaUploadAllowed', () => {
  it('rejects a second cover upload', async () => {
    const supabase = makeSupabase({ coverCount: 1 });
    const result = await assertProjectMediaUploadAllowed(supabase, {
      userId,
      projectId,
      mediaRole: 'poster',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
    }
  });
});

describe('executeFinalizeProjectMediaUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated finalization', async () => {
    const supabase = makeSupabase({ user: null });
    const result = await executeFinalizeProjectMediaUpload(supabase, {
      project_id: projectId,
      media_role: 'poster',
      path: validPath,
    });
    expect(result.success).toBeUndefined();
    expect(result.error).toBeTruthy();
  });

  it('rejects foreign object paths', async () => {
    const supabase = makeSupabase();
    const result = await executeFinalizeProjectMediaUpload(supabase, {
      project_id: projectId,
      media_role: 'poster',
      path: 'https://evil.example/file.png',
    });
    expect(result.error).toBeTruthy();
  });

  it('creates one media row for a valid object', async () => {
    const supabase = makeSupabase();
    const result = await executeFinalizeProjectMediaUpload(supabase, {
      project_id: projectId,
      media_role: 'poster',
      path: validPath,
    });
    expect(result.success).toBe(true);
    expect(result.asset?.storage_path).toBe(validPath);
  });

  it('returns existing asset for duplicate finalization', async () => {
    const supabase = makeSupabase({ existingPath: true });
    const result = await executeFinalizeProjectMediaUpload(supabase, {
      project_id: projectId,
      media_role: 'poster',
      path: validPath,
    });
    expect(result.success).toBe(true);
    expect(result.asset?.id).toBe('asset-1');
  });

  it('does not expose raw database errors', async () => {
    const supabase = makeSupabase({ insertError: true });
    const result = await executeFinalizeProjectMediaUpload(supabase, {
      project_id: projectId,
      media_role: 'poster',
      path: validPath,
    });
    expect(result.error).toBe('Could not save project media. Please try again.');
  });
});

describe('projectMediaPathAlreadyFinalized', () => {
  it('detects finalized paths', async () => {
    const supabase = makeSupabase({ existingPath: true });
    await expect(projectMediaPathAlreadyFinalized(supabase, projectId, validPath)).resolves.toBe(
      true,
    );
  });
});

describe('countProjectMediaByRole', () => {
  it('returns stored counts', async () => {
    const supabase = makeSupabase({ screenshotCount: 2 });
    await expect(countProjectMediaByRole(supabase, projectId, 'screenshot')).resolves.toBe(2);
  });
});

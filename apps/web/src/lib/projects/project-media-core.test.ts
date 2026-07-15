import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  assertOwnedProjectMediaStoragePath,
  assertProjectMediaUploadAllowed,
  countProjectMediaByRole,
  executeDeleteProjectScreenshot,
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
const replacementPath = `${tenantId}/${userId}/project-media/${projectId}/cover-new.png`;
const screenshotPath = `${tenantId}/${userId}/project-media/${projectId}/shot.png`;

function makeSupabase(options?: {
  user?: { id: string } | null;
  project?: typeof project | null;
  coverCount?: number;
  screenshotCount?: number;
  objectExists?: boolean;
  existingPath?: boolean;
  existingCover?: { id: string; storage_path: string } | null;
  insertError?: boolean;
  updateError?: boolean;
  deleteError?: boolean;
  asset?: {
    id: string;
    type: string;
    storage_path: string;
    sort_order: number;
  } | null;
  removeError?: boolean;
}) {
  const coverCount = options?.coverCount ?? 0;
  const screenshotCount = options?.screenshotCount ?? 0;
  const objectExists = options?.objectExists ?? true;
  const existingPath = options?.existingPath ?? false;
  const insertError = options?.insertError ?? false;
  const updateError = options?.updateError ?? false;
  const deleteError = options?.deleteError ?? false;
  const existingCover =
    options?.existingCover === undefined
      ? coverCount > 0
        ? {
            id: 'cover-1',
            storage_path: validPath,
          }
        : null
      : options.existingCover;
  const remove = vi.fn().mockResolvedValue({
    error: options?.removeError ? { message: 'cleanup failed' } : null,
  });

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
            eq: vi.fn((col: string, value: string) => {
              if (col === 'id') {
                return {
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data:
                        options?.asset === undefined
                          ? {
                              id: value,
                              type: 'screenshot',
                              storage_path: screenshotPath,
                              sort_order: 0,
                            }
                          : options.asset,
                      error: null,
                    }),
                  })),
                };
              }

              return {
                eq: vi.fn((_col2: string, typeOrPath: string) => {
                  if (typeOrPath === 'poster' || typeOrPath === 'screenshot') {
                    return {
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: typeOrPath === 'poster' && existingCover
                          ? {
                              id: existingCover.id,
                              type: 'poster',
                              storage_path: existingCover.storage_path,
                              mime_type: 'image/png',
                              file_size: 100,
                              sort_order: 0,
                            }
                          : null,
                        error: null,
                      }),
                      order: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue({
                          data: [{ sort_order: 0 }],
                          error: null,
                        }),
                      })),
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
                    };
                  }

                  return {
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
                  };
                }),
                order: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue({ data: [{ sort_order: 0 }], error: null }),
                })),
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
              };
            }),
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
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue(
                    updateError
                      ? { data: null, error: { message: 'db' } }
                      : {
                          data: {
                            id: existingCover?.id ?? 'cover-1',
                            type: 'poster',
                            storage_path: replacementPath,
                            mime_type: 'image/png',
                            file_size: 100,
                            sort_order: 0,
                          },
                          error: null,
                        },
                  ),
                })),
              })),
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: existingCover?.id ?? 'cover-1',
                    type: 'poster',
                    storage_path: replacementPath,
                    mime_type: 'image/png',
                    file_size: 100,
                    sort_order: 0,
                  },
                  error: null,
                }),
              })),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                error: deleteError ? { message: 'db' } : null,
              }),
            })),
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
        list: vi.fn((_folder: string, opts?: { search?: string }) =>
          Promise.resolve({
            data: objectExists
              ? [
                  {
                    name: opts?.search ?? 'cover.png',
                    metadata: { mimetype: 'image/png', size: 100 },
                  },
                ]
              : [],
            error: null,
          }),
        ),
        remove,
      })),
    },
    remove,
  } as unknown as SupabaseClient & { remove: ReturnType<typeof vi.fn> };
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
  it('allows cover upload when a cover already exists so replacement can finalize', async () => {
    const supabase = makeSupabase({ coverCount: 1 });
    const result = await assertProjectMediaUploadAllowed(supabase, {
      userId,
      projectId,
      mediaRole: 'poster',
    });
    expect(result.ok).toBe(true);
  });

  it('still enforces screenshot capacity', async () => {
    const supabase = makeSupabase({ screenshotCount: 12 });
    const result = await assertProjectMediaUploadAllowed(supabase, {
      userId,
      projectId,
      mediaRole: 'screenshot',
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

  it('creates one media row for a valid initial cover', async () => {
    const supabase = makeSupabase({ coverCount: 0, existingCover: null });
    const result = await executeFinalizeProjectMediaUpload(supabase, {
      project_id: projectId,
      media_role: 'poster',
      path: validPath,
    });
    expect(result.success).toBe(true);
    expect(result.asset?.storage_path).toBe(validPath);
  });

  it('replaces an existing cover and removes the old object after DB success', async () => {
    const supabase = makeSupabase({
      coverCount: 1,
      existingCover: { id: 'cover-1', storage_path: validPath },
    });
    const result = await executeFinalizeProjectMediaUpload(supabase, {
      project_id: projectId,
      media_role: 'poster',
      path: replacementPath,
    });

    expect(result.success).toBe(true);
    expect(result.replaced).toBe(true);
    expect(supabase.remove).toHaveBeenCalledWith([validPath]);
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
    const supabase = makeSupabase({ insertError: true, existingCover: null });
    const result = await executeFinalizeProjectMediaUpload(supabase, {
      project_id: projectId,
      media_role: 'poster',
      path: validPath,
    });
    expect(result.error).toBe('Could not save project media. Please try again.');
  });
});

describe('executeDeleteProjectScreenshot', () => {
  it('deletes an owned screenshot and removes its storage object', async () => {
    const supabase = makeSupabase({
      asset: {
        id: 'shot-1',
        type: 'screenshot',
        storage_path: screenshotPath,
        sort_order: 0,
      },
    });

    const result = await executeDeleteProjectScreenshot(supabase, {
      projectId,
      assetId: 'shot-1',
    });

    expect(result.success).toBe(true);
    expect(supabase.remove).toHaveBeenCalledWith([screenshotPath]);
  });

  it('returns a safe confirmed state when the screenshot is already deleted', async () => {
    const supabase = makeSupabase({ asset: null });
    const result = await executeDeleteProjectScreenshot(supabase, {
      projectId,
      assetId: 'shot-missing',
    });
    expect(result.success).toBe(true);
    expect(result.alreadyDeleted).toBe(true);
  });

  it('denies unauthenticated deletion', async () => {
    const supabase = makeSupabase({ user: null });
    const result = await executeDeleteProjectScreenshot(supabase, {
      projectId,
      assetId: 'shot-1',
    });
    expect(result.error).toBe('You must be signed in.');
  });

  it('rejects deleting a non-screenshot asset', async () => {
    const supabase = makeSupabase({
      asset: {
        id: 'cover-1',
        type: 'poster',
        storage_path: validPath,
        sort_order: 0,
      },
    });
    const result = await executeDeleteProjectScreenshot(supabase, {
      projectId,
      assetId: 'cover-1',
    });
    expect(result.error).toBe('Could not delete this screenshot. Please try again.');
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

import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  executeCreateProjectLink,
  executeDeleteProjectLink,
  executeUpdateProjectLink,
} from './project-link-core';

const profile = {
  id: 'profile-1',
  tenant_id: 'tenant-1',
  owner_user_id: 'user-1',
  slug: 'alex-chen',
  is_public: true,
};

const project = {
  id: 'project-1',
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
  is_published: false,
  sort_order: 0,
};

function makeFormData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

function createMockSupabase(options: {
  user?: { id: string } | null;
  profile?: typeof profile | null;
  project?: typeof project | null;
  links?: Array<{ id: string; type: string; label: string | null; url: string; sort_order: number }>;
  insertResult?: { id: string; type: string; label: string | null; url: string; sort_order: number } | null;
  updateError?: { message?: string } | null;
} = {}) {
  const resolvedProfile = options.profile === undefined ? profile : options.profile;
  const resolvedProject = options.project === undefined ? project : options.project;
  const links = [...(options.links ?? [])];
  const insert = vi.fn();
  const update = vi.fn();
  const del = vi.fn();

  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: resolvedProfile,
              error: resolvedProfile ? null : { message: 'not found' },
            }),
          })),
        })),
      };
    }

    if (table === 'projects') {
      const chain = {
        eq: vi.fn(() => chain),
        maybeSingle: vi.fn().mockResolvedValue({
          data: resolvedProject,
          error: null,
        }),
      };
      return {
        select: vi.fn(() => chain),
      };
    }

    if (table === 'project_links') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((column: string, value: string) => {
            if (column === 'project_id') {
              return {
                order: vi.fn().mockResolvedValue({ data: links, error: null }),
                eq: vi.fn((_col: string, linkId: string) => ({
                  maybeSingle: vi.fn().mockImplementation(async () => {
                    const found = links.find((link) => link.id === linkId);
                    return { data: found ?? null, error: null };
                  }),
                  single: vi.fn().mockImplementation(async () => {
                    const found = links.find((link) => link.id === linkId);
                    return { data: found ?? null, error: found ? null : { message: 'not found' } };
                  }),
                })),
              };
            }
            return {
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }),
        })),
        insert: vi.fn((payload: unknown) => {
          insert(payload);
          const row = options.insertResult ?? {
            id: 'link-new',
            type: 'repo',
            label: 'GitHub',
            url: 'https://github.com/a/b',
            sort_order: links.length,
          };
          links.push(row);
          return {
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: row, error: null }),
            })),
          };
        }),
        update: vi.fn((payload: unknown) => {
          update(payload);
          return {
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: links[0] ?? null,
                    error: options.updateError ?? null,
                  }),
                })),
              })),
            })),
          };
        }),
        delete: vi.fn(() => {
          del();
          return {
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            })),
          };
        }),
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  const auth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: options.user === undefined ? { id: 'user-1' } : options.user },
      error: null,
    }),
  };

  const supabase = {
    from,
    auth,
  };

  return Object.assign(supabase, { insert, update, del }) as unknown as SupabaseClient & {
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
  };
}

describe('project link mutations', () => {
  it('denies unauthenticated create', async () => {
    const supabase = createMockSupabase({ user: null });
    const result = await executeCreateProjectLink(
      supabase,
      makeFormData({
        project_id: 'project-1',
        type: 'repo',
        url: 'https://github.com/a/b',
      }),
    );
    expect(result.error).toContain('signed in');
  });

  it('allows owner create and appends sort order', async () => {
    const supabase = createMockSupabase({
      links: [],
      insertResult: {
        id: 'link-1',
        type: 'repo',
        label: null,
        url: 'https://github.com/a/b',
        sort_order: 0,
      },
    });

    const result = await executeCreateProjectLink(
      supabase,
      makeFormData({
        project_id: 'project-1',
        type: 'repo',
        url: 'https://github.com/a/b',
      }),
    );

    expect(result.success).toBe(true);
    expect(result.link?.url).toBe('https://github.com/a/b');
  });

  it('rejects foreign project access with a safe message', async () => {
    const supabase = createMockSupabase({ project: null });
    const result = await executeCreateProjectLink(
      supabase,
      makeFormData({
        project_id: 'foreign-project',
        type: 'repo',
        url: 'https://github.com/a/b',
      }),
    );
    expect(result.error).toBe('Project not found.');
  });

  it('rejects duplicate links', async () => {
    const supabase = createMockSupabase({
      links: [
        {
          id: 'link-1',
          type: 'repo',
          label: null,
          url: 'https://github.com/a/b',
          sort_order: 0,
        },
      ],
    });

    const result = await executeCreateProjectLink(
      supabase,
      makeFormData({
        project_id: 'project-1',
        type: 'repo',
        url: 'https://github.com/a/b',
      }),
    );

    expect(result.error).toContain('already exists');
  });

  it('rejects javascript URLs', async () => {
    const supabase = createMockSupabase({ links: [] });
    const result = await executeCreateProjectLink(
      supabase,
      makeFormData({
        project_id: 'project-1',
        type: 'other',
        url: 'javascript:alert(1)',
      }),
    );
    expect(result.success).toBeFalsy();
    expect(result.fieldErrors?.url).toBeTruthy();
  });

  it('updates owned links only', async () => {
    const supabase = createMockSupabase({
      links: [
        {
          id: 'link-1',
          type: 'repo',
          label: null,
          url: 'https://github.com/a/b',
          sort_order: 0,
        },
      ],
    });

    const result = await executeUpdateProjectLink(
      supabase,
      makeFormData({
        project_id: 'project-1',
        link_id: 'link-1',
        type: 'repo',
        label: 'Repo',
        url: 'https://github.com/a/b',
      }),
    );

    expect(result.success).toBe(true);
  });

  it('deletes owned links safely', async () => {
    const supabase = createMockSupabase({
      links: [
        {
          id: 'link-1',
          type: 'live',
          label: null,
          url: 'https://demo.example',
          sort_order: 0,
        },
      ],
    });

    const result = await executeDeleteProjectLink(supabase, {
      projectId: 'project-1',
      linkId: 'link-1',
    });

    expect(result.success).toBe(true);
  });
});

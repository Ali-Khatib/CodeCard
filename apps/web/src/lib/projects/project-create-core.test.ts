import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PROJECT_DOMAIN_OPTIONS, PROJECT_FOCUS_AREA_OPTIONS } from '@codecard/validation';
import {
  executeCreateProject,
  mapProjectCreateDbError,
  parseCreateProjectFormData,
  validateCreateProjectPayload,
} from './project-create-core';

function makeFormData(entries: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        fd.append(key, item);
      }
    } else {
      fd.set(key, value);
    }
  }
  return fd;
}

const validEntries: Record<string, string | string[]> = {
  title: 'DevFlow',
  slug: 'dev-flow',
  tagline: 'Ship faster',
  description: 'Workflow tooling',
  technologies: ['TypeScript', 'Next.js'],
  domains: [PROJECT_DOMAIN_OPTIONS[0]],
  focus_areas: [PROJECT_FOCUS_AREA_OPTIONS[0]],
  user_role: 'Lead Engineer',
  started_at: '2024-01-15',
  ended_at: '2024-06-01',
  status: 'draft',
};

function createMockSupabase(options: {
  user?: { id: string } | null;
  profile?: Record<string, unknown> | null;
  projectCount?: number;
  insertError?: { code?: string; message?: string } | null;
  domainsError?: { code?: string; message?: string } | null;
  focusError?: { code?: string; message?: string } | null;
}) {
  let insertedProjectPayload: unknown;
  const projectDelete = vi.fn().mockResolvedValue({ error: null });
  const domainsInsert = vi.fn().mockResolvedValue({ error: options.domainsError ?? null });
  const focusInsert = vi.fn().mockResolvedValue({ error: options.focusError ?? null });

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
          eq: vi.fn(() =>
            Promise.resolve({
              count: options.projectCount ?? 0,
              error: null,
            }),
          ),
        })),
        insert: vi.fn((payload: unknown) => {
          insertedProjectPayload = payload;
          return {
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: options.insertError ? null : { id: 'project-new' },
                error: options.insertError ?? null,
              }),
            })),
          };
        }),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: projectDelete,
          })),
        })),
      };
    }

    if (table === 'project_domains') {
      return {
        insert: domainsInsert,
      };
    }

    if (table === 'project_focus_areas') {
      return {
        insert: focusInsert,
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: options.user ?? null } }),
    },
    from,
  } as unknown as SupabaseClient;

  return { supabase, insertedProjectPayload: () => insertedProjectPayload, domainsInsert, focusInsert, projectDelete };
}

const ownedProfile = {
  id: 'profile-1',
  tenant_id: 'tenant-1',
  owner_user_id: 'user-1',
};

describe('parseCreateProjectFormData', () => {
  it('reads only known project fields', () => {
    const fd = makeFormData({
      ...validEntries,
      owner_user_id: 'evil',
      tenant_id: 'evil',
      profile_id: 'evil',
      is_published: 'on',
      plan: 'pro',
    });

    const parsed = parseCreateProjectFormData(fd);
    expect(parsed.title).toBe('DevFlow');
    expect(parsed.slug).toBe('dev-flow');
    expect(parsed.technologies).toEqual(['TypeScript', 'Next.js']);
    expect(parsed.domains).toEqual([PROJECT_DOMAIN_OPTIONS[0]]);
    expect(parsed.focus_areas).toEqual([PROJECT_FOCUS_AREA_OPTIONS[0]]);
    expect(parsed).not.toHaveProperty('owner_user_id');
  });
});

describe('validateCreateProjectPayload', () => {
  it('rejects client ownership fields in object payloads', () => {
    const result = validateCreateProjectPayload({
      ...validEntries,
      owner_user_id: 'evil',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.state.error).toContain('owner_user_id');
    }
  });

  it('rejects client tenant and profile identifiers', () => {
    expect(
      validateCreateProjectPayload({ ...validEntries, tenant_id: 'evil' }).success,
    ).toBe(false);
    expect(
      validateCreateProjectPayload({ ...validEntries, profile_id: 'evil' }).success,
    ).toBe(false);
    expect(validateCreateProjectPayload({ ...validEntries, plan: 'pro' }).success).toBe(false);
    expect(
      validateCreateProjectPayload({ ...validEntries, is_published: true }).success,
    ).toBe(false);
  });
});

describe('mapProjectCreateDbError', () => {
  it('maps duplicate slug to friendly field error', () => {
    expect(mapProjectCreateDbError({ code: '23505' })).toEqual({
      fieldErrors: { slug: 'This project URL is already in use.' },
      error: 'This project URL is already in use.',
      errorCode: 'slug_taken',
    });
  });

  it('hides raw database errors', () => {
    expect(mapProjectCreateDbError({ message: 'duplicate key value violates unique constraint' })).toEqual({
      error: 'Could not create project. Please try again.',
      errorCode: 'server',
    });
  });
});

describe('executeCreateProject authorization', () => {
  it('denies unauthenticated create', async () => {
    const { supabase } = createMockSupabase({ user: null });
    const result = await executeCreateProject(supabase, makeFormData(validEntries));
    expect(result.success).toBeUndefined();
    expect(result.errorCode).toBe('auth');
  });

  it('denies create without profile', async () => {
    const { supabase } = createMockSupabase({ user: { id: 'user-1' }, profile: null });
    const result = await executeCreateProject(supabase, makeFormData(validEntries));
    expect(result.errorCode).toBe('auth');
  });

  it('rejects forbidden form fields', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
    });
    const fd = makeFormData({ ...validEntries, tenant_id: 'evil' });
    const result = await executeCreateProject(supabase, fd);
    expect(result.errorCode).toBe('validation');
  });
});

describe('executeCreateProject persistence', () => {
  it('creates project with authenticated owner and defaults unpublished', async () => {
    const { supabase, insertedProjectPayload, domainsInsert, focusInsert } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      projectCount: 2,
    });

    const result = await executeCreateProject(
      supabase,
      makeFormData(validEntries),
      { user: { id: 'user-1' } },
    );

    expect(result.success).toBe(true);
    expect(result.projectId).toBe('project-new');
    expect(result.redirectTo).toBe('/dashboard/projects');

    const insertCall = insertedProjectPayload();
    expect(insertCall).toMatchObject({
      tenant_id: 'tenant-1',
      profile_id: 'profile-1',
      owner_user_id: 'user-1',
      title: 'DevFlow',
      slug: 'dev-flow',
      is_published: false,
      status: 'draft',
      started_at: '2024-01-15',
      ended_at: '2024-06-01',
      sort_order: 2,
    });

    expect(domainsInsert).toHaveBeenCalledWith([
      {
        tenant_id: 'tenant-1',
        project_id: 'project-new',
        name: PROJECT_DOMAIN_OPTIONS[0],
      },
    ]);
    expect(focusInsert).toHaveBeenCalled();
  });

  it('returns slug field error on duplicate slug', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      insertError: { code: '23505', message: 'duplicate key value' },
    });

    const result = await executeCreateProject(supabase, makeFormData(validEntries), {
      user: { id: 'user-1' },
    });

    expect(result.fieldErrors?.slug).toBe('This project URL is already in use.');
    expect(result.error).not.toContain('duplicate');
  });

  it('rolls back project when domain insert fails', async () => {
    const { supabase, projectDelete } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      domainsError: { message: 'insert failed' },
    });

    const result = await executeCreateProject(supabase, makeFormData(validEntries), {
      user: { id: 'user-1' },
    });

    expect(result.errorCode).toBe('server');
    expect(projectDelete).toHaveBeenCalled();
  });

  it('rolls back project when focus-area insert fails', async () => {
    const { supabase, projectDelete } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      focusError: { message: 'insert failed' },
    });

    const result = await executeCreateProject(supabase, makeFormData(validEntries), {
      user: { id: 'user-1' },
    });

    expect(result.errorCode).toBe('server');
    expect(projectDelete).toHaveBeenCalled();
  });
});

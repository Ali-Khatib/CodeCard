import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PROJECT_DOMAIN_OPTIONS, PROJECT_FOCUS_AREA_OPTIONS } from '@codecard/validation';
import {
  executeUpdateProject,
  parseUpdateProjectFormData,
  validateUpdateProjectPayload,
} from './project-update-core';

const PROJECT_ID = '11111111-1111-4111-8111-111111111111';

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
  project_id: PROJECT_ID,
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
  tagline: 'Ship faster',
  description: 'Workflow tooling',
  technologies: ['TypeScript'],
  user_role: 'Lead Engineer',
  started_at: '2024-01-15',
  ended_at: '2024-06-01',
  status: 'draft',
  is_published: true,
  sort_order: 0,
};

function createMockSupabase(options: {
  user?: { id: string } | null;
  profile?: typeof ownedProfile | null;
  project?: typeof ownedProject | null;
  updateError?: { code?: string; message?: string } | null;
  relationInsertError?: boolean;
}) {
  let updatedPayload: unknown;
  const domainDelete = vi.fn().mockResolvedValue({ error: null });
  const focusDelete = vi.fn().mockResolvedValue({ error: null });
  const domainInsert = vi.fn().mockResolvedValue({
    error: options.relationInsertError ? { message: 'insert failed' } : null,
  });
  const focusInsert = vi.fn().mockResolvedValue({ error: null });

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
        update: vi.fn((payload: unknown) => {
          updatedPayload = payload;
          return {
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ error: options.updateError ?? null }),
            })),
          };
        }),
      };
    }

    if (table === 'project_domains') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [{ name: PROJECT_DOMAIN_OPTIONS[1] }],
            error: null,
          }),
        })),
        delete: vi.fn(() => ({
          eq: domainDelete,
        })),
        insert: domainInsert,
      };
    }

    if (table === 'project_focus_areas') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [{ name: PROJECT_FOCUS_AREA_OPTIONS[1] }],
            error: null,
          }),
        })),
        delete: vi.fn(() => ({
          eq: focusDelete,
        })),
        insert: focusInsert,
      };
    }

    if (table === 'circle_activity') {
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
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

  return { supabase, updatedPayload: () => updatedPayload, domainInsert, focusInsert };
}

describe('validateUpdateProjectPayload', () => {
  it('rejects client ownership fields', () => {
    const result = validateUpdateProjectPayload({
      ...validEntries,
      owner_user_id: 'evil',
    });
    expect(result.success).toBe(false);
  });
});

describe('executeUpdateProject authorization', () => {
  it('denies unauthenticated update', async () => {
    const { supabase } = createMockSupabase({ user: null });
    const result = await executeUpdateProject(supabase, makeFormData(validEntries));
    expect(result.errorCode).toBe('auth');
  });

  it('returns safe not found for foreign projects', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      project: null,
    });
    const result = await executeUpdateProject(supabase, makeFormData(validEntries), {
      user: { id: 'user-1' },
    });
    expect(result.errorCode).toBe('not_found');
    expect(result.error).toBe('Project not found.');
  });
});

describe('executeUpdateProject persistence', () => {
  it('updates owned project fields without changing publication state', async () => {
    const { supabase, updatedPayload } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      project: ownedProject,
    });

    const result = await executeUpdateProject(supabase, makeFormData(validEntries), {
      user: { id: 'user-1' },
    });

    expect(result.success).toBe(true);
    expect(result.projectId).toBe(PROJECT_ID);
    expect(updatedPayload()).toMatchObject({
      title: 'DevFlow',
      slug: 'dev-flow',
      status: 'draft',
      case_study_sections: {},
    });
    expect(updatedPayload()).not.toHaveProperty('is_published');
    expect(updatedPayload()).not.toHaveProperty('owner_user_id');
  });

  it('maps duplicate slug to friendly field error', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      project: ownedProject,
      updateError: { code: '23505', message: 'duplicate key' },
    });

    const result = await executeUpdateProject(supabase, makeFormData(validEntries), {
      user: { id: 'user-1' },
    });

    expect(result.fieldErrors?.slug).toBe('This project URL is already in use.');
  });

  it('fails safely when relation replacement fails', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      project: ownedProject,
      relationInsertError: true,
    });

    const result = await executeUpdateProject(supabase, makeFormData(validEntries), {
      user: { id: 'user-1' },
    });

    expect(result.errorCode).toBe('server');
    expect(result.error).not.toContain('insert failed');
  });
});

describe('parseUpdateProjectFormData', () => {
  it('reads project id and core fields', () => {
    const parsed = parseUpdateProjectFormData(makeFormData(validEntries));
    expect(parsed.project_id).toBe(PROJECT_ID);
    expect(parsed.domains).toEqual([PROJECT_DOMAIN_OPTIONS[0]]);
  });
});

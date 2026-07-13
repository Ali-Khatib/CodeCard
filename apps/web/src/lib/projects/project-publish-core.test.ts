import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  executePublishProject,
  executeUnpublishProject,
} from './project-publish-core';

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
  is_published: false,
  sort_order: 0,
};

function createMockSupabase(options: {
  user?: { id: string } | null;
  profile?: typeof ownedProfile | null;
  project?: typeof ownedProject | null;
  updateError?: { message: string } | null;
}) {
  let updatedPayload: unknown;

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

    throw new Error(`Unexpected table ${table}`);
  });

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: options.user ?? null } }),
      },
      from,
    } as unknown as SupabaseClient,
    updatedPayload: () => updatedPayload,
  };
}

describe('executePublishProject', () => {
  it('denies unauthenticated publish', async () => {
    const { supabase } = createMockSupabase({ user: null });
    const result = await executePublishProject(supabase, PROJECT_ID);
    expect(result.errorCode).toBe('auth');
  });

  it('publishes an owned project without changing lifecycle status', async () => {
    const { supabase, updatedPayload } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      project: ownedProject,
    });

    const result = await executePublishProject(supabase, PROJECT_ID, { user: { id: 'user-1' } });
    expect(result.success).toBe(true);
    expect(result.is_published).toBe(true);
    expect(updatedPayload()).toEqual({ is_published: true });
    expect(updatedPayload()).not.toHaveProperty('status');
  });

  it('blocks another user from publishing', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-2' },
      profile: null,
      project: null,
    });
    const result = await executePublishProject(supabase, PROJECT_ID, { user: { id: 'user-2' } });
    expect(result.errorCode).toBe('auth');
  });
});

describe('executeUnpublishProject', () => {
  it('unpublishes an owned project', async () => {
    const { supabase, updatedPayload } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      project: { ...ownedProject, is_published: true },
    });

    const result = await executeUnpublishProject(supabase, PROJECT_ID, { user: { id: 'user-1' } });
    expect(result.success).toBe(true);
    expect(result.is_published).toBe(false);
    expect(updatedPayload()).toEqual({ is_published: false });
  });
});

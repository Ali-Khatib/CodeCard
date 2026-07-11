import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { executePublishProfile, executeUnpublishProfile } from './profile-publish-core';

function createMockSupabase(options: {
  user?: { id: string } | null;
  profile?: { id: string; slug: string; is_public: boolean; owner_user_id: string } | null;
  updateError?: { message?: string } | null;
}) {
  const update = vi.fn().mockResolvedValue({ error: options.updateError ?? null });

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: options.user ?? null } }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: options.profile ?? null,
            error: options.profile ? null : { message: 'not found' },
          }),
        })),
      })),
      update: vi.fn((payload: unknown) => ({
        eq: vi.fn(() => {
          update(payload);
          return Promise.resolve({ error: options.updateError ?? null });
        }),
      })),
    })),
  } as unknown as SupabaseClient;

  return { supabase, update };
}

const ownedProfile = {
  id: 'profile-1',
  slug: 'alex-chen',
  is_public: false,
  owner_user_id: 'user-1',
};

describe('executePublishProfile', () => {
  it('denies unauthenticated publish', async () => {
    const { supabase } = createMockSupabase({ user: null });
    const result = await executePublishProfile(supabase);
    expect(result.error).toMatch(/signed in/i);
  });

  it('publishes the owned profile', async () => {
    const { supabase, update } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
    });

    const result = await executePublishProfile(supabase);
    expect(result.success).toBe(true);
    expect(result.is_public).toBe(true);
    expect(update).toHaveBeenCalledWith({ is_public: true });
  });

  it('is idempotent when already published', async () => {
    const { supabase, update } = createMockSupabase({
      user: { id: 'user-1' },
      profile: { ...ownedProfile, is_public: true },
    });

    const result = await executePublishProfile(supabase);
    expect(result.success).toBe(true);
    expect(update).not.toHaveBeenCalled();
  });
});

describe('executeUnpublishProfile', () => {
  it('unpublishes the owned profile', async () => {
    const { supabase, update } = createMockSupabase({
      user: { id: 'user-1' },
      profile: { ...ownedProfile, is_public: true },
    });

    const result = await executeUnpublishProfile(supabase);
    expect(result.success).toBe(true);
    expect(result.is_public).toBe(false);
    expect(update).toHaveBeenCalledWith({ is_public: false });
  });

  it('does not expose raw database errors', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: { ...ownedProfile, is_public: true },
      updateError: { message: 'postgres internal detail' },
    });

    const result = await executeUnpublishProfile(supabase);
    expect(result.error).toBe('Could not unpublish your profile. Please try again.');
    expect(result.error).not.toContain('postgres');
  });
});

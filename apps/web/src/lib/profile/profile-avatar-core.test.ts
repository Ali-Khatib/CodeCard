import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_BUCKETS } from '@codecard/config';
import {
  assertOwnedAvatarStoragePath,
  executeFinalizeAvatarUpload,
} from './profile-avatar-core';

const tenantId = '11111111-1111-4111-8111-111111111111';
const ownerUserId = '22222222-2222-4222-8222-222222222222';
const profileId = '33333333-3333-4333-8333-333333333333';
const foreignTenantId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const foreignOwnerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const foreignProfileId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const ownedProfile = {
  id: profileId,
  tenant_id: tenantId,
  owner_user_id: ownerUserId,
  slug: 'alex-chen',
  is_public: true,
};

const ownedPath = `${tenantId}/${ownerUserId}/avatar/${profileId}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png`;

function createMockSupabase(options: {
  user?: { id: string } | null;
  profile?: typeof ownedProfile | null;
  listResult?: { name: string }[];
  listError?: { message: string } | null;
  updateError?: { message: string } | null;
}) {
  const update = vi.fn().mockResolvedValue({ error: options.updateError ?? null });
  const list = vi.fn().mockResolvedValue({
    data: options.listResult ?? [{ name: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png' }],
    error: options.listError ?? null,
  });

  const sessionUser =
    options.user === undefined ? { id: ownerUserId } : options.user;

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: sessionUser } }),
    },
    from: vi.fn((table: string) => {
      if (table !== 'profiles') {
        throw new Error(`Unexpected table ${table}`);
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: options.profile === null ? null : (options.profile ?? ownedProfile),
              error: options.profile === null ? { message: 'not found' } : null,
            }),
          })),
        })),
        update: vi.fn((payload: unknown) => ({
          eq: vi.fn(() => {
            update(payload);
            return Promise.resolve({ error: options.updateError ?? null });
          }),
        })),
      };
    }),
    storage: {
      from: vi.fn((bucket: string) => {
        expect(bucket).toBe(STORAGE_BUCKETS.avatars);
        return {
          list,
          getPublicUrl: vi.fn((path: string) => ({
            data: {
              publicUrl: `https://example.supabase.co/storage/v1/object/public/avatars/${path}`,
            },
          })),
        };
      }),
    },
  } as unknown as SupabaseClient;

  return { supabase, update, list };
}

describe('assertOwnedAvatarStoragePath', () => {
  it('accepts the authenticated owner canonical avatar path', () => {
    expect(assertOwnedAvatarStoragePath(ownedPath, ownedProfile, ownerUserId)).toEqual({ ok: true });
  });

  it('rejects foreign tenant, owner, profile, bucket, and malformed paths', () => {
    expect(
      assertOwnedAvatarStoragePath(
        `${foreignTenantId}/${ownerUserId}/avatar/${profileId}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png`,
        ownedProfile,
        ownerUserId,
      ),
    ).toEqual({ ok: false });
    expect(
      assertOwnedAvatarStoragePath(
        `${tenantId}/${foreignOwnerId}/avatar/${profileId}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png`,
        ownedProfile,
        ownerUserId,
      ),
    ).toEqual({ ok: false });
    expect(
      assertOwnedAvatarStoragePath(
        `${tenantId}/${ownerUserId}/avatar/${foreignProfileId}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png`,
        ownedProfile,
        ownerUserId,
      ),
    ).toEqual({ ok: false });
    expect(
      assertOwnedAvatarStoragePath(
        `${tenantId}/${ownerUserId}/project-media/${profileId}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png`,
        ownedProfile,
        ownerUserId,
      ),
    ).toEqual({ ok: false });
    expect(assertOwnedAvatarStoragePath('https://evil.example/avatar.png', ownedProfile, ownerUserId)).toEqual({
      ok: false,
    });
    expect(assertOwnedAvatarStoragePath('../avatar.png', ownedProfile, ownerUserId)).toEqual({ ok: false });
  });
});

describe('executeFinalizeAvatarUpload', () => {
  it('denies unauthenticated finalization', async () => {
    const { supabase } = createMockSupabase({ user: null });
    const result = await executeFinalizeAvatarUpload(
      supabase,
      { path: ownedPath },
      { user: null },
    );
    expect(result.error).toBe('You must be signed in.');
  });

  it('allows the owner to finalize their own avatar path', async () => {
    const { supabase, update } = createMockSupabase({});
    const result = await executeFinalizeAvatarUpload(supabase, { path: ownedPath }, { user: { id: ownerUserId } });

    expect(result.success).toBe(true);
    expect(result.avatarUrl).toContain('/public/avatars/');
    expect(update).toHaveBeenCalledWith({ avatar_url: result.avatarUrl });
  });

  it('rejects arbitrary URLs and foreign paths with a safe message', async () => {
    const { supabase } = createMockSupabase({});
    const urlResult = await executeFinalizeAvatarUpload(
      supabase,
      { path: 'https://evil.example/avatar.png' },
      { user: { id: ownerUserId } },
    );
    expect(urlResult.error).toBe('Could not save your avatar. Please try again.');

    const foreignResult = await executeFinalizeAvatarUpload(
      supabase,
      {
        path: `${foreignTenantId}/${foreignOwnerId}/avatar/${foreignProfileId}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png`,
      },
      { user: { id: ownerUserId } },
    );
    expect(foreignResult.error).toBe('Could not save your avatar. Please try again.');
  });

  it('requires the uploaded object to exist before updating avatar_url', async () => {
    const { supabase, update } = createMockSupabase({ listResult: [] });
    const result = await executeFinalizeAvatarUpload(supabase, { path: ownedPath }, { user: { id: ownerUserId } });
    expect(result.error).toBe('Could not save your avatar. Please try again.');
    expect(update).not.toHaveBeenCalled();
  });

  it('preserves the old avatar when finalization fails', async () => {
    const { supabase, update } = createMockSupabase({ updateError: { message: 'db fail' } });
    const result = await executeFinalizeAvatarUpload(supabase, { path: ownedPath }, { user: { id: ownerUserId } });
    expect(result.success).toBeUndefined();
    expect(result.error).toBe('Could not save your avatar. Please try again.');
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('updates only avatar_url and hides raw storage errors', async () => {
    const { supabase, update } = createMockSupabase({ listError: { message: 'storage exploded' } });
    const result = await executeFinalizeAvatarUpload(supabase, { path: ownedPath }, { user: { id: ownerUserId } });
    expect(result.error).toBe('Could not save your avatar. Please try again.');
    expect(update).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toMatch(/storage exploded/i);
  });
});

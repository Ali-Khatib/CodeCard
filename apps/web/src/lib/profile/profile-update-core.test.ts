import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildProfileFormData,
  checkProfileSlugAvailability,
  executeProfileUpdate,
  mapProfileUpdateDbError,
  parseTrustedProfileFormData,
  pickAllowedProfileUpdate,
  validateProfileEditPayload,
} from './profile-update-core';
import { PROFILE_SLUG_TAKEN_MESSAGE } from '@codecard/validation';

function makeFormData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

function createMockSupabase(options: {
  user?: { id: string } | null;
  profile?: Record<string, unknown> | null;
  updateError?: { code?: string; message?: string } | null;
  slugTakenByProfileId?: string | null;
  slugTakenByTenantId?: string | null;
}) {
  const update = vi.fn().mockResolvedValue({ error: options.updateError ?? null });

  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn((columns?: string) => {
          if (columns === 'id') {
            return {
              eq: vi.fn(() => ({
                neq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: options.slugTakenByProfileId ? { id: options.slugTakenByProfileId } : null,
                    error: null,
                  }),
                })),
              })),
            };
          }
          return {
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: options.profile ?? null,
                error: options.profile ? null : { message: 'not found' },
              }),
            })),
          };
        }),
        update: vi.fn((payload: unknown) => ({
          eq: vi.fn(() => {
            update(payload);
            return Promise.resolve({ error: options.updateError ?? null });
          }),
        })),
      };
    }

    if (table === 'tenants') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: options.slugTakenByTenantId ? { id: options.slugTakenByTenantId } : null,
                error: null,
              }),
            })),
          })),
        })),
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

  return { supabase, update };
}

const ownedProfile = {
  id: 'profile-1',
  tenant_id: 'tenant-1',
  owner_user_id: 'user-1',
  slug: 'alex-chen',
  display_name: 'Alex Chen',
  headline: 'Engineer',
  bio: 'Bio',
  location: 'SF',
  skills: ['TypeScript'],
  is_public: false,
};

describe('parseTrustedProfileFormData', () => {
  it('reads only known profile fields', () => {
    const fd = makeFormData({
      display_name: 'Alex',
      headline: 'Role',
      slug: 'alex',
      bio: 'About',
      location: 'NYC',
      skills: 'Go, Rust',
      profile_id: 'evil',
      tenant_id: 'evil',
      owner_user_id: 'evil',
      is_public: 'true',
    });

    expect(parseTrustedProfileFormData(fd)).toEqual({
      display_name: 'Alex',
      headline: 'Role',
      slug: 'alex',
      bio: 'About',
      location: 'NYC',
      skills: ['Go', 'Rust'],
    });
  });
});

describe('validateProfileEditPayload', () => {
  it('accepts valid payload', () => {
    const result = validateProfileEditPayload({
      display_name: 'Alex Chen',
      headline: 'Engineer',
      slug: 'alex-chen',
      bio: 'Builder',
      location: 'San Francisco, CA',
      skills: ['TypeScript', 'Next.js'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid display name', () => {
    const result = validateProfileEditPayload({
      display_name: '',
      headline: null,
      slug: 'alex-chen',
      bio: null,
      location: '',
      skills: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid slug', () => {
    const result = validateProfileEditPayload({
      display_name: 'Alex',
      headline: null,
      slug: 'ab',
      bio: null,
      location: '',
      skills: [],
    });
    expect(result.success).toBe(false);
  });

  it('normalizes empty optional fields', () => {
    const result = validateProfileEditPayload({
      display_name: 'Alex',
      headline: '',
      slug: 'alex-chen',
      bio: '',
      location: '   ',
      skills: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.headline).toBe('');
      expect(result.data.bio).toBe('');
      expect(result.data.location).toBeNull();
    }
  });
});

describe('pickAllowedProfileUpdate', () => {
  it('returns explicit editable fields only', () => {
    expect(
      pickAllowedProfileUpdate({
        display_name: 'Alex',
        headline: null,
        slug: 'alex',
        bio: null,
        location: null,
        skills: ['Go'],
        is_public: true,
        evil: 'nope',
      }),
    ).toEqual({
      display_name: 'Alex',
      headline: null,
      slug: 'alex',
      bio: null,
      location: null,
      skills: ['Go'],
    });
  });
});

describe('mapProfileUpdateDbError', () => {
  it('maps unique violations to a friendly slug error', () => {
    const mapped = mapProfileUpdateDbError({
      code: '23505',
      message: 'duplicate key value violates unique constraint "profiles_tenant_id_slug_key"',
    });
    expect(mapped.fieldErrors?.slug).toBe(PROFILE_SLUG_TAKEN_MESSAGE);
    expect(mapped.error).toBe(PROFILE_SLUG_TAKEN_MESSAGE);
    expect(mapped.error).not.toContain('23505');
    expect(mapped.error).not.toContain('profiles_tenant_id_slug_key');
  });

  it('does not expose raw database errors for other failures', () => {
    const mapped = mapProfileUpdateDbError({
      code: 'XX000',
      message: 'internal postgres detail',
    });
    expect(mapped.error).toBe('Could not save your profile. Please try again.');
    expect(mapped.error).not.toContain('postgres');
  });
});

describe('executeProfileUpdate', () => {
  it('denies unauthenticated updates', async () => {
    const { supabase } = createMockSupabase({ user: null });
    const result = await executeProfileUpdate(supabase, makeFormData({ display_name: 'Alex', slug: 'alex-chen' }));
    expect(result.error).toMatch(/signed in/i);
  });

  it('updates the owned profile server-side', async () => {
    const { supabase, update } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
    });

    const result = await executeProfileUpdate(
      supabase,
      makeFormData({
        display_name: 'Alex Chen',
        headline: 'Senior Engineer',
        slug: 'alex-chen',
        bio: 'Updated bio',
        location: 'London, UK',
        skills: 'TypeScript, Go',
      }),
    );

    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalledWith({
      display_name: 'Alex Chen',
      headline: 'Senior Engineer',
      slug: 'alex-chen',
      bio: 'Updated bio',
      location: 'London, UK',
      skills: ['TypeScript', 'Go'],
    });
  });

  it('ignores client-supplied ownership fields in form data', async () => {
    const { supabase, update } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
    });

    const fd = makeFormData({
      display_name: 'Alex Chen',
      headline: 'Engineer',
      slug: 'alex-chen',
      bio: 'Bio',
      location: '',
      skills: '',
      profile_id: 'other-profile',
      tenant_id: 'other-tenant',
      owner_user_id: 'other-user',
    });

    await executeProfileUpdate(supabase, fd);
    expect(update).toHaveBeenCalled();
  });

  it('returns validation errors for invalid location', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
    });

    const result = await executeProfileUpdate(
      supabase,
      makeFormData({
        display_name: 'Alex Chen',
        headline: '',
        slug: 'alex-chen',
        bio: '',
        location: 'a'.repeat(121),
        skills: '',
      }),
    );

    expect(result.success).toBeUndefined();
    expect(result.error).toBeTruthy();
  });

  it('returns safe error when profile is missing', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: null,
    });

    const result = await executeProfileUpdate(
      supabase,
      makeFormData({ display_name: 'Alex', slug: 'alex-chen' }),
    );
    expect(result.error).toBe('Profile not found.');
  });

  it('rejects reserved slugs with a field error', async () => {
    const { supabase, update } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
    });

    const result = await executeProfileUpdate(
      supabase,
      makeFormData({
        display_name: 'Alex Chen',
        headline: 'Engineer',
        slug: 'dashboard',
        bio: 'Bio',
        location: '',
        skills: '',
      }),
    );

    expect(result.fieldErrors?.slug).toMatch(/reserved/i);
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects duplicate slugs with a friendly field error', async () => {
    const { supabase, update } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      slugTakenByProfileId: 'profile-2',
    });

    const result = await executeProfileUpdate(
      supabase,
      makeFormData({
        display_name: 'Alex Chen',
        headline: 'Engineer',
        slug: 'taken-slug',
        bio: 'Bio',
        location: '',
        skills: '',
      }),
    );

    expect(result.fieldErrors?.slug).toBe(PROFILE_SLUG_TAKEN_MESSAGE);
    expect(update).not.toHaveBeenCalled();
  });

  it('falls back to database uniqueness when a race occurs', async () => {
    const { supabase } = createMockSupabase({
      user: { id: 'user-1' },
      profile: ownedProfile,
      updateError: { code: '23505', message: 'duplicate key' },
    });

    const result = await executeProfileUpdate(
      supabase,
      makeFormData({
        display_name: 'Alex Chen',
        headline: 'Engineer',
        slug: 'new-slug',
        bio: 'Bio',
        location: '',
        skills: '',
      }),
    );

    expect(result.fieldErrors?.slug).toBe(PROFILE_SLUG_TAKEN_MESSAGE);
  });
});
describe('checkProfileSlugAvailability', () => {
  it('detects tenant slug conflicts for public routing safety', async () => {
    const { supabase } = createMockSupabase({
      profile: ownedProfile,
      slugTakenByTenantId: 'tenant-2',
    });

    const message = await checkProfileSlugAvailability(supabase, 'shared-slug', {
      id: 'profile-1',
      tenant_id: 'tenant-1',
    });
    expect(message).toBe(PROFILE_SLUG_TAKEN_MESSAGE);
  });
});

describe('buildProfileFormData', () => {
  it('serializes editor state for the server action', () => {
    const fd = buildProfileFormData({
      display_name: 'Alex',
      headline: 'Engineer',
      slug: 'alex',
      bio: 'Bio',
      location: 'SF',
      skillsInput: 'Go, Rust',
    });
    expect(fd.get('skills')).toBe('Go, Rust');
    expect(fd.get('slug')).toBe('alex');
  });
});

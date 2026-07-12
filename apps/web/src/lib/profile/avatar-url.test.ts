import { describe, expect, it } from 'vitest';
import {
  getPublicAvatarUrl,
  isTrustedAvatarHost,
  isTrustedAvatarImageUrl,
  profileAvatarAltText,
} from './avatar-url';

describe('avatar-url', () => {
  it('builds a public avatar URL from storage path', () => {
    const supabase = {
      storage: {
        from: () => ({
          getPublicUrl: (path: string) => ({
            data: {
              publicUrl: `https://example.supabase.co/storage/v1/object/public/avatars/${path}`,
            },
          }),
        }),
      },
    };

    expect(getPublicAvatarUrl(supabase as never, 'tenant/user/avatar/profile/file.png')).toBe(
      'https://example.supabase.co/storage/v1/object/public/avatars/tenant/user/avatar/profile/file.png',
    );
  });

  it('trusts Supabase storage hosts only', () => {
    expect(isTrustedAvatarHost('abc.supabase.co')).toBe(true);
    expect(isTrustedAvatarHost('evil.example.com')).toBe(false);
    expect(isTrustedAvatarImageUrl('https://abc.supabase.co/storage/v1/object/public/avatars/a/b.png')).toBe(
      true,
    );
    expect(isTrustedAvatarImageUrl('https://evil.example.com/avatar.png')).toBe(false);
    expect(isTrustedAvatarImageUrl('http://abc.supabase.co/x.png')).toBe(false);
  });

  it('allows legacy unsplash demo avatars', () => {
    expect(isTrustedAvatarImageUrl('https://images.unsplash.com/photo-1?w=200')).toBe(true);
  });

  it('builds meaningful avatar alt text', () => {
    expect(profileAvatarAltText('Alex Chen')).toBe('Alex Chen avatar');
    expect(profileAvatarAltText('  ')).toBe('Profile avatar');
  });
});

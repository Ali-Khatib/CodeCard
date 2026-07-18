import { describe, expect, it } from 'vitest';
import {
  findDuplicateProfileLink,
  isAllowedProfileLinkHref,
  profileLinkInputSchema,
  PROFILE_LINKS_MAX_COUNT,
  reorderProfileLinksSchema,
} from './profile-links';

describe('isAllowedProfileLinkHref', () => {
  it('accepts valid HTTPS URLs', () => {
    expect(isAllowedProfileLinkHref('https://github.com/user')).toBe(true);
  });

  it('accepts mailto links', () => {
    expect(isAllowedProfileLinkHref('mailto:hello@example.com')).toBe(true);
  });

  it('rejects javascript URLs', () => {
    expect(isAllowedProfileLinkHref('javascript:alert(1)')).toBe(false);
  });

  it('rejects data URLs', () => {
    expect(isAllowedProfileLinkHref('data:text/html,hello')).toBe(false);
  });

  it('rejects protocol-relative URLs', () => {
    expect(isAllowedProfileLinkHref('//evil.example')).toBe(false);
  });
});

describe('profileLinkInputSchema', () => {
  it('accepts valid HTTPS links', () => {
    const result = profileLinkInputSchema.safeParse({
      type: 'github',
      label: 'GitHub',
      url: 'https://github.com/alex',
    });
    expect(result.success).toBe(true);
  });

  it('rejects GitHub type with a non-GitHub host', () => {
    const result = profileLinkInputSchema.safeParse({
      type: 'github',
      label: 'GitHub',
      url: 'https://gitlab.com/alex',
    });
    expect(result.success).toBe(false);
  });

  it('rejects LinkedIn type with a non-LinkedIn host', () => {
    const result = profileLinkInputSchema.safeParse({
      type: 'linkedin',
      url: 'https://github.com/alex',
    });
    expect(result.success).toBe(false);
  });

  it('accepts X links on x.com and twitter.com', () => {
    expect(
      profileLinkInputSchema.safeParse({
        type: 'twitter',
        url: 'https://x.com/alex',
      }).success,
    ).toBe(true);
    expect(
      profileLinkInputSchema.safeParse({
        type: 'twitter',
        url: 'https://twitter.com/alex',
      }).success,
    ).toBe(true);
  });

  it('allows any https host for personal website', () => {
    const result = profileLinkInputSchema.safeParse({
      type: 'website',
      url: 'https://alex.dev',
    });
    expect(result.success).toBe(true);
  });

  it('normalizes email links to mailto', () => {
    const result = profileLinkInputSchema.safeParse({
      type: 'email',
      label: null,
      url: 'alex@example.com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.url).toBe('mailto:alex@example.com');
    }
  });

  it('rejects unsupported link types', () => {
    const result = profileLinkInputSchema.safeParse({
      type: 'portfolio',
      label: 'Site',
      url: 'https://example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects overlong labels', () => {
    const result = profileLinkInputSchema.safeParse({
      type: 'website',
      label: 'a'.repeat(51),
      url: 'https://example.com',
    });
    expect(result.success).toBe(false);
  });

  it('accepts Unicode labels', () => {
    const result = profileLinkInputSchema.safeParse({
      type: 'website',
      label: 'Mi sitio — español',
      url: 'https://example.com',
    });
    expect(result.success).toBe(true);
  });
});

describe('findDuplicateProfileLink', () => {
  it('detects duplicate links case-insensitively', () => {
    expect(
      findDuplicateProfileLink(
        [{ id: '1', type: 'github', url: 'https://GitHub.com/alex' }],
        { type: 'github', url: 'https://github.com/alex' },
      ),
    ).toBe(true);
  });

  it('ignores the same link when editing', () => {
    expect(
      findDuplicateProfileLink(
        [{ id: '1', type: 'github', url: 'https://github.com/alex' }],
        { id: '1', type: 'github', url: 'https://github.com/alex' },
      ),
    ).toBe(false);
  });
});

describe('reorderProfileLinksSchema', () => {
  it('enforces maximum link count', () => {
    const ids = Array.from({ length: PROFILE_LINKS_MAX_COUNT + 1 }, () =>
      '00000000-0000-4000-8000-000000000001',
    );
    expect(reorderProfileLinksSchema.safeParse({ link_ids: ids }).success).toBe(false);
  });
});

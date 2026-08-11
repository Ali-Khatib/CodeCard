import { describe, expect, it } from 'vitest';
import { getSavedProfilePreviewHref } from './profile-preview';

describe('getSavedProfilePreviewHref', () => {
  it('uses the public profile URL when published', () => {
    expect(getSavedProfilePreviewHref({ slug: 'alex-chen', is_public: true })).toBe('/alex-chen');
  });

  it('routes the live demo persona to /demo/card', () => {
    expect(getSavedProfilePreviewHref({ slug: 'demo', is_public: true })).toBe('/demo/card');
  });

  it('uses the owner-only preview route when unpublished', () => {
    expect(getSavedProfilePreviewHref({ slug: 'alex-chen', is_public: false })).toBe(
      '/dashboard/profile/preview',
    );
  });
});

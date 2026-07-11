import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('owner profile preview route', () => {
  it('requires authentication and loads only the owner profile', () => {
    const src = readFileSync(
      resolve(
        process.cwd(),
        'src/app/dashboard/(authenticated)/profile/preview/page.tsx',
      ),
      'utf8',
    );

    expect(src).toContain('auth.getUser()');
    expect(src).toContain("eq('owner_user_id', user.id)");
    expect(src).not.toContain(".eq('is_public', true)");
    expect(src).toContain('robots: { index: false');
  });

  it('does not weaken the public slug route', () => {
    const publicPage = readFileSync(resolve(process.cwd(), 'src/app/[slug]/page.tsx'), 'utf8');
    expect(publicPage).toContain(".eq('is_public', true)");
  });
});

describe('profile editor preview link', () => {
  it('points to the owner preview route for unpublished profiles', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/components/profile-editor.tsx'), 'utf8');
    expect(src).toContain('getSavedProfilePreviewHref');
    expect(src).toContain('Preview saved profile');
  });
});

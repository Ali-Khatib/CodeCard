import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Keeps the privacy policy aligned with what the app actually does.
 *
 * The policy previously omitted GitHub OAuth and cookie/local-storage use even
 * though both are implemented, so these assertions tie the disclosure to the
 * code that creates the obligation.
 */

function readWeb(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

const privacy = readWeb('src/app/legal/privacy/page.tsx');

describe('privacy policy discloses implemented data practices', () => {
  it('discloses GitHub sign-in, which the app implements', () => {
    /* Guard: if OAuth is ever removed, this test should be revisited. */
    expect(readWeb('src/lib/auth/github-oauth.ts')).toContain("provider: 'github'");
    expect(privacy).toMatch(/GitHub/);
    expect(privacy).toMatch(/sign in with GitHub|Signing in with GitHub/i);
  });

  it('states that no repository or code access is requested', () => {
    expect(privacy).toMatch(/repositor/i);
  });

  it('discloses cookies and local storage', () => {
    expect(privacy).toMatch(/cookie/i);
    expect(privacy).toMatch(/local storage/i);
  });

  it('discloses the session cookie that keeps users signed in', () => {
    expect(privacy).toMatch(/session cookie/i);
  });

  it('discloses local storage of theme/appearance preferences that layout.tsx writes', () => {
    const layout = readWeb('src/app/layout.tsx');
    expect(layout).toContain('localStorage');
    expect(layout).toContain('cc-app-appearance');
    expect(privacy).toMatch(/theme|appearance/i);
  });

  it('disclaims advertising and cross-site tracking cookies', () => {
    expect(privacy).toMatch(/advertising/i);
    expect(privacy).toMatch(/cross-site/i);
  });

  it('lists every third-party processor the app initializes', () => {
    for (const processor of ['Supabase', 'Stripe', 'Vercel', 'Sentry', 'Upstash', 'GitHub']) {
      expect(privacy, processor).toContain(processor);
    }
  });

  it('remains publicly reachable without authentication', () => {
    /* /legal/* must not appear in the authenticated proxy matcher. */
    const proxy = readWeb('src/proxy.ts');
    expect(proxy).not.toContain('/legal');
  });
});

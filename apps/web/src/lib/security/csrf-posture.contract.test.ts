import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const WEB = resolve(process.cwd());
const REPO = resolve(process.cwd(), '../..');

function readWeb(rel: string) {
  return readFileSync(resolve(WEB, rel), 'utf8');
}

function readRepo(rel: string) {
  return readFileSync(resolve(REPO, rel), 'utf8');
}

describe('WS11-T007 CSRF posture contracts', () => {
  const guard = readWeb('src/lib/security/same-origin.ts');
  const nextConfig = readWeb('next.config.ts');
  const docs = readRepo('docs/CSRF_POSTURE.md');
  const authDocs = readRepo('docs/AUTH_PROVIDER_CONFIGURATION.md');
  const stripeRoute = readWeb('src/app/api/webhooks/stripe/route.ts');
  const stripeCore = readWeb('src/lib/billing/stripe-webhook-core.ts');

  it('fail-closes when Origin and fetch metadata are both absent', () => {
    expect(guard).toContain("secFetchSite === 'same-origin' || secFetchSite === 'same-site'");
    expect(guard).not.toMatch(/secFetchSite === null/);
    expect(docs).toMatch(/fail closed/i);
  });

  it('parses origins and does not trust forwarded host headers for allowlisting', () => {
    expect(guard).toContain('parseBrowserOrigin');
    expect(guard).toContain('collectAllowedOrigins');
    expect(guard).not.toMatch(/headers\.get\(['"]x-forwarded-host['"]\)/i);
    expect(guard).not.toMatch(/headers\.get\(['"]host['"]\)/i);
    expect(docs).toContain('Do **not** trust client-supplied');
  });

  it('declares explicit empty Server Action allowedOrigins (no wildcards)', () => {
    const serverActions = nextConfig.match(/serverActions:\s*\{[\s\S]*?\}/)?.[0] ?? '';
    expect(serverActions).toMatch(/allowedOrigins:\s*\[\s*\]/);
    expect(serverActions).not.toContain('*');
    expect(docs).toContain('allowedOrigins: []');
  });

  it('keeps cookie-authenticated mutations behind the central guard', () => {
    const ownedForm = readWeb('src/lib/dashboard/owned-form-request.ts');
    expect(ownedForm).toContain('isSameOriginMutation');
    expect(ownedForm).toMatch(/403|Forbidden/);

    for (const rel of [
      'src/app/api/upload/route.ts',
      'src/app/api/account/export/route.ts',
      'src/app/api/account/delete/route.ts',
      'src/app/api/profile/route.ts',
      'src/app/api/profile/links/route.ts',
      'src/app/api/projects/route.ts',
      'src/app/api/research/route.ts',
      'src/app/api/schedule/events/route.ts',
      'src/app/api/auth/sign-out/route.ts',
    ]) {
      const src = readWeb(rel);
      const guardedHere = src.includes('isSameOriginMutation');
      const guardedByOwnedForm = src.includes('readOwnedFormPost');
      expect(guardedHere || guardedByOwnedForm).toBe(true);
      if (guardedHere) expect(src).toMatch(/403|Forbidden/);
    }
  });

  it('excludes Stripe webhook from browser CSRF and keeps signature verification', () => {
    expect(stripeRoute).not.toContain('isSameOriginMutation');
    expect(stripeCore).toContain('constructEvent');
    expect(stripeCore).toContain('stripe-signature');
    expect(docs).toContain('Stripe webhook');
  });

  it('documents accurate cookie HttpOnly posture for Supabase SSR', () => {
    expect(authDocs).not.toMatch(/HTTP-only cookies via `@supabase\/ssr`/);
    expect(authDocs).toMatch(/SameSite=Lax/i);
    expect(docs).toMatch(/HttpOnly/i);
  });
});

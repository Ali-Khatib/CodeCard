import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * WS14-T013 — Vercel environment contract.
 * Asserts documentation and branch gating without reading secret values.
 */

const ROOT = path.resolve(__dirname, '../../../../..');
const WEB = path.resolve(__dirname, '../../..');

function readRepo(rel: string) {
  return readFileSync(path.resolve(ROOT, rel), 'utf8');
}

function readWeb(rel: string) {
  return readFileSync(path.resolve(WEB, rel), 'utf8');
}

const E2E_ONLY = [
  'CODECARD_E2E',
  'CODECARD_E2E_ALLOW_DESTRUCTIVE',
  'CODECARD_E2E_SUPABASE_URL',
  'CODECARD_E2E_SUPABASE_PUBLISHABLE_KEY',
  'CODECARD_E2E_SUPABASE_SERVICE_ROLE_KEY',
  'CODECARD_E2E_SUPABASE_PROJECT_REF',
  'CODECARD_E2E_TEST_PASSWORD',
  'CODECARD_E2E_MAILTRAP_API_TOKEN',
  'CODECARD_E2E_MAILTRAP_ACCOUNT_ID',
  'CODECARD_E2E_MAILTRAP_INBOX_ID',
] as const;

describe('WS14-T013 Vercel environment contract', () => {
  it('documents both Vercel projects, branch gates, and root directory', () => {
    const doc = readRepo('docs/VERCEL_ENVIRONMENT.md');
    expect(doc).toContain('codecard-mvp');
    expect(doc).toContain('code-card-web');
    expect(doc).toContain('prj_ZTosasXt5TxnUQf4WTfcTbN8k1UN');
    expect(doc).toContain('prj_E5wdwC2T4SYTZsRS6xh20p56LJZn');
    expect(doc).toContain('apps/web');
    expect(doc).toMatch(/`mvp`\s+only/i);
    expect(doc).toMatch(/`main`\s+only/i);
    expect(doc).toContain('https://codecard-mvp.vercel.app');
  });

  it('keeps ignore-build project IDs aligned with the inventory', () => {
    const ignore = readWeb('scripts/vercel-ignore-build.mjs');
    const vercelJson = readWeb('vercel.json');
    expect(vercelJson).toContain('ignoreCommand');
    expect(ignore).toContain('prj_ZTosasXt5TxnUQf4WTfcTbN8k1UN');
    expect(ignore).toContain('prj_E5wdwC2T4SYTZsRS6xh20p56LJZn');
    expect(ignore).toMatch(/codecard-mvp[\s\S]*mvp/);
    expect(ignore).toMatch(/code-card-web[\s\S]*main/);
  });

  it('excludes E2E-only variables from Production guidance', () => {
    const doc = readRepo('docs/VERCEL_ENVIRONMENT.md');
    expect(doc).toMatch(/never configure on Vercel Production/i);
    for (const key of E2E_ONLY) {
      expect(doc).toContain(key);
    }
    expect(doc).toContain('gclteunkzorwaliwhatp');
  });

  it('classifies server vs public variables without embedding secrets', () => {
    const doc = readRepo('docs/VERCEL_ENVIRONMENT.md');
    expect(doc).toContain('NEXT_PUBLIC_APP_URL');
    expect(doc).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(doc).toContain('STRIPE_SECRET_KEY');
    expect(doc).toMatch(/assertNoLeakedPublicSecrets/);
    expect(doc).not.toMatch(/sk_live_[A-Za-z0-9]{8,}/);
    expect(doc).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/);
    expect(doc).not.toMatch(/whsec_[A-Za-z0-9]{8,}/);
  });

  it('records preview smoke and links from auth provider docs', () => {
    const doc = readRepo('docs/VERCEL_ENVIRONMENT.md');
    const auth = readRepo('docs/AUTH_PROVIDER_CONFIGURATION.md');
    expect(doc).toMatch(/Preview \/ MVP smoke/i);
    expect(doc).toContain('/sign-in');
    expect(auth).toContain('VERCEL_ENVIRONMENT.md');
  });
});

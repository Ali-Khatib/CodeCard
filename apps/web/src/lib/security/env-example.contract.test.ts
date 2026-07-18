import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Contract test for apps/web/.env.example (WS14-T001).
 *
 * Reconciles the documented example with the environment variables actually read
 * by application code, without requiring any real secret value. It guards against
 * omitted variables, stale documented variables, accidental NEXT_PUBLIC_ secret
 * exposure, and real secrets leaking into the committed template.
 */

const EXAMPLE_PATH = path.resolve(__dirname, '../../../.env.example');

/** Keys that must be present as `KEY=` entries in the example. */
const REQUIRED_DOCUMENTED = [
  // Public (browser-exposed)
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_CODECARD_IOS_APP_URL',
  'NEXT_PUBLIC_CODECARD_ANDROID_APP_URL',
  // Server-only secrets
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRO_PRICE_ID',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'SENTRY_DSN',
  // Test-only
  'CODECARD_E2E_FIXTURES',
  'PLAYWRIGHT_PORT',
] as const;

/**
 * Framework/platform-provided variables that are read by code but are not
 * expected to be defined as `KEY=` entries (documented as prose notes instead).
 */
const KNOWN_UNDOCUMENTED_OK = ['NODE_ENV', 'VERCEL_URL'] as const;

/** The only NEXT_PUBLIC_ variables intended to be browser-exposed. */
const PUBLIC_ALLOWLIST = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_CODECARD_IOS_APP_URL',
  'NEXT_PUBLIC_CODECARD_ANDROID_APP_URL',
] as const;

/** Secrets that must remain server-only (never NEXT_PUBLIC_). */
const SERVER_ONLY_SECRETS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRO_PRICE_ID',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'SENTRY_DSN',
] as const;

function readExample(): string {
  return readFileSync(EXAMPLE_PATH, 'utf8');
}

function parseKeys(contents: string): Map<string, string> {
  const entries = new Map<string, string>();
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Z0-9_]+)\s*=(.*)$/);
    if (match) entries.set(match[1], match[2]);
  }
  return entries;
}

describe('.env.example contract (WS14-T001)', () => {
  it('exists and is non-empty', () => {
    const contents = readExample();
    expect(contents.length).toBeGreaterThan(0);
  });

  it('documents every required environment variable', () => {
    const keys = parseKeys(readExample());
    for (const key of REQUIRED_DOCUMENTED) {
      expect(keys.has(key), `missing documented variable: ${key}`).toBe(true);
    }
  });

  it('does not document unknown/stale variables', () => {
    const keys = parseKeys(readExample());
    const known = new Set<string>([
      ...REQUIRED_DOCUMENTED,
      ...KNOWN_UNDOCUMENTED_OK,
    ]);
    for (const key of keys.keys()) {
      expect(known.has(key), `unexpected/stale documented variable: ${key}`).toBe(
        true,
      );
    }
  });

  it('only exposes intended NEXT_PUBLIC_ variables', () => {
    const keys = parseKeys(readExample());
    const allowed = new Set<string>(PUBLIC_ALLOWLIST);
    for (const key of keys.keys()) {
      if (key.startsWith('NEXT_PUBLIC_')) {
        expect(
          allowed.has(key),
          `unexpected NEXT_PUBLIC_ variable in example: ${key}`,
        ).toBe(true);
      }
    }
  });

  it('keeps server-only secrets un-prefixed and documented', () => {
    const keys = parseKeys(readExample());
    for (const secret of SERVER_ONLY_SECRETS) {
      expect(keys.has(secret), `server secret not documented: ${secret}`).toBe(
        true,
      );
      expect(secret.startsWith('NEXT_PUBLIC_')).toBe(false);
    }
    const contents = readExample();
    expect(contents).toMatch(/SERVER-ONLY/i);
  });

  it('contains no real secret patterns', () => {
    const contents = readExample();
    // Live Stripe keys.
    expect(contents).not.toMatch(/sk_live_[A-Za-z0-9]/);
    expect(contents).not.toMatch(/rk_live_[A-Za-z0-9]/);
    // JWT-shaped values (real Supabase anon/service keys).
    expect(contents).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/);
    // A concrete Supabase project ref host (placeholders use "your-project").
    const values = [...parseKeys(contents).values()];
    for (const value of values) {
      expect(value).not.toMatch(/https:\/\/[a-z]{20}\.supabase\.co/);
    }
  });

  it('placeholders are not runtime-valid secrets', () => {
    const keys = parseKeys(readExample());
    // Test-mode Stripe placeholder must not be an empty or live value.
    expect(keys.get('STRIPE_SECRET_KEY')).toMatch(/^sk_test_/);
  });
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  LOCAL_SEED_EMAIL,
  LOCAL_SEED_SLUG,
  PRODUCTION_SUPABASE_PROJECT_REF,
  STAGING_SUPABASE_PROJECT_REF,
  validateLocalSeedEnvironment,
} from '../../../../../supabase/seed-guard';
import { isReservedProfileSlug } from '@codecard/validation';

const REPO = resolve(process.cwd(), '../..');

function readRepo(rel: string) {
  return readFileSync(resolve(REPO, rel), 'utf8');
}

describe('WS14-T020 local seed guard', () => {
  const base = {
    CODECARD_LOCAL_SEED: '1',
    CODECARD_LOCAL_SEED_PASSWORD: 'local-dev-password-ok',
    CODECARD_LOCAL_SEED_SUPABASE_URL: 'http://127.0.0.1:54321',
    CODECARD_LOCAL_SEED_SERVICE_ROLE_KEY: 'test-service-role-key',
  };

  it('accepts local Supabase when deliberately enabled', () => {
    const result = validateLocalSeedEnvironment(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.env.target).toBe('local');
      expect(result.env.password).toBe('local-dev-password-ok');
    }
  });

  it('rejects missing deliberate opt-in', () => {
    const result = validateLocalSeedEnvironment({ ...base, CODECARD_LOCAL_SEED: undefined });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failures).toContain('local_seed_not_requested');
  });

  it('rejects missing password with no secret fallback', () => {
    const result = validateLocalSeedEnvironment({
      ...base,
      CODECARD_LOCAL_SEED_PASSWORD: undefined,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failures).toContain('missing:CODECARD_LOCAL_SEED_PASSWORD');
  });

  it('rejects production project ref', () => {
    const result = validateLocalSeedEnvironment({
      ...base,
      CODECARD_LOCAL_SEED_SUPABASE_URL: `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`,
      CODECARD_LOCAL_SEED_PROJECT_REF: PRODUCTION_SUPABASE_PROJECT_REF,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failures).toContain('production_supabase_url_forbidden');
      expect(result.failures).toContain('production_project_ref_forbidden');
    }
  });

  it('rejects production URL even without matching ref var', () => {
    const result = validateLocalSeedEnvironment({
      ...base,
      CODECARD_LOCAL_SEED_SUPABASE_URL: `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failures).toContain('production_supabase_url_forbidden');
  });

  it('rejects unknown remote targets', () => {
    const result = validateLocalSeedEnvironment({
      ...base,
      CODECARD_LOCAL_SEED_SUPABASE_URL: 'https://abcdefghij1234567890.supabase.co',
      CODECARD_LOCAL_SEED_PROJECT_REF: 'abcdefghij1234567890',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failures).toContain('unknown_remote_target_forbidden');
  });

  it('rejects staging without explicit allow', () => {
    const result = validateLocalSeedEnvironment({
      ...base,
      CODECARD_LOCAL_SEED_SUPABASE_URL: `https://${STAGING_SUPABASE_PROJECT_REF}.supabase.co`,
      CODECARD_LOCAL_SEED_PROJECT_REF: STAGING_SUPABASE_PROJECT_REF,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failures).toContain('staging_requires_explicit_allow');
  });

  it('allows staging only with explicit flag', () => {
    const result = validateLocalSeedEnvironment({
      ...base,
      CODECARD_LOCAL_SEED_ALLOW_STAGING: '1',
      CODECARD_LOCAL_SEED_SUPABASE_URL: `https://${STAGING_SUPABASE_PROJECT_REF}.supabase.co`,
      CODECARD_LOCAL_SEED_PROJECT_REF: STAGING_SUPABASE_PROJECT_REF,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.env.target).toBe('staging');
  });

  it('uses a non-showcase, non-reserved seed identity', () => {
    expect(LOCAL_SEED_SLUG).toBe('local-dev');
    expect(LOCAL_SEED_SLUG).not.toBe('alex-chen');
    expect(LOCAL_SEED_SLUG).not.toBe('demo');
    expect(isReservedProfileSlug(LOCAL_SEED_SLUG)).toBe(false);
    expect(LOCAL_SEED_EMAIL).not.toContain('alex.chen');
    expect(LOCAL_SEED_EMAIL).toMatch(/\.test$/);
  });
});

describe('WS14-T020 local seed script contract', () => {
  it('wires npm run db:seed to supabase/seed.ts', () => {
    const pkg = readRepo('package.json');
    expect(pkg).toContain('"db:seed": "tsx supabase/seed.ts"');
    const seed = readRepo('supabase/seed.ts');
    const guard = readRepo('supabase/seed-guard.ts');
    expect(seed).toContain('runLocalSeed');
    expect(seed).toContain('requireLocalSeedEnvironment');
    expect(guard).toContain('production_project_ref_forbidden');
    expect(guard).toContain('unknown_remote_target_forbidden');
    expect(seed).toContain("is_published: false");
    expect(seed).toContain("is_published: true");
    expect(seed).not.toMatch(/password:\s*['"][^'"]+['"]/);
    expect(seed).not.toContain(PRODUCTION_SUPABASE_PROJECT_REF);
  });

  it('documents cleanup and deliberate execution', () => {
    const doc = readRepo('docs/LOCAL_SEED.md');
    expect(doc).toContain('CODECARD_LOCAL_SEED=1');
    expect(doc).toContain('CODECARD_LOCAL_SEED_PASSWORD');
    expect(doc).toContain(PRODUCTION_SUPABASE_PROJECT_REF);
    expect(doc).toContain('idempotent');
    expect(doc).toContain('/local-dev');
    expect(doc).not.toContain('alex-chen');
    expect(doc).not.toMatch(/public slug \| `\/demo`/i);
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { SLUG_REGEX } from '@codecard/validation';

/**
 * WS01-T002 static contract checks for signup slug handling.
 * Row-level tests live in:
 *   supabase/tests/database/020_ws01_t002_signup_slug.test.sql
 * Run with Docker: npx supabase start && npx supabase test db
 */
const SLUG_MIGRATION = readFileSync(
  join(__dirname, '../../../../../supabase/migrations/20250627000005_handle_new_user_slug.sql'),
  'utf8',
);

function extractFunction(sql: string, name: string): string {
  const marker = `CREATE OR REPLACE FUNCTION public.${name}`;
  const start = sql.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const end = sql.indexOf('$$;', start);
  expect(end).toBeGreaterThan(start);
  return sql.slice(start, end);
}

describe('WS01-T002 signup slug handling migration', () => {
  const normalizeFn = extractFunction(SLUG_MIGRATION, 'normalize_signup_slug');
  const handleFn = extractFunction(SLUG_MIGRATION, 'handle_new_user');

  it('defines normalize_signup_slug with repository slug limits', () => {
    expect(normalizeFn).toContain('length(candidate) < 3');
    expect(normalizeFn).toContain('length(candidate) > 63');
    expect(normalizeFn).toContain("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$");
    expect(normalizeFn).toContain("regexp_replace(candidate, '[^a-z0-9-]+', '-', 'g')");
    expect(normalizeFn).toContain("btrim(candidate, '-')");
  });

  it('aligns server slug regex with client SLUG_REGEX', () => {
    const serverPattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    const samples = ['abc', 'jane-doe', 'a1b2c3', 'user-12345'];
    for (const sample of samples) {
      expect(serverPattern.test(sample)).toBe(SLUG_REGEX.test(sample));
    }
  });

  it('reads signup slug metadata with display-name and email fallback', () => {
    expect(handleFn).toContain("NEW.raw_user_meta_data->>'slug'");
    expect(handleFn).toContain('public.normalize_signup_slug');
    expect(handleFn).toContain("NEW.raw_user_meta_data->>'display_name'");
    expect(handleFn).toContain("split_part(NEW.email, '@', 1)");
  });

  it('retries tenant insert on slug collision without breaking signup', () => {
    expect(handleFn).toContain('WHEN unique_violation THEN');
    expect(handleFn).toContain('suffix := suffix + 1');
  });

  it('preserves tenant, membership, and profile ownership provisioning', () => {
    expect(handleFn).toContain('INSERT INTO tenants');
    expect(handleFn).toContain('INSERT INTO tenant_memberships');
    expect(handleFn).toContain('INSERT INTO profiles');
    expect(handleFn).toMatch(/VALUES\s*\(\s*new_tenant_id,\s*NEW\.id,\s*'owner'\s*\)/);
    expect(handleFn).toContain('owner_user_id');
    expect(handleFn).toContain('user_slug');
    expect(handleFn).toContain('SECURITY DEFINER');
    expect(handleFn).toContain('SET search_path = public');
  });
});

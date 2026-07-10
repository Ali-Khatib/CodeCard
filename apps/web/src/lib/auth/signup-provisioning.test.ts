import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * WS01-T001 static contract checks for handle_new_user() provisioning.
 * Full row-level integration tests live in:
 *   supabase/tests/database/010_ws01_t001_signup_provisioning.test.sql
 * Run with Docker: npx supabase start && npx supabase test db
 */
const INITIAL_SCHEMA = readFileSync(
  join(__dirname, '../../../../../supabase/migrations/20250627000001_initial_schema.sql'),
  'utf8',
);

function extractHandleNewUser(sql: string): string {
  const start = sql.indexOf('CREATE OR REPLACE FUNCTION handle_new_user()');
  const end = sql.indexOf('CREATE TRIGGER on_auth_user_created', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return sql.slice(start, end);
}

describe('WS01-T001 signup provisioning trigger contract', () => {
  const fn = extractHandleNewUser(INITIAL_SCHEMA);

  it('defines handle_new_user on auth.users insert', () => {
    expect(INITIAL_SCHEMA).toContain('CREATE TRIGGER on_auth_user_created');
    expect(INITIAL_SCHEMA).toContain('AFTER INSERT ON auth.users');
    expect(INITIAL_SCHEMA).toContain('EXECUTE FUNCTION handle_new_user()');
  });

  it('uses SECURITY DEFINER with a safe search_path', () => {
    expect(fn).toContain('SECURITY DEFINER');
    expect(fn).toContain('SET search_path = public');
  });

  it('provisions tenant, membership, and profile without client-side inserts', () => {
    expect(fn).toContain('INSERT INTO tenants');
    expect(fn).toContain('INSERT INTO tenant_memberships');
    expect(fn).toContain('INSERT INTO profiles');
    expect(fn).toMatch(/VALUES\s*\(\s*new_tenant_id,\s*NEW\.id,\s*'owner'\s*\)/);
    expect(fn).toContain('owner_user_id');
    expect(fn).toContain('NEW.id');
    expect(fn).toContain('is_public');
    expect(fn).toContain('false');
  });

  it('uses display_name metadata with email local-part fallback', () => {
    expect(fn).toContain("COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))");
  });

  it('derives slug from email (signup slug metadata is not consumed here)', () => {
    expect(fn).toContain("split_part(NEW.email, '@', 1)");
    expect(fn).not.toContain("raw_user_meta_data->>'slug'");
  });
});

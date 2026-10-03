import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  isSchemaMismatchError,
  OWNER_HOME_PROFILE_COLUMNS,
  OWNER_SHELL_PROFILE_COLUMNS,
} from './owner-profile';

function readRepo(relativePath: string) {
  return readFileSync(resolve(process.cwd(), '../..', relativePath), 'utf8');
}

function readMigrations() {
  const directory = resolve(process.cwd(), '../..', 'supabase/migrations');
  return readdirSync(directory)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => readFileSync(resolve(directory, name), 'utf8'))
    .join('\n');
}

describe('owner profile provisioning', () => {
  it('treats a missing column or table as schema drift', () => {
    expect(isSchemaMismatchError({ code: '42703' })).toBe(true);
    expect(isSchemaMismatchError({ code: 'PGRST204', message: 'column missing' })).toBe(true);
    expect(isSchemaMismatchError({ message: 'relation "profiles" does not exist' })).toBe(true);
    expect(isSchemaMismatchError({ code: 'PGRST116', message: 'JSON object requested' })).toBe(
      false,
    );
    expect(isSchemaMismatchError(null)).toBe(false);
  });

  it('only selects profile columns the migrations create', () => {
    const migrations = readMigrations();
    const columns = `${OWNER_SHELL_PROFILE_COLUMNS}, ${OWNER_HOME_PROFILE_COLUMNS}`
      .split(',')
      .map((column) => column.trim());

    for (const column of columns) {
      expect(migrations, `migrations never create profiles.${column}`).toMatch(
        new RegExp(`\\b${column}\\b`),
      );
    }
  });

  it('provisions a profile from the signup trigger and from the signed-in app', () => {
    const migration = readRepo('supabase/migrations/20261003193000_ensure_owner_profile.sql');
    const helper = readFileSync(resolve(process.cwd(), 'src/lib/profile/owner-profile.ts'), 'utf8');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.ensure_owner_profile');
    expect(migration).toContain('PERFORM public.ensure_owner_profile(NEW.id)');
    expect(migration).toContain("meta->>'full_name'");
    expect(migration).toContain("meta->>'user_name'");
    expect(helper).toContain("rpc('ensure_owner_profile')");
  });
});

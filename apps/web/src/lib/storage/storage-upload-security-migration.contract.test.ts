import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationPath = resolve(
  process.cwd(),
  '../../supabase/migrations/20260717140001_storage_upload_security_hardening.sql',
);

describe('WS11-T010 storage upload security migration contract', () => {
  const sql = readFileSync(migrationPath, 'utf8');

  it('adds resource-ownership checks to storage write authorization', () => {
    expect(sql).toContain('storage_object_resource_owned');
    expect(sql).toContain('storage_path_resource_id');
    expect(sql).toContain("rtype = 'avatar'");
    expect(sql).toContain("rtype = 'project-media'");
    expect(sql).toContain("rtype = 'research-figure'");
    expect(sql).toContain('AND public.storage_object_resource_owned(object_path)');
  });

  it('creates the upload intent ledger with RLS and owner policies', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS storage_upload_intents');
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('storage_upload_intents_owner_insert');
    expect(sql).toContain('storage_upload_intents_owner_select');
    expect(sql).toContain('storage_upload_intents_owner_update');
    expect(sql).toContain('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE storage_upload_intents TO service_role');
    expect(sql).toContain('REVOKE ALL ON TABLE storage_upload_intents FROM anon');
  });

  it('does not grant anonymous write access to storage objects', () => {
    expect(sql).not.toMatch(/TO anon[\s\S]{0,80}INSERT/);
    expect(sql).not.toContain('storage_objects_anon_insert');
  });
});

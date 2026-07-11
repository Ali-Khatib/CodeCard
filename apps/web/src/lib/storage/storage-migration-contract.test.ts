import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationPath = resolve(
  process.cwd(),
  '../../supabase/migrations/20250627000008_storage_buckets_rls.sql',
);

describe('WS04-T001 storage migration contract', () => {
  const sql = readFileSync(migrationPath, 'utf8');

  it('creates all required buckets with conflict-safe inserts', () => {
    expect(sql).toContain("'avatars'");
    expect(sql).toContain("'project-media'");
    expect(sql).toContain("'private-docs'");
    expect(sql).toContain('ON CONFLICT (id) DO NOTHING');
  });

  it('configures MIME and size restrictions at the bucket level', () => {
    expect(sql).toContain('allowed_mime_types');
    expect(sql).toContain('5242880');
    expect(sql).toContain('52428800');
    expect(sql).toContain('10485760');
    expect(sql).toContain("'application/pdf'");
    expect(sql).not.toContain('image/svg');
  });

  it('enforces canonical owner-scoped storage policies', () => {
    expect(sql).toContain('storage_canonical_path_valid');
    expect(sql).toContain('storage_object_owner_may_write');
    expect(sql).toContain('storage_objects_owner_insert');
    expect(sql).toContain('auth.uid()');
    expect(sql).toContain('user_tenant_ids()');
    expect(sql).toContain('storage_private_docs_owner_select');
    expect(sql).toContain('storage_avatars_public_select');
    expect(sql).toContain('storage_project_media_public_select');
  });

  it('keeps private-docs private while allowing public reads for media buckets', () => {
    expect(sql).toMatch(/'private-docs'[\s\S]*?false/);
    expect(sql).not.toContain('storage_private_docs_public_select');
  });
});

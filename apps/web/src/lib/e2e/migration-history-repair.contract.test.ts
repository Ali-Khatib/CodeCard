import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// WS14 migration-history repair contract.
//
// Commit 37b5f78 edited two already-shipped migrations in place. This suite
// proves the historical files were restored to their original authored content
// and that the required corrections now live in a single forward-only migration.

const migrationsDir = resolve(process.cwd(), '../../supabase/migrations');

const read = (file: string) => readFileSync(resolve(migrationsDir, file), 'utf8');

const PROFILE_MIGRATION = '20250627000007_profile_location_skills.sql';
const STORAGE_MIGRATION = '20250627000008_storage_buckets_rls.sql';
const REPAIR_MIGRATION = '20260718180000_ws14_migration_history_repair.sql';

const STORAGE_POLICIES = [
  'storage_objects_owner_insert',
  'storage_objects_owner_update',
  'storage_objects_owner_delete',
  'storage_avatars_public_select',
  'storage_project_media_public_select',
  'storage_private_docs_owner_select',
];

describe('WS14 migration-history repair contract', () => {
  const profileSql = read(PROFILE_MIGRATION);
  const storageSql = read(STORAGE_MIGRATION);
  const repairSql = read(REPAIR_MIGRATION);

  describe('historical migrations restored to original content', () => {
    it('20250627000007 keeps its original inline CHECK and carries none of the bootstrap fix', () => {
      // Original authored form: the per-item rule was an inline subquery CHECK.
      expect(profileSql).toMatch(
        /ADD CONSTRAINT profiles_skills_item_length_chk\s*CHECK \(\s*NOT EXISTS \(/,
      );
      // The bootstrap-era helper must NOT live in this historical file anymore.
      expect(profileSql).not.toContain('profile_skills_items_valid');
      expect(profileSql).not.toContain('CREATE OR REPLACE FUNCTION');
    });

    it('20250627000008 keeps its original bare ALTER and none of the bootstrap guard', () => {
      expect(storageSql).toContain('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;');
      // The guarded DO-block from the bootstrap must NOT live in this file anymore.
      expect(storageSql).not.toMatch(/DO \$\$[\s\S]*relrowsecurity[\s\S]*storage\.objects/);
      // Policies were always authored here and must remain.
      for (const policy of STORAGE_POLICIES) {
        expect(storageSql).toContain(policy);
      }
    });
  });

  describe('correction lives in a new forward-only migration', () => {
    it('the repair migration is the newest timestamp in the directory', () => {
      const versions = readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .map((f) => f.slice(0, 14))
        .filter((v) => /^\d{14}$/.test(v));
      const repairVersion = REPAIR_MIGRATION.slice(0, 14);
      const maxVersion = versions.reduce((a, b) => (a > b ? a : b));
      expect(repairVersion).toBe(maxVersion);
    });

    it('re-expresses the skills rule through the CHECK helper, never an inline subquery', () => {
      expect(repairSql).toContain('CHECK (public.profile_skills_items_valid(skills))');
      // No subquery embedded directly inside a CHECK (the 0A000 defect).
      expect(repairSql).not.toMatch(/CHECK \([^;]*\bSELECT\b/i);
    });

    it('declares the helper IMMUTABLE with a pinned search_path and reads only its argument', () => {
      const fnMatch = repairSql.match(
        /CREATE OR REPLACE FUNCTION public\.profile_skills_items_valid[\s\S]*?\$\$([\s\S]*?)\$\$;/,
      );
      expect(fnMatch, 'helper function must be defined').not.toBeNull();
      const header = repairSql.slice(0, repairSql.indexOf('AS $$'));
      expect(header).toContain('IMMUTABLE');
      expect(header).toMatch(/SET search_path = pg_catalog/);
      const body = fnMatch![1];
      // The body must depend only on its argument + built-ins; no table reads.
      expect(body).toContain('unnest(skills)');
      expect(body).not.toMatch(/FROM\s+(public\.|profiles|auth\.|storage\.)/i);
    });

    it('guards the storage.objects RLS toggle for hosted Supabase compatibility', () => {
      expect(repairSql).toMatch(
        /IF NOT EXISTS \(\s*SELECT 1 FROM pg_class\s*WHERE oid = 'storage\.objects'::regclass AND relrowsecurity\s*\)/,
      );
      // The enable must be conditional, never a bare unconditional ALTER.
      expect(repairSql).not.toMatch(
        /^\s*ALTER TABLE storage\.objects ENABLE ROW LEVEL SECURITY;/m,
      );
    });

    it('re-asserts every storage policy so the guarded ALTER cannot leave them absent', () => {
      for (const policy of STORAGE_POLICIES) {
        expect(repairSql).toContain(`DROP POLICY IF EXISTS ${policy}`);
        expect(repairSql).toContain(`CREATE POLICY ${policy}`);
      }
    });

    it('is idempotent where intended and never silently swallows failures', () => {
      expect(repairSql).toContain('CREATE OR REPLACE FUNCTION');
      expect(repairSql).toContain('DROP CONSTRAINT IF EXISTS profiles_skills_item_length_chk');
      // The only control-flow block is the conditional RLS enable; there is no
      // blanket exception handler hiding a failed statement.
      expect(repairSql).not.toMatch(/EXCEPTION\s+WHEN/i);
    });
  });
});

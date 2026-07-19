import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// WS14 fresh-replayability contract.
//
// Migrations 007 and 008 were never deployed to production and never successfully
// applied anywhere in their original form, so they are corrected in place to make
// the whole chain replayable from a completely fresh database. The later repair
// migration is retained as an idempotent compatibility pass. This suite pins those
// invariants at the SQL level.

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

describe('WS14 fresh-replayable migration contract', () => {
  const profileSql = read(PROFILE_MIGRATION);
  const storageSql = read(STORAGE_MIGRATION);
  const repairSql = read(REPAIR_MIGRATION);

  describe('007 profile_location_skills is valid on fresh PostgreSQL', () => {
    it('never embeds a subquery directly inside a CHECK constraint (avoids 0A000)', () => {
      expect(profileSql).not.toMatch(/CHECK \([^;]*\bSELECT\b/i);
      expect(profileSql).toContain('CHECK (public.profile_skills_items_valid(skills))');
    });

    it('validates skills through an argument-only IMMUTABLE helper with a pinned search_path', () => {
      const fnMatch = profileSql.match(
        /CREATE OR REPLACE FUNCTION public\.profile_skills_items_valid[\s\S]*?\$\$([\s\S]*?)\$\$;/,
      );
      expect(fnMatch, 'helper function must be defined in 007').not.toBeNull();
      const header = profileSql.slice(0, profileSql.indexOf('AS $$'));
      expect(header).toContain('IMMUTABLE');
      expect(header).toMatch(/SET search_path = pg_catalog/);
      const body = fnMatch![1];
      expect(body).toContain('unnest(skills)');
      // Rejects blank + over-length; depends only on its argument (no table reads).
      expect(body).toMatch(/char_length\(skill\.value\) < 1/);
      expect(body).toMatch(/char_length\(skill\.value\) > 50/);
      expect(body).not.toMatch(/FROM\s+(public\.|profiles|auth\.|storage\.)/i);
    });

    it('keeps the location and skills-count guards', () => {
      expect(profileSql).toContain('profiles_location_length_chk');
      expect(profileSql).toContain('cardinality(skills) <= 30');
    });
  });

  describe('008 storage_buckets_rls is valid on hosted Supabase', () => {
    it('never unconditionally ALTERs storage.objects (avoids ownership 42501)', () => {
      expect(storageSql).not.toMatch(
        /^\s*ALTER TABLE storage\.objects ENABLE ROW LEVEL SECURITY;/m,
      );
      expect(storageSql).toMatch(
        /IF NOT EXISTS \(\s*SELECT 1 FROM pg_class\s*WHERE oid = 'storage\.objects'::regclass AND relrowsecurity\s*\)/,
      );
    });

    it('verifies RLS is enabled and fails loudly rather than leaving storage open', () => {
      expect(storageSql).toMatch(/RAISE EXCEPTION 'storage\.objects RLS is not enabled/);
    });

    it('creates every required owner-scoped / public-read policy unconditionally', () => {
      for (const policy of STORAGE_POLICIES) {
        expect(storageSql).toContain(`CREATE POLICY ${policy}`);
      }
      expect(storageSql).toContain('auth.uid()');
      expect(storageSql).not.toMatch(/storage_private_docs[\s\S]*FOR SELECT[\s\S]*true/);
    });
  });

  describe('repair migration is a retained idempotent compatibility pass', () => {
    it('is still present, with only strictly newer forward-only migrations after it', () => {
      const versions = readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .map((f) => f.slice(0, 14))
        .filter((v) => /^\d{14}$/.test(v));
      const repairVersion = REPAIR_MIGRATION.slice(0, 14);
      expect(versions).toContain(repairVersion);
      // Forward-only discipline: timestamps stay unique and everything after
      // the history repair is a known, strictly newer forward-only migration.
      expect(new Set(versions).size).toBe(versions.length);
      const newer = readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql') && f.slice(0, 14) > repairVersion)
        .sort();
      expect(newer).toEqual([
        '20260719010000_ws14_upload_intent_grants.sql',
        '20260719153000_repair_project_research_tenant_ownership_rls.sql',
      ]);
    });

    it('WS14-T003 upload-intent grants migration matches the owner policies', () => {
      const grantsSql = read('20260719010000_ws14_upload_intent_grants.sql');
      // Exactly the operations the owner-scoped policies were written for —
      // never DELETE (service-role-only) and never anon.
      expect(grantsSql).toContain(
        'GRANT SELECT, INSERT, UPDATE ON TABLE public.storage_upload_intents TO authenticated;',
      );
      expect(grantsSql).not.toMatch(/^GRANT[^;]*\bDELETE\b[^;]*TO authenticated/im);
      expect(grantsSql).not.toMatch(/^GRANT[^;]*TO anon\b/im);
    });

    it('documents its idempotent compatibility purpose', () => {
      expect(repairSql).toMatch(/idempotent compatibility/i);
      expect(repairSql).toMatch(/corrected in place/i);
    });

    it('re-asserts the same helper, constraint and policies without conflict', () => {
      expect(repairSql).toContain('CREATE OR REPLACE FUNCTION public.profile_skills_items_valid');
      expect(repairSql).toContain('DROP CONSTRAINT IF EXISTS profiles_skills_item_length_chk');
      expect(repairSql).toContain('CHECK (public.profile_skills_items_valid(skills))');
      for (const policy of STORAGE_POLICIES) {
        expect(repairSql).toContain(`DROP POLICY IF EXISTS ${policy}`);
        expect(repairSql).toContain(`CREATE POLICY ${policy}`);
      }
    });

    it('never silently swallows failures', () => {
      expect(repairSql).not.toMatch(/EXCEPTION\s+WHEN/i);
    });
  });
});

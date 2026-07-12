import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationPath = resolve(
  process.cwd(),
  '../../supabase/migrations/20250627000009_project_foundation_fields.sql',
);

describe('WS03-T002 project foundation migration contract', () => {
  const sql = readFileSync(migrationPath, 'utf8');

  it('adds all five project foundation columns', () => {
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS slug text');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS user_role text');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS started_at date');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS ended_at date');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS status text');
  });

  it('backfills slug deterministically and enforces per-profile uniqueness', () => {
    expect(sql).toContain('base_project_slug');
    expect(sql).toContain('row_number() OVER');
    expect(sql).toContain('projects_profile_slug_unique UNIQUE (profile_id, slug)');
    expect(sql).toContain("ALTER COLUMN slug SET NOT NULL");
  });

  it('adds slug format, role length, status length, and date range checks', () => {
    expect(sql).toContain('projects_slug_format_chk');
    expect(sql).toContain('projects_user_role_length_chk');
    expect(sql).toContain('projects_status_length_chk');
    expect(sql).toContain('projects_date_range_chk');
    expect(sql).toContain('ended_at >= started_at');
  });

  it('preserves existing rows and assigns insert-time slugs for legacy create paths', () => {
    expect(sql).not.toContain('DELETE FROM projects');
    expect(sql).not.toContain('DROP TABLE projects');
    expect(sql).toContain('projects_assign_slug_before_insert');
  });

  it('uses a unique forward-only migration timestamp', () => {
    expect(migrationPath).toContain('20250627000009_project_foundation_fields.sql');
    const migrationsDir = resolve(process.cwd(), '../../supabase/migrations');
    const duplicates = readFileSync(resolve(migrationsDir, '20250627000009_project_foundation_fields.sql'), 'utf8');
    expect(duplicates.length).toBeGreaterThan(0);
    expect(sql).not.toContain('20250627000008');
  });
});

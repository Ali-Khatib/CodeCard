import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationPath = resolve(
  process.cwd(),
  '../../supabase/migrations/20250715000001_research_figure_storage.sql',
);

describe('WS04-T008 research figure storage migration contract', () => {
  const sql = readFileSync(migrationPath, 'utf8');

  it('adds storage_path and research-figure resource compatibility', () => {
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS storage_path text');
    expect(sql).toContain("'research-figure'");
    expect(sql).toContain("resource_type IN ('project-media', 'research-figure')");
    expect(sql).toContain('storage_resource_type_valid');
    expect(sql).toContain('storage_bucket_allows_resource_type');
    expect(sql).not.toContain('supabase db push');
  });

  it('documents that storage_path is authoritative and signed URLs must not be stored', () => {
    expect(sql).toMatch(/Authoritative reference/i);
    expect(sql).toMatch(/Never store signed URLs/i);
  });
});

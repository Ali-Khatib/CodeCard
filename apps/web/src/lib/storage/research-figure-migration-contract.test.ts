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

describe('project-media public read policy covers every allowed resource type', () => {
  const policySql = readFileSync(
    resolve(
      process.cwd(),
      '../../supabase/migrations/20260825030000_research_figure_public_select_policy.sql',
    ),
    'utf8',
  );

  /** Executable SQL only — the header comment quotes the old predicate. */
  const executableSql = policySql
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');

  /*
   * The bucket accepts 'project-media' and 'research-figure'. Pinning the read
   * policy to a literal resource type is what let the two drift apart before,
   * so the policy must delegate to the shared bucket rule instead.
   */
  it('delegates the resource-type check to storage_bucket_allows_resource_type', () => {
    expect(executableSql).toContain('CREATE POLICY storage_project_media_public_select');
    expect(executableSql).toContain('storage_bucket_allows_resource_type');
    expect(executableSql).not.toMatch(/storage_path_resource_type\(name\)\s*=\s*'project-media'/);
  });

  it('still requires a canonical owner-scoped path', () => {
    expect(executableSql).toContain('storage_canonical_path_valid(name)');
    expect(executableSql).toContain("bucket_id = 'project-media'");
  });

  it('stays forward-only and manual-deploy', () => {
    expect(policySql).toMatch(/Forward-only/i);
    expect(policySql).toMatch(/MANUAL DEPLOY ONLY/i);
    expect(policySql).not.toContain('supabase db push');
  });
});

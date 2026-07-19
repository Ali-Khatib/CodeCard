import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Contract test for the forward-only tenant-ownership RLS repair.
 * Proves the migration file exists, is forward-only (does not edit
 * historical policy migrations), asserts integrity first, and replaces
 * both owner policies with the full three-condition predicate.
 */

const repoRoot = resolve(process.cwd(), '..', '..');
const migrationsDir = resolve(repoRoot, 'supabase', 'migrations');
const REPAIR = '20260719153000_repair_project_research_tenant_ownership_rls.sql';
const HISTORICAL_PROJECTS = '20250627000002_rls_policies.sql';
const HISTORICAL_RESEARCH = '20250627000004_research_papers.sql';

function readMigration(name: string): string {
  return readFileSync(resolve(migrationsDir, name), 'utf8');
}

describe('WS14 tenant-ownership RLS repair migration contract', () => {
  it('adds a forward-only repair without rewriting historical migrations', () => {
    const files = readdirSync(migrationsDir);
    expect(files).toContain(REPAIR);

    const historicalProjects = readMigration(HISTORICAL_PROJECTS);
    const historicalResearch = readMigration(HISTORICAL_RESEARCH);
    // Historical files keep the original weak predicate — the repair is forward-only.
    expect(historicalProjects).toMatch(
      /CREATE POLICY projects_owner_all[\s\S]*?WITH CHECK \(owner_user_id = auth\.uid\(\)\);/,
    );
    expect(historicalResearch).toMatch(
      /CREATE POLICY research_papers_owner_all[\s\S]*?WITH CHECK \(owner_user_id = auth\.uid\(\)\);/,
    );
  });

  it('asserts integrity before replacing policies and uses the full predicate', () => {
    const sql = readMigration(REPAIR);

    expect(sql).toMatch(/IS DISTINCT FROM/);
    expect(sql).toMatch(/RAISE EXCEPTION/);
    expect(sql).toMatch(/missing_profile/);
    expect(sql).toMatch(/owner_mismatch/);
    expect(sql).toMatch(/tenant_mismatch/);
    expect(sql).toMatch(/Refuse to silently rewrite or delete inconsistent rows/);

    expect(sql).toContain('DROP POLICY IF EXISTS projects_owner_all ON public.projects');
    expect(sql).toContain('DROP POLICY IF EXISTS research_papers_owner_all ON public.research_papers');

    for (const table of ['projects', 'research_papers']) {
      expect(sql).toContain(`CREATE POLICY ${table}_owner_all ON public.${table}`);
    }

    // Both USING and WITH CHECK must require all three conditions.
    const predicatePieces = [
      'owner_user_id = auth.uid()',
      'p.owner_user_id = auth.uid()',
      'p.tenant_id = projects.tenant_id',
      'p.tenant_id = research_papers.tenant_id',
      'FROM public.profiles p',
    ];
    for (const piece of predicatePieces) {
      expect(sql).toContain(piece);
    }

    // Prefer direct EXISTS — no SECURITY DEFINER helper is created.
    expect(sql).not.toMatch(/^\s*CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/im);
    expect(sql).not.toMatch(/^\s*SECURITY\s+DEFINER/im);
  });
});

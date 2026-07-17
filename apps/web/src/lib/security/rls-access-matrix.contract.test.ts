import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO = resolve(process.cwd(), '../..');
const MIGRATIONS = resolve(REPO, 'supabase/migrations');

function read(rel: string) {
  return readFileSync(resolve(REPO, rel), 'utf8');
}

function allMigrationSql(): string {
  return readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(resolve(MIGRATIONS, f), 'utf8'))
    .join('\n\n');
}

/** Every application table that must have ENABLE + FORCE RLS. */
export const RLS_APPLICATION_TABLES = [
  'tenants',
  'tenant_memberships',
  'profiles',
  'profile_links',
  'projects',
  'project_domains',
  'project_focus_areas',
  'project_media_assets',
  'project_links',
  'project_orderings',
  'research_papers',
  'research_figures',
  'saved_connections',
  'connection_notes',
  'collections',
  'collection_items',
  'circle_activity',
  'circle_viewer_state',
  'public_profile_events',
  'project_view_events',
  'analytics_events',
  'subscription_customers',
  'subscriptions',
  'billing_events',
  'moderation_reports',
  'dmca_notices',
  'audit_logs',
  'jobs',
  'account_deletion_operations',
] as const;

/** Owner-private tables: no anonymous SELECT policies. */
const OWNER_PRIVATE_TABLES = [
  'saved_connections',
  'connection_notes',
  'collections',
  'collection_items',
  'circle_viewer_state',
  'subscription_customers',
  'subscriptions',
  'project_orderings',
] as const;

/** Tables with no client policies (service-role / revoked grants). */
const NO_CLIENT_ACCESS_TABLES = [
  'jobs',
  'billing_events',
  'account_deletion_operations',
] as const;

const STORAGE_BUCKETS = ['avatars', 'project-media', 'private-docs'] as const;

describe('WS11-T001 RLS access matrix and migration contracts', () => {
  const sql = allMigrationSql();
  const matrix = read('docs/RLS_ACCESS_MATRIX.md');

  it('documents the complete RLS access matrix including WS15 and WS16', () => {
    expect(existsSync(resolve(REPO, 'docs/RLS_ACCESS_MATRIX.md'))).toBe(true);
    for (const table of RLS_APPLICATION_TABLES) {
      expect(matrix).toContain(`\`${table}\``);
    }
    for (const bucket of STORAGE_BUCKETS) {
      expect(matrix).toContain(`\`${bucket}\``);
    }
    expect(matrix).toContain('circle_activity');
    expect(matrix).toContain('circle_viewer_state');
    expect(matrix).toContain('saved_connections');
    expect(matrix).toContain('connection_notes');
    expect(matrix).toContain('Target cannot see saver');
    expect(matrix).toContain('Viewer-private');
    expect(matrix).toContain('Manual deploy only');
  });

  it('enables and FORCE-enables RLS on every application table', () => {
    for (const table of RLS_APPLICATION_TABLES) {
      const enable =
        sql.includes(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`) ||
        sql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      const force =
        sql.includes(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`) ||
        sql.includes(`ALTER TABLE public.${table} FORCE ROW LEVEL SECURITY`);
      expect(enable, `${table} must ENABLE RLS`).toBe(true);
      expect(force, `${table} must FORCE RLS`).toBe(true);
    }
  });

  it('keeps Connections and Circle private from anon and non-owners', () => {
    expect(sql).toContain('saved_connections_owner');
    expect(sql).toContain('connection_notes_owner');
    expect(sql).toContain('collections_owner');
    expect(sql).toContain('collection_items_owner');
    expect(sql).toContain('sc.owner_user_id = auth.uid()');
    expect(sql).toContain('circle_activity_select_via_connection');
    expect(sql).toContain('circle_viewer_state_owner_select');
    expect(sql).toContain('viewer_user_id = auth.uid()');
    expect(sql).toContain('REVOKE ALL ON public.circle_activity FROM anon');
    expect(sql).toContain('REVOKE ALL ON public.circle_viewer_state FROM anon');
    expect(sql).toContain('REVOKE ALL ON TABLE account_deletion_operations FROM authenticated');
  });

  it('does not grant broad USING(true) SELECT on private owner tables', () => {
    for (const table of OWNER_PRIVATE_TABLES) {
      const policyBlocks = sql.match(
        new RegExp(`CREATE POLICY[\\s\\S]*?ON (?:public\\.)?${table}[\\s\\S]*?;`, 'gi'),
      );
      expect(policyBlocks?.length).toBeGreaterThan(0);
      for (const block of policyBlocks ?? []) {
        if (/FOR SELECT|FOR ALL/i.test(block)) {
          expect(block).not.toMatch(/USING\s*\(\s*true\s*\)/i);
        }
      }
    }
  });

  it('documents deliberate DMCA public INSERT and denies client jobs/billing/deletion ops', () => {
    expect(sql).toMatch(/CREATE POLICY dmca_notices_insert[\s\S]*WITH CHECK\s*\(\s*true\s*\)/);
    expect(matrix).toContain('Deliberate public legal intake');
    for (const table of NO_CLIENT_ACCESS_TABLES) {
      expect(matrix).toMatch(new RegExp(`${table}[\\s\\S]*No client|❌.*❌`));
    }
    expect(sql).toContain('claim_storage_cleanup_jobs');
    expect(sql).toContain('REVOKE ALL ON FUNCTION claim_storage_cleanup_jobs');
  });

  it('requires published+public for public project/research SELECT policies', () => {
    expect(sql).toContain('is_published = true');
    expect(sql).toMatch(/projects_public_select[\s\S]*is_public = true/);
    expect(sql).toMatch(/research_papers_public_select[\s\S]*is_public/);
  });

  it('defines storage owner path policies and public read only for intentional buckets', () => {
    const storage = read('supabase/migrations/20250627000008_storage_buckets_rls.sql');
    expect(storage).toContain('storage_objects_owner_insert');
    expect(storage).toContain('storage_objects_owner_update');
    expect(storage).toContain('storage_objects_owner_delete');
    expect(storage).toContain('storage_avatars_public_select');
    expect(storage).toContain('storage_project_media_public_select');
    expect(storage).toContain('storage_private_docs_owner_select');
    expect(storage).toContain('auth.uid()');
    expect(storage).not.toMatch(/storage_private_docs[\s\S]*FOR SELECT[\s\S]*true/);
  });

  it('audits SECURITY DEFINER helpers for fixed search_path and cleanup privileges', () => {
    expect(sql).toMatch(/user_tenant_ids[\s\S]*SECURITY DEFINER/);
    expect(sql).toMatch(/handle_new_user[\s\S]*SECURITY DEFINER/);
    expect(sql).toMatch(/search_path\s*=\s*public/);
    expect(sql).toContain('cleanup_circle_activity_on_project_delete');
    expect(sql).toContain('cleanup_circle_activity_on_research_delete');
  });

  it('ships executable pgTAP RLS integration for local Supabase', () => {
    const path = resolve(REPO, 'supabase/tests/database/060_ws11_t001_rls_integration.test.sql');
    expect(existsSync(path)).toBe(true);
    const tap = readFileSync(path, 'utf8');
    expect(tap).toContain('WS11-T001');
    expect(tap).toContain('npx supabase test db');
    expect(tap).toContain('saved_connections');
    expect(tap).toContain('circle_activity');
    expect(tap).toContain('circle_viewer_state');
    expect(tap).toContain('projects');
    expect(tap).toContain('research_papers');
    expect(tap).toContain('relforcerowsecurity');
    expect(tap).toContain('set_config');
  });

  it('keeps demo fixtures out of RLS integration and authenticated fallbacks', () => {
    const tap = read('supabase/tests/database/060_ws11_t001_rls_integration.test.sql');
    expect(tap).not.toMatch(/alex-chen|DEMO_CIRCLE|DEMO_CONNECTIONS/i);
    expect(matrix).toContain('Alex Chen demo data is not used');
  });
});

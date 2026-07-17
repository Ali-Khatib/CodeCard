import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CIRCLE_ACTIVITY_EVENT_TYPES,
  CIRCLE_ACTIVITY_TABLE,
  CIRCLE_ACTIVITY_TARGET_TYPES,
} from './circle-activity-contract';

function readRepo(rel: string) {
  return readFileSync(resolve(process.cwd(), '../..', rel), 'utf8');
}

describe('WS16-T002 circle activity schema and RLS', () => {
  const migrationPath = resolve(
    process.cwd(),
    '../../supabase/migrations/20260717034827_circle_activity.sql',
  );
  const sql = readFileSync(migrationPath, 'utf8');

  it('adds circle_activity with allowlisted types, unique dedupe, and indexes', () => {
    expect(existsSync(migrationPath)).toBe(true);
    expect(sql).toContain(`CREATE TABLE IF NOT EXISTS public.${CIRCLE_ACTIVITY_TABLE}`);
    expect(sql).toContain('actor_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE');
    expect(sql).toContain('dedupe_key text NOT NULL');
    expect(sql).toContain('idx_circle_activity_dedupe_key');
    expect(sql).toContain('idx_circle_activity_actor_created');
    expect(sql).toContain('idx_circle_activity_target');
    expect(sql).toContain('idx_circle_activity_feed_chronology');
    for (const type of CIRCLE_ACTIVITY_EVENT_TYPES) {
      expect(sql).toContain(`'${type}'`);
    }
    for (const type of CIRCLE_ACTIVITY_TARGET_TYPES) {
      expect(sql).toContain(`'${type}'`);
    }
    expect(sql).toContain('circle_activity_event_type_known');
    expect(sql).toContain('circle_activity_dedupe_key_not_blank');
  });

  it('enables FORCE RLS with connection-scoped select and actor-owned insert/delete', () => {
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('FORCE ROW LEVEL SECURITY');
    expect(sql).toContain('circle_activity_select_via_connection');
    expect(sql).toContain('saved_connections');
    expect(sql).toContain('sc.saved_profile_id = circle_activity.actor_profile_id');
    expect(sql).toContain('circle_activity_select_own_actor');
    expect(sql).toContain('circle_activity_insert_own_actor');
    expect(sql).toContain('pr.is_published = true');
    expect(sql).toContain('rp.is_published = true');
    expect(sql).toContain('circle_activity_delete_own_actor');
    expect(sql).not.toMatch(/CREATE POLICY[\s\S]*FOR UPDATE/i);
    expect(sql).toContain('REVOKE ALL ON public.circle_activity FROM anon');
  });

  it('cleans up activity when projects or research are deleted', () => {
    expect(sql).toContain('cleanup_circle_activity_on_project_delete');
    expect(sql).toContain('cleanup_circle_activity_on_research_delete');
    expect(sql).toContain('AFTER DELETE ON public.projects');
    expect(sql).toContain('AFTER DELETE ON public.research_papers');
  });

  it('does not claim remote migration application', () => {
    expect(sql).toContain('Manual deploy only');
    expect(sql).toMatch(/do not apply via `supabase db push`/i);
  });

  it('integrates actor-owned activity into account export and deletion', () => {
    const inventory = readRepo('docs/account-data-inventory.md');
    expect(inventory).toContain('circle_activity');

    const exportBuild = readFileSync(
      resolve(process.cwd(), 'src/lib/account/export-build.ts'),
      'utf8',
    );
    const exportSchema = readFileSync(
      resolve(process.cwd(), 'src/lib/account/export-schema.ts'),
      'utf8',
    );
    const deletion = readFileSync(
      resolve(process.cwd(), 'src/lib/account/delete-local-content.ts'),
      'utf8',
    );
    expect(exportSchema).toContain('circle_activity');
    expect(exportBuild).toContain(".from('circle_activity')");
    expect(exportBuild).toContain('actor_profile_id');
    expect(deletion).toContain(".from('circle_activity')");
    expect(deletion).toContain('actor_profile_id');
  });

  it('documents migration path in CIRCLE.md', () => {
    const doc = readRepo('docs/CIRCLE.md');
    expect(doc).toContain('20260717034827_circle_activity.sql');
  });
});

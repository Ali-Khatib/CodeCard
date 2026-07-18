import { describe, expect, it } from 'vitest';
import {
  E2E_REFUSAL_MESSAGE,
  PRODUCTION_SUPABASE_PROJECT_REF,
  requireE2EEnvironment,
} from './env-guard';
import { createE2EAdminClient, createE2EAnonClient } from './admin-fixtures';

/**
 * WS14 schema readiness check (READ-ONLY).
 *
 * Confirms the isolated Supabase project has the schema WS14-T002–T007 need.
 * This file must never mutate anything: no inserts, updates, deletes,
 * upserts, or RPC calls — existence probes and anon-role reads only.
 */

/** Tables required by WS14-T002–T007, from the repository migrations. */
const REQUIRED_TABLES = [
  // Signup provisioning + profiles
  'tenants',
  'tenant_memberships',
  'profiles',
  'profile_links',
  // Projects
  'projects',
  'project_links',
  'project_media_assets',
  'project_domains',
  'project_focus_areas',
  'project_orderings',
  // Research
  'research_papers',
  'research_figures',
  // Analytics
  'public_profile_events',
  'project_view_events',
  // Connections + Circle
  'saved_connections',
  'connection_notes',
  'collections',
  'collection_items',
  'circle_activity',
  'circle_viewer_state',
  // Account export/deletion + billing
  'account_deletion_operations',
  'subscription_customers',
  'subscriptions',
  'billing_events',
  // Uploads + moderation support used by existing fixtures
  'storage_upload_intents',
  'moderation_reports',
  'audit_logs',
  'jobs',
] as const;

const REQUIRED_BUCKETS = ['avatars', 'project-media', 'private-docs'] as const;

/** Tables with no anon policies; anon reads must return no data. */
const RLS_LOCKED_TABLES = ['jobs', 'billing_events', 'account_deletion_operations'] as const;

describe('WS14 isolated E2E schema readiness (read-only)', () => {
  it('environment guard accepts the configured isolated backend', () => {
    const env = requireE2EEnvironment();
    expect(env.projectRef).not.toBe(PRODUCTION_SUPABASE_PROJECT_REF);
    expect(env.supabaseUrl).toContain(env.projectRef);
  });

  it('environment guard rejects the production project', () => {
    expect(() =>
      requireE2EEnvironment({
        ...process.env,
        CODECARD_E2E_SUPABASE_URL: `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`,
        CODECARD_E2E_SUPABASE_PROJECT_REF: PRODUCTION_SUPABASE_PROJECT_REF,
      }),
    ).toThrowError(new RegExp(E2E_REFUSAL_MESSAGE.slice(0, 20)));
  });

  it('all required tables exist', async () => {
    const admin = createE2EAdminClient();
    const missing: string[] = [];
    for (const table of REQUIRED_TABLES) {
      const { error } = await admin.from(table).select('*', { head: true, count: 'exact' });
      if (error) missing.push(`${table} (${error.code})`);
    }
    expect(missing, `missing tables — check supabase/migrations: ${missing.join(', ')}`).toEqual(
      [],
    );
  });

  it('all required storage buckets exist', async () => {
    const admin = createE2EAdminClient();
    const { data, error } = await admin.storage.listBuckets();
    expect(error).toBeNull();
    const ids = new Set((data ?? []).map((bucket) => bucket.id));
    for (const bucket of REQUIRED_BUCKETS) {
      expect(ids.has(bucket), `missing bucket ${bucket} — see 20250627000008_storage_buckets_rls.sql`).toBe(
        true,
      );
    }
  });

  it('service-role-only tables are not readable anonymously (RLS spot check)', async () => {
    const anon = createE2EAnonClient();
    for (const table of RLS_LOCKED_TABLES) {
      const { data, error } = await anon.from(table).select('id').limit(1);
      // Either the read errors or returns zero rows; data must never leak.
      if (!error) {
        expect(data ?? []).toEqual([]);
      }
    }
  });

  it('public profile read path works anonymously (RLS allows public rows only)', async () => {
    const anon = createE2EAnonClient();
    const { data, error } = await anon.from('profiles').select('id, is_public').limit(5);
    expect(error).toBeNull();
    for (const row of data ?? []) {
      expect(row.is_public).toBe(true);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readRepo(rel: string) {
  return readFileSync(resolve(process.cwd(), '../..', rel), 'utf8');
}

describe('WS15-T002 connections schema and RLS', () => {
  const initial = readRepo('supabase/migrations/20250627000001_initial_schema.sql');
  const rls = readRepo('supabase/migrations/20250627000002_rls_policies.sql');
  const force = readRepo('supabase/migrations/20250627000003_force_rls.sql');
  const selfGuard = readRepo('supabase/migrations/20260717020001_connections_self_guard.sql');

  it('retains canonical columns, unique constraint, and foreign keys', () => {
    expect(initial).toContain('CREATE TABLE saved_connections');
    expect(initial).toContain('id uuid PRIMARY KEY');
    expect(initial).toContain('tenant_id uuid NOT NULL');
    expect(initial).toContain('owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE');
    expect(initial).toContain('saved_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE');
    expect(initial).toContain('connected_at timestamptz');
    expect(initial).toContain('created_at timestamptz NOT NULL DEFAULT now()');
    expect(initial).toContain('updated_at timestamptz NOT NULL DEFAULT now()');
    expect(initial).toContain('UNIQUE (owner_user_id, saved_profile_id)');
    expect(initial).toContain('CREATE INDEX idx_saved_connections_owner ON saved_connections(owner_user_id, saved_profile_id)');
  });

  it('keeps owner-only RLS enabled with FORCE RLS', () => {
    expect(rls).toContain('ALTER TABLE saved_connections ENABLE ROW LEVEL SECURITY');
    expect(rls).toContain('CREATE POLICY saved_connections_owner ON saved_connections FOR ALL');
    expect(rls).toContain('USING (owner_user_id = auth.uid())');
    expect(rls).toContain('WITH CHECK (owner_user_id = auth.uid())');
    expect(force).toContain('ALTER TABLE saved_connections FORCE ROW LEVEL SECURITY');
    expect(rls).toContain('CREATE POLICY connection_notes_owner');
    expect(rls).toContain('CREATE POLICY collections_owner');
    expect(rls).toContain('CREATE POLICY collection_items_owner');
  });

  it('adds self-connection prevention and a target lookup index', () => {
    expect(selfGuard).toContain('prevent_self_saved_connection');
    expect(selfGuard).toContain('self connections are not allowed');
    expect(selfGuard).toContain('BEFORE INSERT OR UPDATE OF owner_user_id, saved_profile_id');
    expect(selfGuard).toContain('idx_saved_connections_target');
    expect(selfGuard).toContain('ON public.saved_connections (saved_profile_id)');
    expect(selfGuard).not.toMatch(/DROP TABLE saved_connections/i);
  });

  it('cascades private metadata when a Connection is removed', () => {
    expect(initial).toContain(
      'saved_connection_id uuid NOT NULL REFERENCES saved_connections(id) ON DELETE CASCADE',
    );
  });

  it('does not claim remote application of the migration', () => {
    expect(selfGuard).not.toMatch(/supabase db push/i);
  });
});

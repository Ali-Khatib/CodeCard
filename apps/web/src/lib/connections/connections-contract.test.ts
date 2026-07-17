import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertConnectionIdentity,
  CONNECTION_INVARIANTS,
  CONNECTIONS_TABLE,
  CONNECTION_NOTES_TABLE,
  COLLECTIONS_TABLE,
  COLLECTION_ITEMS_TABLE,
  FORBIDDEN_CONNECTION_RESPONSE_FIELDS,
  isForbiddenConnectionResponseField,
  SAFE_CONNECTION_TARGET_FIELDS,
  UNPUBLISHED_SAVED_TARGET_POLICY,
} from './connections-contract';

function readRepo(rel: string) {
  return readFileSync(resolve(process.cwd(), '../..', rel), 'utf8');
}

describe('WS15-T001 connections data contract', () => {
  it('documents the directed private owner→target model', () => {
    expect(CONNECTIONS_TABLE).toBe('saved_connections');
    expect(CONNECTION_INVARIANTS).toContain('directed_not_mutual');
    expect(CONNECTION_INVARIANTS).toContain('self_connection_forbidden');
    expect(CONNECTION_INVARIANTS).toContain('owner_target_unique');
    expect(CONNECTION_INVARIANTS).toContain('connections_private_to_owner');
    expect(CONNECTION_INVARIANTS).toContain('demo_data_isolated_from_authenticated');
    expect(UNPUBLISHED_SAVED_TARGET_POLICY).toBe('retain_row_hide_private_details');
  });

  it('rejects unauthenticated, invalid, and self-connection identities', () => {
    expect(assertConnectionIdentity({ ownerUserId: null, savedProfileId: 'p1' }).ok).toBe(false);
    expect(assertConnectionIdentity({ ownerUserId: 'u1', savedProfileId: null }).ok).toBe(false);
    expect(
      assertConnectionIdentity({
        ownerUserId: 'u1',
        savedProfileId: 'p1',
        targetOwnerUserId: 'u1',
      }),
    ).toEqual({ ok: false, code: 'SELF_CONNECTION' });
    expect(
      assertConnectionIdentity({
        ownerUserId: 'u1',
        savedProfileId: 'p2',
        targetOwnerUserId: 'u2',
      }),
    ).toEqual({
      ok: true,
      identity: { ownerUserId: 'u1', savedProfileId: 'p2' },
    });
  });

  it('keeps response field allow/deny lists privacy-safe', () => {
    expect(SAFE_CONNECTION_TARGET_FIELDS).toContain('slug');
    expect(SAFE_CONNECTION_TARGET_FIELDS).toContain('displayName');
    expect(SAFE_CONNECTION_TARGET_FIELDS).not.toContain('email');
    expect(isForbiddenConnectionResponseField('email')).toBe(true);
    expect(isForbiddenConnectionResponseField('stripe_customer_id')).toBe(true);
    expect(isForbiddenConnectionResponseField('displayName')).toBe(false);
    expect(FORBIDDEN_CONNECTION_RESPONSE_FIELDS.length).toBeGreaterThan(5);
  });

  it('matches the existing saved_connections schema ownership model', () => {
    const schema = readRepo('supabase/migrations/20250627000001_initial_schema.sql');
    expect(schema).toContain(`CREATE TABLE ${CONNECTIONS_TABLE}`);
    expect(schema).toContain('owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE');
    expect(schema).toContain('saved_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE');
    expect(schema).toContain('UNIQUE (owner_user_id, saved_profile_id)');
    expect(schema).toContain(`CREATE TABLE ${CONNECTION_NOTES_TABLE}`);
    expect(schema).toContain(`CREATE TABLE ${COLLECTIONS_TABLE}`);
    expect(schema).toContain(`CREATE TABLE ${COLLECTION_ITEMS_TABLE}`);
    expect(schema).toContain('saved_connection_id uuid NOT NULL REFERENCES saved_connections(id) ON DELETE CASCADE');
  });

  it('matches existing owner-only RLS and FORCE RLS', () => {
    const rls = readRepo('supabase/migrations/20250627000002_rls_policies.sql');
    const force = readRepo('supabase/migrations/20250627000003_force_rls.sql');
    expect(rls).toContain('CREATE POLICY saved_connections_owner ON saved_connections FOR ALL');
    expect(rls).toContain('USING (owner_user_id = auth.uid())');
    expect(rls).toContain('WITH CHECK (owner_user_id = auth.uid())');
    expect(force).toContain('ALTER TABLE saved_connections FORCE ROW LEVEL SECURITY');
  });

  it('is already covered by account export and deletion inventories', () => {
    const inventoryPath = resolve(process.cwd(), '../../docs/account-data-inventory.md');
    expect(existsSync(inventoryPath)).toBe(true);
    const inventory = readFileSync(inventoryPath, 'utf8');
    expect(inventory).toContain('saved_connections');

    const exportBuild = readFileSync(
      resolve(process.cwd(), 'src/lib/account/export-build.ts'),
      'utf8',
    );
    expect(exportBuild).toContain(".from('saved_connections')");

    const deletion = readFileSync(
      resolve(process.cwd(), 'src/lib/account/delete-local-content.ts'),
      'utf8',
    );
    expect(deletion).toContain(".from('saved_connections')");
    expect(deletion).toContain(".from('connection_notes')");
    expect(deletion).toContain(".from('collections')");
  });

  it('keeps demo Connections data separate from authenticated routes', () => {
    const authPage = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/connections/page.tsx'),
      'utf8',
    );
    const previewPage = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/preview/connections/page.tsx'),
      'utf8',
    );
    const demo = readFileSync(
      resolve(process.cwd(), 'src/lib/dashboard/workspace-demo.ts'),
      'utf8',
    );
    expect(demo).toContain('DEMO_CONNECTIONS');
    expect(authPage).not.toContain('DEMO_CONNECTIONS');
    expect(authPage).toContain('listOwnerConnections');
    expect(previewPage).toContain('DEMO_CONNECTIONS');
    expect(CONNECTION_INVARIANTS).toContain('demo_data_isolated_from_authenticated');
  });

  it('documents the existing validation entry point for saves', () => {
    const validation = readRepo('packages/validation/src/index.ts');
    expect(validation).toContain('saveConnectionSchema');
    expect(validation).toContain('saved_profile_id');
    expect(validation).toContain("connectionSourceSchema.default('manual')");
  });
});

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readWeb(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

function readRepo(rel: string) {
  return readFileSync(resolve(process.cwd(), '../..', rel), 'utf8');
}

describe('WS15-T008 connections quality completion', () => {
  it('documents directed private model, RLS, export/deletion, and demo boundary', () => {
    const docsPath = resolve(process.cwd(), '../../docs/CONNECTIONS.md');
    expect(existsSync(docsPath)).toBe(true);
    const doc = readRepo('docs/CONNECTIONS.md');
    expect(doc).toContain('private directed');
    expect(doc).toContain('collections');
    expect(doc).toContain('connection_notes');
    expect(doc).toContain('FORCE RLS');
    expect(doc).toContain('DEMO_CONNECTIONS');
    expect(doc).toContain('manual deploy');
    expect(doc).toContain('WS16');
    expect(doc).not.toMatch(/service_role|sk_live|eyJhbGci/i);
  });

  it('keeps Circle out of authenticated nav while Connections remain real', () => {
    const shell = readWeb('src/components/dashboard/dashboard-shell.tsx');
    const nav = shell.slice(
      shell.indexOf('const NAV_ITEMS'),
      shell.indexOf('] as const;') + '] as const;'.length,
    );
    expect(nav).toContain("label: 'Connections'");
    expect(nav).not.toContain("label: 'Circle'");
  });

  it('isolates demo Connections from authenticated routes', () => {
    const auth = readWeb('src/app/dashboard/(authenticated)/connections/page.tsx');
    const preview = readWeb('src/app/dashboard/preview/connections/page.tsx');
    const demo = readWeb('src/lib/dashboard/workspace-demo.ts');
    expect(auth).toContain('listOwnerConnections');
    expect(auth).not.toContain('DEMO_CONNECTIONS');
    expect(preview).toContain('DEMO_CONNECTIONS');
    expect(demo).toContain('Jordan Lee');
  });

  it('covers account export and deletion for all WS15 tables', () => {
    const inventory = readRepo('docs/account-data-inventory.md');
    const exportBuild = readWeb('src/lib/account/export-build.ts');
    const deletion = readWeb('src/lib/account/delete-local-content.ts');
    for (const table of ['saved_connections', 'connection_notes', 'collections', 'collection_items']) {
      expect(inventory).toContain(table);
    }
    expect(exportBuild).toContain(".from('saved_connections')");
    expect(exportBuild).toContain(".from('connection_notes')");
    expect(exportBuild).toContain(".from('collections')");
    expect(deletion).toContain(".from('saved_connections')");
    expect(deletion).toContain(".from('connection_notes')");
    expect(deletion).toContain(".from('collections')");
  });

  it('keeps private notes out of public profile and analytics payloads', () => {
    const publicProfile = readWeb('src/lib/profile/public-profile.ts');
    const analytics = readWeb('src/app/api/analytics/route.ts');
    expect(publicProfile).not.toContain('connection_notes');
    expect(publicProfile).not.toContain('privateNote');
    expect(analytics).not.toContain('connection_notes');
    expect(analytics).not.toContain('private_note');
  });

  it('extends Playwright fixture for full management flow coverage', () => {
    const harness = readWeb('src/components/e2e/connections-harness.tsx');
    const spec = readWeb('e2e/connections.spec.ts');
    expect(harness).toContain('Connections save flow fixture');
    expect(spec).toContain('WS15');
    expect(spec).toContain('Build a network you can actually remember');
    expect(spec).toContain('Jordan Lee');
    expect(spec).toContain('Alex Chen');
  });

  it('enforces self-connection and membership ownership in migrations', () => {
    const selfGuard = readRepo('supabase/migrations/20260717020001_connections_self_guard.sql');
    const collections = readRepo(
      'supabase/migrations/20260717031351_connections_collections_hardening.sql',
    );
    const notes = readRepo('supabase/migrations/20260717040001_connection_notes_metadata.sql');
    expect(selfGuard).toContain('prevent_self');
    expect(collections).toContain('sc.owner_user_id = auth.uid()');
    expect(notes).toContain('idx_connection_notes_one_per_connection');
  });
});

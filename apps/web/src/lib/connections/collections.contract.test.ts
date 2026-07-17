import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createCollectionInputSchema,
  collectionMembershipInputSchema,
  updateCollectionInputSchema,
} from '@codecard/validation';

describe('WS15-T005 collections validation', () => {
  it('trims names and rejects blank or oversized values', () => {
    expect(createCollectionInputSchema.safeParse({ name: '  Recruiters  ' }).success).toBe(true);
    expect(createCollectionInputSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(createCollectionInputSchema.safeParse({ name: 'x'.repeat(81) }).success).toBe(false);
    const parsed = createCollectionInputSchema.safeParse({
      name: 'AI Researchers',
      description: '  follow up  ',
      owner_user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe('AI Researchers');
      expect(parsed.data.description).toBe('follow up');
      expect(parsed.data).not.toHaveProperty('owner_user_id');
    }
  });

  it('requires collection and connection ids for membership', () => {
    expect(collectionMembershipInputSchema.safeParse({}).success).toBe(false);
    expect(
      collectionMembershipInputSchema.safeParse({
        collectionId: '11111111-1111-4111-8111-111111111111',
        connectionId: '22222222-2222-4222-8222-222222222222',
      }).success,
    ).toBe(true);
    expect(
      updateCollectionInputSchema.safeParse({
        collectionId: '11111111-1111-4111-8111-111111111111',
        name: 'New',
      }).success,
    ).toBe(true);
  });
});

describe('WS15-T005 collections schema hardening', () => {
  it('adds case-insensitive unique names and owned membership WITH CHECK', () => {
    const migration = resolve(
      process.cwd(),
      '../../supabase/migrations/20260717031351_connections_collections_hardening.sql',
    );
    expect(existsSync(migration)).toBe(true);
    const sql = readFileSync(migration, 'utf8');
    expect(sql).toContain('idx_collections_owner_name_ci');
    expect(sql).toContain('lower(btrim(name))');
    expect(sql).toContain('collections_name_not_blank');
    expect(sql).toContain('sc.owner_user_id = auth.uid()');
    expect(sql).not.toMatch(/DROP TABLE/i);
  });

  it('wires server actions and authenticated UI without demo collections', () => {
    const actions = readFileSync(resolve(process.cwd(), 'src/app/actions/collections.ts'), 'utf8');
    const page = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/connections/page.tsx'),
      'utf8',
    );
    const panel = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/connections-collections-panel.tsx'),
      'utf8',
    );
    const exportBuild = readFileSync(
      resolve(process.cwd(), 'src/lib/account/export-build.ts'),
      'utf8',
    );
    const deletion = readFileSync(
      resolve(process.cwd(), 'src/lib/account/delete-local-content.ts'),
      'utf8',
    );
    const preview = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/preview/connections/page.tsx'),
      'utf8',
    );

    expect(actions).toContain('createCollectionAction');
    expect(actions).toContain('deleteCollectionAction');
    expect(actions).toContain('addConnectionToCollectionAction');
    expect(page).toContain('listOwnerCollections');
    expect(page).toContain('listOwnerMembershipMap');
    expect(page).not.toContain('DEMO_CONNECTIONS');
    expect(panel).toContain('Create collection');
    expect(panel).toContain('Delete');
    expect(panel).toContain('saved Connections stay connected');
    expect(exportBuild).toContain(".from('collections')");
    expect(deletion).toContain(".from('collections')");
    expect(preview).toContain('DEMO_CONNECTIONS');
  });
});

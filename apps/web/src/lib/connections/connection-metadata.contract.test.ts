import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { updateConnectionMetadataInputSchema } from '@codecard/validation';

describe('WS15-T006 private notes contract', () => {
  it('validates note length and preserves multiline content', () => {
    const ok = updateConnectionMetadataInputSchema.safeParse({
      connectionId: '55555555-5555-4555-8555-555555555555',
      privateNote: '  line1\nline2  ',
      context: ' Conference ',
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.privateNote).toBe('line1\nline2');
      expect(ok.data.context).toBe('Conference');
    }
    expect(
      updateConnectionMetadataInputSchema.safeParse({
        connectionId: '55555555-5555-4555-8555-555555555555',
        privateNote: 'x'.repeat(5001),
      }).success,
    ).toBe(false);
  });

  it('adds note uniqueness and context column migration without rewriting history', () => {
    const path = resolve(
      process.cwd(),
      '../../supabase/migrations/20260717040001_connection_notes_metadata.sql',
    );
    expect(existsSync(path)).toBe(true);
    const sql = readFileSync(path, 'utf8');
    expect(sql).toContain('idx_connection_notes_one_per_connection');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS context text');
    expect(sql).not.toMatch(/DROP TABLE/i);
  });

  it('keeps private notes out of public profile responses', () => {
    const publicProfile = readFileSync(
      resolve(process.cwd(), 'src/lib/profile/public-profile.ts'),
      'utf8',
    );
    const page = readFileSync(resolve(process.cwd(), 'src/app/[slug]/page.tsx'), 'utf8');
    expect(publicProfile).not.toContain('connection_notes');
    expect(publicProfile).not.toContain('privateNote');
    expect(page).not.toContain('connection_notes');
    expect(page).not.toContain('privateNote');
  });

  it('wires owner-only metadata UI and export coverage', () => {
    const actions = readFileSync(
      resolve(process.cwd(), 'src/app/actions/connection-metadata.ts'),
      'utf8',
    );
    const panel = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/connection-private-details.tsx'),
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
    expect(actions).toContain('updateConnectionMetadataAction');
    expect(panel).toContain('Only you can see this information');
    expect(panel).toContain('Private note');
    expect(panel).not.toContain('dangerouslySetInnerHTML');
    expect(exportBuild).toContain(".from('connection_notes')");
    expect(exportBuild).toContain('context');
    expect(deletion).toContain(".from('connection_notes')");
  });
});

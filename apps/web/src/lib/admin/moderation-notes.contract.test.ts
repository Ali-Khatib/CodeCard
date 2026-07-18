import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repo = resolve(__dirname, '../../../../..');
const read = (path: string) => readFileSync(resolve(repo, path), 'utf8');
const migration = read(
  'supabase/migrations/20260718052349_ws13_t007_moderation_notes.sql',
);
const route = read('apps/web/src/app/api/admin/reports/[id]/note/route.ts');
const editor = read('apps/web/src/components/admin/moderation-note-editor.tsx');
const reportApi = read('apps/web/src/app/api/moderation/report/route.ts');
const exportBuild = read('apps/web/src/lib/account/export-build.ts');
const adminData = read('apps/web/src/lib/admin/moderation-data.ts');
const audit = read('apps/web/src/lib/admin/admin-audit.ts');

describe('WS13-T007 private moderation notes contracts', () => {
  it('adds a nullable bounded plain-text field with fail-closed column privileges', () => {
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS moderation_notes text');
    expect(migration).toContain('char_length(moderation_notes) <= 4000');
    expect(migration).toContain(
      'REVOKE ALL ON TABLE public.moderation_reports FROM PUBLIC',
    );
    expect(migration).toMatch(/GRANT SELECT \([\s\S]*updated_at[\s\S]*\) ON TABLE public\.moderation_reports TO authenticated/);
    expect(migration).not.toMatch(/GRANT SELECT \([^)]*moderation_notes/);
    expect(migration).toContain('GRANT ALL ON TABLE public.moderation_reports TO service_role');
  });

  it('updates and audits atomically without duplicating note content', () => {
    expect(migration).toContain('FOR UPDATE');
    expect(migration).toContain('p_expected_updated_at');
    expect(migration).toContain("'outcome', 'conflict'");
    expect(migration).toContain("'moderation_note.updated'");
    expect(migration).toContain("'note_length'");
    expect(migration).toContain("'note_present'");
    expect(migration).not.toContain("'note', v_note");
    expect(migration).not.toContain("'note_body'");
    expect(audit).toContain("'moderation_note.updated'");
  });

  it('loads notes only through explicit privileged admin DTO columns', () => {
    expect(adminData).toContain('moderation_notes');
    expect(adminData).toContain('createServiceClient');
    expect(adminData).not.toContain("select('*");
    expect(reportApi).not.toContain('moderation_notes');
    expect(exportBuild).not.toContain('.select(\'moderation_notes');
  });

  it('authorizes and checks CSRF before note mutation', () => {
    const auth = route.indexOf('await requireGlobalAdminApiAccess()');
    const csrf = route.indexOf('isSameOriginMutation(request)');
    const mutation = route.indexOf('await updateModerationNote(');
    expect(auth).toBeGreaterThanOrEqual(0);
    expect(csrf).toBeGreaterThan(auth);
    expect(mutation).toBeGreaterThan(csrf);
    expect(route).toContain('authorization.userId');
    expect(route).not.toMatch(/parsed\.data\.actorUserId|user_metadata|tenant_role/);
  });

  it('renders notes as textarea text with bounded accessible controls', () => {
    expect(editor).toContain('<textarea');
    expect(editor).toContain('maxLength={MODERATION_NOTE_MAX_LENGTH}');
    expect(editor).toContain('autoComplete="off"');
    expect(editor).toContain('aria-describedby');
    expect(editor).toContain('disabled={pending}');
    expect(editor).not.toContain('dangerouslySetInnerHTML');
    expect(editor).not.toMatch(/console\.|analytics|URLSearchParams/);
  });

  it('keeps notes absent from public/demo/owner-facing code paths', () => {
    const publicAndOwnerFiles = [
      'apps/web/src/lib/profile/public-profile.ts',
      'apps/web/src/lib/projects/project-access-core.ts',
      'apps/web/src/lib/research/research-public.ts',
      'apps/web/src/lib/dashboard/workspace-demo.ts',
      'apps/web/src/lib/circle/circle-feed-core.ts',
      'apps/web/src/lib/connections/connections-core.ts',
      'apps/web/src/app/api/analytics/route.ts',
    ];
    for (const path of publicAndOwnerFiles) {
      expect(read(path)).not.toContain('moderation_notes');
    }
  });
});

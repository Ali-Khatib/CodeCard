import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repo = resolve(__dirname, '../../../../..');
const migration = readFileSync(
  resolve(repo, 'supabase/migrations/20260718015921_ws13_t005_content_holds.sql'),
  'utf8',
);
const route = readFileSync(
  resolve(repo, 'apps/web/src/app/api/admin/content/hide/route.ts'),
  'utf8',
);
const actions = readFileSync(
  resolve(repo, 'apps/web/src/components/admin/report-actions.tsx'),
  'utf8',
);
const rls = readFileSync(
  resolve(repo, 'supabase/migrations/20250627000002_rls_policies.sql'),
  'utf8',
);
const circle = readFileSync(
  resolve(repo, 'apps/web/src/lib/circle/circle-feed-core.ts'),
  'utf8',
);
const publicProfile = readFileSync(
  resolve(repo, 'apps/web/src/lib/profile/public-profile.ts'),
  'utf8',
);

describe('WS13-T005 reported content hiding contracts', () => {
  it('supports only actual reportable public models', () => {
    expect(migration).toContain("target_type IN ('profile', 'project')");
    expect(migration).not.toMatch(/target_type IN \([^)]*research/);
    expect(route).toContain('hideReportedContentSchema');
  });

  it('validates the report-target relationship under a row lock', () => {
    expect(migration).toContain('WHERE report.id = p_report_id');
    expect(migration).toContain('FOR UPDATE');
    expect(migration).toContain(
      'v_report_target_type <> p_target_type OR v_report_target_id <> p_target_id',
    );
    expect(migration).toContain("'outcome', 'target_mismatch'");
  });

  it('hides without deleting owner records or storage', () => {
    expect(migration).toContain('SET is_public = false');
    expect(migration).toContain('SET is_published = false');
    expect(migration).not.toMatch(/DELETE FROM public\.(profiles|projects|project_media_assets)/);
    expect(migration).not.toMatch(/storage\.objects|remove\(/);
  });

  it('uses a private durable hold to block direct owner republishing', () => {
    expect(migration).toContain('CREATE TABLE public.moderation_content_holds');
    expect(migration).toContain('ALTER TABLE public.moderation_content_holds FORCE ROW LEVEL SECURITY');
    expect(migration).toContain('CREATE SCHEMA IF NOT EXISTS private');
    expect(migration).toContain('SECURITY DEFINER');
    expect(migration).toContain("RAISE EXCEPTION 'content_under_moderation_hold'");
    expect(migration).toContain('BEFORE INSERT OR UPDATE OF is_public');
    expect(migration).toContain('BEFORE INSERT OR UPDATE OF is_published');
    expect(migration).toContain(
      'REVOKE ALL ON TABLE public.moderation_content_holds FROM PUBLIC, anon, authenticated',
    );
  });

  it('preserves owner dashboard access while public reads remain visibility-gated', () => {
    expect(rls).toContain('is_public = true OR owner_user_id = auth.uid()');
    expect(rls).toMatch(/projects_public_select[\s\S]*is_published = true/);
    expect(rls).toMatch(/projects_public_select[\s\S]*owner_user_id = auth\.uid\(\)/);
    expect(publicProfile).toContain(".eq('is_public', true)");
    expect(publicProfile).toContain('profile.is_public !== true');
  });

  it('removes hidden projects from Circle/public feed hydration', () => {
    expect(circle).toMatch(/is_published[\s\S]*is_public/);
    expect(migration).toContain('SET is_published = false');
    expect(migration).toContain('SET is_public = false');
  });

  it('atomically creates the canonical audit and resolves the source report', () => {
    expect(migration).toContain("SET status = 'resolved'");
    expect(migration).toContain("public.insert_admin_audit_event(");
    expect(migration).toContain("'content.hidden'");
    expect(migration).toContain("format('content-hidden:%s:%s'");
    expect(migration).not.toMatch(/jsonb_build_object\([^)]*(?:reason|report_body)/i);
  });

  it('authorizes and checks CSRF before service-role mutation', () => {
    const auth = route.indexOf('await requireGlobalAdminApiAccess()');
    const csrf = route.indexOf('isSameOriginMutation(request)');
    const mutation = route.indexOf('await hideReportedContent(');

    expect(auth).toBeGreaterThanOrEqual(0);
    expect(csrf).toBeGreaterThan(auth);
    expect(mutation).toBeGreaterThan(csrf);
    expect(route).not.toMatch(/user_metadata|tenant_role|ownerId|actorUserId.*parsed\.data/);
  });

  it('provides confirmation, pending protection, and truthful UI copy', () => {
    expect(actions).toContain('Hide public content');
    expect(actions).toContain('window.confirm(');
    expect(actions).toContain("pendingAction === 'hide'");
    expect(actions).toContain('disabled={pendingAction !== null}');
    expect(actions).toContain("owner's record will be preserved");
    expect(actions).toContain('moderation hold will prevent republishing');
    expect(actions).not.toMatch(/DEMO_|Alex Chen/);
  });
});

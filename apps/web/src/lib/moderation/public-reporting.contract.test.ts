import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repo = resolve(__dirname, '../../../../..');
const read = (path: string) => readFileSync(resolve(repo, path), 'utf8');
const migration = read(
  'supabase/migrations/20260718054209_ws13_t009_public_reporting.sql',
);
const route = read('apps/web/src/app/api/moderation/report/route.ts');
const dialog = read(
  'apps/web/src/components/moderation/public-report-dialog.tsx',
);
const profile = read(
  'apps/web/src/components/profile/public-profile-focused.tsx',
);
const project = read(
  'apps/web/src/components/featured-work/project-detail-view.tsx',
);
const validation = read('packages/validation/src/index.ts');
const profilePage = read('apps/web/src/app/[slug]/page.tsx');
const projectPage = read('apps/web/src/app/[slug]/projects/[id]/page.tsx');

describe('WS13-T009 public reporting contracts', () => {
  it('supports public profile/project targets but does not invent research reporting', () => {
    expect(validation).toContain("target_type: z.enum(['profile', 'project'])");
    expect(migration).toContain("p_target_type NOT IN ('profile', 'project')");
    expect(profile).toContain(
      '<PublicReportDialog targetType="profile" targetId={profileId} />',
    );
    expect(project).toContain(
      '<PublicReportDialog targetType="project" targetId={project.id} />',
    );
    expect(dialog).not.toContain("targetType: 'research'");
    expect(profilePage).toContain('loadPublicProfileBySlug');
    expect(projectPage).toContain(".eq('is_published', true)");
    expect(projectPage).toContain(".eq('is_public', true)");
  });

  it('validates current public state atomically before inserting', () => {
    expect(migration).toMatch(/profiles[\s\S]*is_public = true/);
    expect(migration).toMatch(
      /projects[\s\S]*is_published = true[\s\S]*profile\.is_public = true/,
    );
    expect(migration).toContain("'outcome', 'target_unavailable'");
    expect(migration).not.toMatch(/UPDATE public\.(profiles|projects)/);
    expect(migration).not.toContain('insert_admin_audit_event');
  });

  it('deduplicates by privacy-preserving source and returns one accepted shape', () => {
    expect(migration).toContain('idx_moderation_reports_source_dedupe');
    expect(migration).toContain('WHEN unique_violation');
    expect(migration.match(/jsonb_build_object\('outcome', 'accepted'\)/g)).toHaveLength(
      2,
    );
    expect(route).toContain("status: 'accepted'");
    expect(route).not.toMatch(
      /reportCount|existingReport|moderationStatus|otherReporter/,
    );
  });

  it('uses the shared strict moderation limiter and production-safe route wrapper', () => {
    expect(route).toContain('secureJsonRoute(');
    expect(route).toContain("rateLimitType: 'moderation'");
    expect(route).toContain('strictRateLimit: true');
    expect(route).toContain('maxBodyBytes: 4096');
    expect(route).not.toContain('isSameOriginMutation');
  });

  it('provides an accessible native modal with page-derived immutable targets', () => {
    expect(dialog).toContain('<dialog');
    expect(dialog).toContain('showModal()');
    expect(dialog).toContain('aria-labelledby');
    expect(dialog).toContain('aria-describedby');
    expect(dialog).toContain('onCancel');
    expect(dialog).toContain('onClose={() => triggerRef.current?.focus()}');
    expect(dialog).toContain('disabled={pending}');
    expect(dialog).toContain('maxLength={DESCRIPTION_MAX_LENGTH}');
    expect(dialog).not.toMatch(/name=["']target|targetId.*<input|dangerouslySetInnerHTML/);
  });

  it('keeps demo and owner-preview surfaces isolated by absent real target props', () => {
    expect(profile).toContain(
      'profileId && connectionControl && !connectionControl.isOwnProfile',
    );
    expect(project).toContain("profileId && profileSlug !== 'demo'");
    expect(read('apps/web/src/app/demo/card/page.tsx')).not.toContain('profileId=');
    expect(read('apps/web/src/app/demo/projects/[id]/page.tsx')).not.toContain(
      'profileId=',
    );
  });

  it('keeps private source fields out of ordinary client column grants', () => {
    const ordinaryColumnGrants =
      migration
        .match(
          /GRANT (?:INSERT|SELECT) \([\s\S]*?\) ON TABLE public\.moderation_reports TO (?:anon, authenticated|authenticated)/g,
        )
        ?.join('\n') ?? '';
    expect(migration).toContain(
      'REVOKE ALL ON TABLE public.moderation_reports FROM PUBLIC',
    );
    expect(migration).not.toContain('GRANT INSERT (');
    expect(ordinaryColumnGrants).not.toContain('source_fingerprint');
    expect(ordinaryColumnGrants).not.toContain('dedupe_bucket');
    expect(route).not.toContain('writeAdminAuditEvent');
  });
});

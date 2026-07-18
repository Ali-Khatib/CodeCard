import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../../../../..');
const read = (relative: string) => readFileSync(resolve(root, relative), 'utf8');

describe('WS13-T002 privileged admin data-access boundary', () => {
  it('keeps authorization and privileged readers server-only', () => {
    const authorization = read('apps/web/src/lib/security/admin-api-authorization.ts');
    const data = read('apps/web/src/lib/admin/moderation-data.ts');

    expect(authorization).toMatch(/^import 'server-only';/);
    expect(data).toMatch(/^import 'server-only';/);
    expect(authorization).toContain('resolveGlobalAdminAuthorization');
    expect(authorization).not.toMatch(/user_metadata|tenant_role|headers?\.get\(.+role/i);
    expect(data).toContain('createServiceClient');
  });

  it('authorizes before invoking any privileged route reader', () => {
    for (const path of [
      'apps/web/src/app/api/admin/reports/route.ts',
      'apps/web/src/app/api/admin/dmca/route.ts',
    ]) {
      const source = read(path);
      const authorizationIndex = source.indexOf('await requireGlobalAdminApiAccess()');
      const readIndex = Math.min(
        ...['await listModerationReports(', 'await listDmcaNotices(']
          .map((needle) => source.indexOf(needle))
          .filter((index) => index >= 0),
      );

      expect(authorizationIndex).toBeGreaterThanOrEqual(0);
      expect(readIndex).toBeGreaterThan(authorizationIndex);
      expect(source).toContain("dynamic = 'force-dynamic'");
      expect(source).toContain('no-store');
    }
  });

  it('uses explicit moderation and DMCA column lists', () => {
    const data = read('apps/web/src/lib/admin/moderation-data.ts');

    expect(data).not.toMatch(/\.select\(\s*['"`]\*['"`]/);
    expect(data).not.toMatch(/reporter_user_id|claimant_email|statement|signature/);
    expect(data).toContain('ADMIN_PAGE_SIZE_MAX = 50');
  });

  it('does not grant ordinary users broad moderation reads', () => {
    const rls = read('supabase/migrations/20250627000002_rls_policies.sql');

    expect(rls).toContain(
      'CREATE POLICY moderation_reports_reporter_select ON moderation_reports FOR SELECT',
    );
    expect(rls).toContain('USING (reporter_user_id = auth.uid())');
    expect(rls).not.toMatch(/CREATE POLICY dmca_notices_\w+ ON dmca_notices FOR SELECT/);
    expect(rls).not.toMatch(
      /CREATE POLICY moderation_reports_\w+ ON moderation_reports FOR SELECT[\s\S]{0,180}USING \(true\)/,
    );
  });

  it('does not expose the service-role key or admin readers to client components', () => {
    const data = read('apps/web/src/lib/admin/moderation-data.ts');
    const routes = [
      read('apps/web/src/app/api/admin/reports/route.ts'),
      read('apps/web/src/app/api/admin/dmca/route.ts'),
    ].join('\n');

    expect(data).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(routes).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(routes).not.toContain("'use client'");
  });
});

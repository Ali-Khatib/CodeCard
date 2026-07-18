import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const WEB = resolve(process.cwd());
const REPO = resolve(process.cwd(), '../..');

function readWeb(rel: string) {
  return readFileSync(resolve(WEB, rel), 'utf8');
}

function readRepo(rel: string) {
  return readFileSync(resolve(REPO, rel), 'utf8');
}

describe('WS11-T002 admin route gate contracts', () => {
  const gate = readWeb('src/lib/security/admin-route-gate.ts');
  const layout = readWeb('src/app/admin/layout.tsx');
  const page = readWeb('src/app/admin/page.tsx');
  const forbiddenPage = readWeb('src/app/forbidden.tsx');
  const nextConfig = readWeb('next.config.ts');
  const middleware = readWeb('src/middleware.ts');
  const docs = readRepo('docs/ADMIN_AUTHORIZATION.md');

  it('gate is server-only and reuses only the canonical WS13-T001 resolver', () => {
    expect(gate).toContain("import 'server-only'");
    expect(gate).toContain('resolveGlobalAdminAuthorization');
    expect(gate).toContain("from '@/lib/security/admin-authorization'");
    // No competing role sources.
    expect(gate).not.toMatch(/process\.env\.ADMIN/);
    expect(gate).not.toMatch(/NEXT_PUBLIC_ADMIN/);
    expect(gate).not.toMatch(/user_metadata/);
    expect(gate).not.toMatch(/tenant_role|tenantRole/);
    // Identity comes only from the verified server user — never request input.
    expect(gate).not.toMatch(/headers\(|cookies\(|searchParams|request\./);
    expect(gate).not.toContain('createServiceClient');
  });

  it('layout gates the whole /admin tree before rendering children', () => {
    expect(layout).toContain('await enforceGlobalAdminAccess()');
    expect(layout.indexOf('await enforceGlobalAdminAccess()')).toBeLessThan(
      layout.indexOf('{children}'),
    );
  });

  it('admin page authorizes before invoking privileged T002 readers', () => {
    expect(page).toContain('enforceGlobalAdminAccess');
    const gateIndex = page.indexOf('await enforceGlobalAdminAccess()');
    expect(gateIndex).toBeGreaterThan(-1);
    expect(gateIndex).toBeLessThan(page.indexOf('listModerationReports(reportsQuery.data)'));
    expect(gateIndex).toBeLessThan(page.indexOf('listDmcaNotices(dmcaQuery.data)'));
    expect(page).not.toContain('createClient()');
    expect(page).not.toMatch(/\.from\(['"](?:moderation_reports|dmca_notices)['"]\)/);
    // The page no longer performs its own weaker auth-only redirect.
    expect(page).not.toMatch(/redirect\(['"]\/sign-in['"]\)/);
  });

  it('non-admins get a real 403 via forbidden() with authInterrupts enabled', () => {
    expect(gate).toContain('forbidden()');
    expect(nextConfig).toContain('authInterrupts: true');
  });

  it('forbidden page is opaque, accessible, and has return routes', () => {
    expect(forbiddenPage).toContain('Access denied');
    expect(forbiddenPage).toMatch(/<h1/);
    expect(forbiddenPage).toContain('href="/dashboard"');
    expect(forbiddenPage).toContain('href="/"');
    // Rendered markup exposes no admin details, role configuration, or raw errors.
    const rendered = forbiddenPage.slice(forbiddenPage.indexOf('return ('));
    expect(rendered).not.toMatch(/app_metadata|role|admin|moderation|dmca/i);
    expect(rendered).not.toMatch(/error\.message|digest/);
  });

  it('middleware keeps coarse auth routing only (no metadata role decision)', () => {
    expect(middleware).toContain("pathname.startsWith('/admin')");
    expect(middleware).not.toMatch(/app_metadata|user_metadata|role/);
  });

  it('documents enforcement location and that APIs still need their own checks', () => {
    expect(docs).toContain('src/app/admin/layout.tsx');
    expect(docs).toContain('admin-route-gate');
    expect(docs).toContain('Page authorization is not API authorization');
    expect(docs).toContain('WS13-T002');
  });

  it('admin APIs have their own canonical server-side authorization boundary', () => {
    expect(existsSync(resolve(WEB, 'src/app/api/admin'))).toBe(true);
    const apiAuthorization = readWeb('src/lib/security/admin-api-authorization.ts');
    expect(apiAuthorization).toContain('resolveGlobalAdminAuthorization');
    expect(apiAuthorization).toContain('createClient');
    expect(apiAuthorization).not.toContain('createServiceClient');
  });
});

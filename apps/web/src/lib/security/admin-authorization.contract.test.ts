import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const WEB = resolve(process.cwd());
const REPO = resolve(process.cwd(), '../..');

function readWeb(rel: string) {
  return readFileSync(resolve(WEB, rel), 'utf8');
}

function readRepo(rel: string) {
  return readFileSync(resolve(REPO, rel), 'utf8');
}

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue;
      walkTsFiles(full, out);
    } else if (/\.(tsx?)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('WS13-T001 admin authorization contracts', () => {
  const resolver = readWeb('src/lib/security/admin-authorization.ts');
  const adminPage = readWeb('src/app/admin/page.tsx');
  const docs = readRepo('docs/ADMIN_AUTHORIZATION.md');
  const env = readWeb('src/lib/security/env.ts');

  it('20. resolver is server-only and not imported by client components', () => {
    expect(resolver).toContain("import 'server-only'");
    expect(resolver).toContain('resolveGlobalAdminAuthorization');
    expect(resolver).toContain('GLOBAL_ADMIN_APP_METADATA_ROLE');

    const componentsDir = resolve(WEB, 'src/components');
    const clientImporters: string[] = [];
    for (const file of walkTsFiles(componentsDir)) {
      const src = readFileSync(file, 'utf8');
      if (src.includes('admin-authorization') || src.includes('resolveGlobalAdminAuthorization')) {
        clientImporters.push(file);
      }
    }
    expect(clientImporters).toEqual([]);

    // Pages never call the resolver directly — enforcement goes through the
    // single WS11-T002 gate wrapper (admin-route-gate).
    expect(adminPage).not.toContain('resolveGlobalAdminAuthorization');
    expect(adminPage).not.toContain('admin-authorization');
  });

  it('documents Policy A (no env allowlist) and rejects user_metadata / tenant_role', () => {
    expect(docs).toContain('Policy A');
    expect(docs).toMatch(/user_metadata/i);
    expect(docs).toContain("app_metadata.role === \"admin\"");
    expect(docs).toMatch(/tenant_role/i);
    expect(docs).toContain('T001 itself did **not** secure `/admin`');
    expect(docs).toContain('WS11-T002');
    expect(docs).toContain('WS13-T002');

    expect(env).not.toMatch(/ADMIN_EMAIL/);
    expect(resolver).not.toMatch(/process\.env\.ADMIN/);
    expect(resolver).not.toMatch(/NEXT_PUBLIC_ADMIN/);
    // Executable path never reads untrusted metadata or tenant roles.
    expect(resolver).not.toMatch(/identity\.(user_metadata|userMetadata|tenant_role|tenantRole)/);
    expect(resolver).not.toMatch(/process\.env/);
  });

  it('keeps a single canonical resolver (no competing helpers)', () => {
    expect(resolver).toContain('export function resolveGlobalAdminAuthorization');
    expect(resolver).not.toMatch(/export function requireAdmin/);
    expect(resolver).not.toMatch(/export function checkAdmin/);
    expect(resolver).not.toMatch(/export function adminGuard/);
  });
});

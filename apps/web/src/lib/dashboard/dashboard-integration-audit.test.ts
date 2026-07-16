import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readRepo(rel: string) {
  return readFileSync(resolve(process.cwd(), '../..', rel), 'utf8');
}

function readWeb(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS09-T001 dashboard demo inventory', () => {
  it('documents dashboard surfaces and marks Circle/Connections out of scope', () => {
    const auditPath = resolve(process.cwd(), '../../docs/DASHBOARD_INTEGRATION_AUDIT.md');
    expect(existsSync(auditPath)).toBe(true);

    const audit = readRepo('docs/DASHBOARD_INTEGRATION_AUDIT.md');

    for (const label of [
      'Home',
      'Profile',
      'Projects',
      'Research',
      'Circle',
      'Analytics',
      'Connections',
      'Settings',
    ]) {
      expect(audit).toContain(label);
    }

    expect(audit).toContain('/dashboard/circle');
    expect(audit).toContain('/dashboard/connections');
    expect(audit).toContain('Out of MVP scope');
    expect(audit).toContain('loadOwnerAnalytics');
    expect(audit).toContain('/dashboard/preview');
    expect(audit).not.toMatch(/service_role|sk_live|eyJhbGci/i);

    for (const rel of [
      'src/app/dashboard/(authenticated)/page.tsx',
      'src/app/dashboard/(authenticated)/projects/page.tsx',
      'src/app/dashboard/(authenticated)/research/page.tsx',
      'src/app/dashboard/(authenticated)/analytics/page.tsx',
      'src/app/dashboard/(authenticated)/circle/page.tsx',
      'src/app/dashboard/(authenticated)/connections/page.tsx',
      'src/app/dashboard/(authenticated)/settings/page.tsx',
      'src/app/dashboard/(authenticated)/billing/page.tsx',
    ]) {
      expect(existsSync(resolve(process.cwd(), rel))).toBe(true);
    }
  });
});

describe('WS09-T002 truthful MVP dashboard navigation', () => {
  it('removes Circle and Connections from active NAV_ITEMS', () => {
    const shell = readWeb('src/components/dashboard/dashboard-shell.tsx');
    const audit = readRepo('docs/DASHBOARD_INTEGRATION_AUDIT.md');

    const navMatch = shell.match(/const NAV_ITEMS = \[([\s\S]*?)\] as const/);
    expect(navMatch).toBeTruthy();
    const navBlock = navMatch![1];

    expect(navBlock).toContain("label: 'Home'");
    expect(navBlock).toContain("label: 'Profile'");
    expect(navBlock).toContain("label: 'Projects'");
    expect(navBlock).toContain("label: 'Research'");
    expect(navBlock).toContain("label: 'Analytics'");
    expect(navBlock).toContain("label: 'Settings'");
    expect(navBlock).not.toContain("label: 'Circle'");
    expect(navBlock).not.toContain("label: 'Connections'");
    expect(navBlock).not.toContain("segment: 'circle'");
    expect(navBlock).not.toContain("segment: 'connections'");

    // Preview routes remain available intentionally.
    expect(existsSync(resolve(process.cwd(), 'src/app/dashboard/preview/circle/page.tsx'))).toBe(
      true,
    );
    expect(
      existsSync(resolve(process.cwd(), 'src/app/dashboard/preview/connections/page.tsx')),
    ).toBe(true);

    expect(audit).toContain('Removed** from active MVP navigation');
  });
});

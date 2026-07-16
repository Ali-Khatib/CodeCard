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
  it('documents every NAV_ITEMS surface and marks Circle/Connections out of scope', () => {
    const auditPath = resolve(process.cwd(), '../../docs/DASHBOARD_INTEGRATION_AUDIT.md');
    expect(existsSync(auditPath)).toBe(true);

    const audit = readRepo('docs/DASHBOARD_INTEGRATION_AUDIT.md');
    const shell = readWeb('src/components/dashboard/dashboard-shell.tsx');

    const navMatch = shell.match(/const NAV_ITEMS = \[([\s\S]*?)\] as const/);
    expect(navMatch).toBeTruthy();
    const navBlock = navMatch![1];

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
      expect(navBlock).toContain(`label: '${label}'`);
      expect(audit).toContain(label);
    }

    expect(audit).toContain('/dashboard/circle');
    expect(audit).toContain('/dashboard/connections');
    expect(audit).toContain('Out of MVP scope');
    expect(audit).toContain('loadOwnerAnalytics');
    expect(audit).toContain('/dashboard/preview');
    expect(audit).not.toMatch(/service_role|sk_live|eyJhbGci/i);

    // Documented authenticated routes exist.
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

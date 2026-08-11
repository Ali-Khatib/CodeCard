import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('dashboard notifications', () => {
  it('keeps demo notification copy out of real authenticated dashboards', () => {
    const component = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-notifications.tsx'),
      'utf8',
    );
    const demo = readFileSync(
      resolve(process.cwd(), 'src/lib/dashboard/notifications-demo.ts'),
      'utf8',
    );

    expect(demo).toContain('Jordan Lee');
    expect(component).toContain('DEMO_NOTIFICATIONS');
    expect(component).toContain("basePath === '/demo'");
    expect(component).toContain("basePath === '/dashboard/preview'");
    expect(component).toContain('demoMode ? DEMO_NOTIFICATIONS : []');
    expect(component).toContain('You’re all caught up');
  });
});

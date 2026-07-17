import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS09-T010 optimistic dashboard navigation', () => {
  it('preserves pendingHref optimistic feedback after real-route integration', () => {
    const shell = read('src/components/dashboard/dashboard-shell.tsx');

    expect(shell).toContain('const [pendingHref, setPendingHref] = useState');
    expect(shell).toContain('setPendingHref(null)');
    expect(shell).toContain('markPending');
    expect(shell).toContain('if (href !== pathname) setPendingHref(href)');
    expect(shell).toContain('cc-app-nav-link--pending');
    expect(shell).toContain('cc-app-mobile-nav__link--pending');
    expect(shell).toContain('cc-app-root--route-pending');
    expect(shell).toContain('cc-app-route-progress');
    expect(shell).toContain('role="status"');
    expect(shell).toContain('aria-live="polite"');
    expect(shell).toContain('Loading next view');
    expect(shell).toContain('aria-busy={pending}');
    expect(shell).toContain("aria-current={active ? 'page' : undefined}");
    expect(shell).toContain('window.setTimeout(() => setPendingHref(null), 5000)');
    expect(shell).toContain('}, [pathname]');

    // Must not inject demo analytics/overview placeholders during pending transitions.
    expect(shell).not.toContain('buildAnalyticsData');
    expect(shell).not.toContain('PreviewAnalyticsView');
    expect(shell).not.toContain('1284');
  });

  it('wires pending handlers on every real MVP nav item', () => {
    const shell = read('src/components/dashboard/dashboard-shell.tsx');

    expect(shell).toContain("label: 'Home'");
    expect(shell).toContain("label: 'Profile'");
    expect(shell).toContain("label: 'Projects'");
    expect(shell).toContain("label: 'Research'");
    expect(shell).toContain("label: 'Analytics'");
    expect(shell).toContain("label: 'Settings'");
    expect(shell).toContain("label: 'Connections'");
    expect(shell).not.toContain("label: 'Circle'");

    const pendingClicks = shell.match(/onClick=\{\(\) => markPending\(href\)\}/g) ?? [];
    expect(pendingClicks.length).toBeGreaterThanOrEqual(2);
  });
});

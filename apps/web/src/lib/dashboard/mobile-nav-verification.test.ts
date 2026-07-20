import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS09-T011 mobile dashboard navigation', () => {
  it('keeps every real MVP tab in a horizontally scrollable mobile nav', () => {
    const shell = read('src/components/dashboard/dashboard-shell.tsx');
    const css = read('src/styles/codecard-app-system.css');

    expect(shell).toContain('cc-app-mobile-nav md:hidden');
    expect(shell).toContain('aria-label="Mobile"');
    expect(shell).toContain("label: 'Home'");
    expect(shell).not.toContain("label: 'Profile'");
    expect(shell).not.toContain("label: 'My profile'");
    expect(shell).toContain("label: 'Projects'");
    expect(shell).toContain("label: 'Research'");
    expect(shell).toContain("label: 'Analytics'");
    expect(shell).toContain("label: 'Settings'");
    expect(shell).toContain("label: 'Connections'");
    expect(shell).toContain("label: 'Circle'");
    expect(shell).toContain("aria-current={active ? 'page' : undefined}");
    expect(shell).toContain("querySelector('.cc-app-mobile-nav a[aria-current=\"page\"]')");
    expect(shell).toContain('scrollIntoView');
    expect(shell).toContain("matchMedia('(prefers-reduced-motion: reduce)')");

    expect(css).toContain('.cc-app-mobile-nav');
    expect(css).toContain('overflow-x: auto');
    expect(css).toContain('overscroll-behavior-x: contain');
    expect(css).toContain('-webkit-overflow-scrolling: touch');
    expect(css).toContain('scroll-snap-type: x proximity');
    expect(css).toContain('min-height: 44px');
    expect(css).toContain('white-space: nowrap');
    expect(css).toContain('min-width: 68px');
    expect(css).toContain('flex: 0 0 auto');
  });

  it('does not claim Billing is a primary mobile tab while Settings remains the entry', () => {
    const shell = read('src/components/dashboard/dashboard-shell.tsx');
    const navBlock = shell.slice(
      shell.indexOf('const NAV_ITEMS'),
      shell.indexOf('] as const;') + '] as const;'.length,
    );
    expect(navBlock).not.toContain("label: 'Billing'");
    expect(shell).toContain("billing: 'Billing'");
  });
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS09-T011 mobile dashboard navigation', () => {
  it('keeps every real MVP tab in a mobile nav that fits without side scrolling', () => {
    const shell = read('src/components/dashboard/dashboard-shell.tsx');
    const css = read('src/styles/codecard-app-system.css');

    expect(shell).toContain('cc-app-mobile-nav md:hidden');
    expect(shell).toContain('aria-label="Mobile"');
    expect(shell).toContain("label: 'Home'");
    expect(shell).toContain("label: 'Profile'");
    expect(shell).toContain("label: 'Projects'");
    expect(shell).toContain("label: 'Research'");
    expect(shell).toContain("label: 'Analytics'");
    expect(shell).toContain("label: 'Settings'");
    expect(shell).toContain("label: 'Connections'");
    expect(shell).toContain("label: 'Circle'");
    expect(shell).toContain("aria-current={active ? 'page' : undefined}");
    expect(shell).toContain("querySelector('.cc-app-mobile-nav')");
    expect(shell).toContain("querySelector('a[aria-current=\"page\"]')");
    // Prefer scrolling the nav scroller (not link.scrollIntoView) so the skip
    // link stays the first sequential focus target after route changes.
    expect(shell).toContain('nav.scrollTo');
    expect(shell).not.toContain('active.scrollIntoView');
    expect(shell).toContain("matchMedia('(prefers-reduced-motion: reduce)')");

    expect(css).toContain('.cc-app-mobile-nav');
    expect(css).toContain('overflow-x: hidden');
    expect(css).toContain('min-height: 44px');
    expect(css).toContain('white-space: nowrap');
    expect(css).toContain('min-width: 0');
    expect(css).toContain('flex: 1 1 0');
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

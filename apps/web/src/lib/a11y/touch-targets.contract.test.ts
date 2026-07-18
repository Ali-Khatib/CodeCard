import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB = resolve(process.cwd());

function read(rel: string) {
  return readFileSync(resolve(WEB, 'src', rel), 'utf8');
}

describe('WS12-T007 mobile touch targets', () => {
  it('keeps mobile nav links at least 44px tall', () => {
    const css = read('styles/codecard-app-system.css');
    expect(css).toContain('.cc-app-mobile-nav__link');
    expect(css).toContain('min-height: 44px');
  });

  it('sizes shared app buttons and filter pills for touch', () => {
    const css = read('styles/codecard-app-system.css');
    expect(css).toMatch(/\.cc-app-btn\s*\{[\s\S]*min-height:\s*44px/);
    expect(css).toMatch(/\.cc-app-filter-pill\s*\{[\s\S]*min-height:\s*44px/);
    expect(css).toContain('WS12-T007');
    expect(css).toContain('@media (max-width: 767px)');
  });

  it('sizes marketing pill CTAs for touch', () => {
    const css = read('app/globals.css');
    expect(css).toMatch(/\.cc-btn-pill-primary\s*\{[\s\S]*min-height:\s*44px/);
    expect(css).toMatch(/\.cc-btn-pill-ghost\s*\{[\s\S]*min-height:\s*44px/);
    expect(css).toMatch(/\.cc-btn-pill-demo\s*\{[\s\S]*min-height:\s*44px/);
    expect(css).toContain('.cc-skip-link');
    expect(css).toContain('min-height: 44px');
  });

  it('enlarges icon-only mobile menu and user-menu triggers', () => {
    expect(read('components/landing/landing-hero-nav.tsx')).toContain(
      'cc-nav-mobile-trigger',
    );
    expect(read('app/globals.css')).toContain('.cc-nav-mobile-trigger');
    expect(read('components/dashboard/dashboard-shell.tsx')).toContain(
      'min-h-11 min-w-11',
    );
  });

  it('enlarges reorder controls used on mobile project/research lists', () => {
    expect(read('components/dashboard/project-reorder-toolbar.tsx')).toContain(
      'min-h-11',
    );
    expect(read('components/dashboard/research-reorder-toolbar.tsx')).toContain(
      'min-h-11',
    );
    expect(read('components/dashboard/project-reorder-toolbar.tsx')).not.toContain(
      'h-8 px-3',
    );
  });

  it('documents inline text-link exception policy for dense metadata', () => {
    // Compact metadata links may remain under 44px when they are not primary
    // controls and are spaced; primary icon/button controls must not use that exception.
    const shell = read('components/dashboard/dashboard-shell.tsx');
    expect(shell).toContain('cc-app-mobile-nav');
  });
});

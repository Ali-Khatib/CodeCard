import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB = resolve(process.cwd());

function read(rel: string) {
  return readFileSync(resolve(WEB, 'src', rel), 'utf8');
}

describe('WS12-T004 focus visibility contracts', () => {
  it('defines a shared focus-visible CSS contract', () => {
    const css = read('app/globals.css');
    expect(css).toContain('--cc-focus-ring');
    expect(css).toContain('a:focus-visible');
    expect(css).toContain('button:focus-visible');
    expect(css).toContain('scroll-margin-top');
    expect(css).toContain('scroll-margin-bottom');
    expect(css).toContain('.cc-btn-pill-primary:focus-visible');
  });

  it('gives shared app buttons and filters a focus-visible ring', () => {
    const css = read('styles/codecard-app-system.css');
    expect(css).toContain('.cc-app-btn:focus-visible');
    expect(css).toContain('.cc-app-filter-pill:focus-visible');
    expect(css).toContain('.cc-app-input:focus-visible');
    expect(css).toContain('.cc-app-mobile-nav__link:focus-visible');
  });

  it('does not suppress dash-input focus without a replacement', () => {
    const css = read('styles/dashboard-ember.css');
    expect(css).toContain('.cc-dash-input:focus');
    expect(css).toContain('.cc-dash-input:focus-visible');
    const focusBlock = css.slice(css.indexOf('.cc-dash-input:focus'));
    const block = focusBlock.slice(0, focusBlock.indexOf('}') + 1);
    expect(block).not.toContain('outline: none');
  });

  it('skip link remains visibly focused', () => {
    const css = read('app/globals.css');
    expect(css).toMatch(/\.cc-skip-link:focus[\s\S]*left: 1rem/);
  });

  it('product source avoids undocumented positive tabIndex', () => {
    const shells = [
      'components/dashboard/dashboard-shell.tsx',
      'components/landing/app-shell.tsx',
      'components/auth/auth-shell.tsx',
      'components/admin/moderation-dashboard.tsx',
    ];
    for (const file of shells) {
      expect(read(file)).not.toMatch(/tabIndex=\{[1-9]/);
    }
  });
});

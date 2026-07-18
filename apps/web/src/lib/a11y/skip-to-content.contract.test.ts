import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MAIN_CONTENT_HREF, MAIN_CONTENT_ID } from './main-content';

const WEB = resolve(process.cwd());
const REPO = resolve(process.cwd(), '../..');

function read(rel: string) {
  return readFileSync(resolve(WEB, 'src', rel), 'utf8');
}

function readRepo(rel: string) {
  return readFileSync(resolve(REPO, rel), 'utf8');
}

const SHELLS_WITH_MAIN_TARGET = [
  'components/landing/app-shell.tsx',
  'components/legal-page.tsx',
  'components/dashboard/dashboard-shell.tsx',
  'components/auth/auth-shell.tsx',
  'components/profile/public-profile-focused.tsx',
  'components/featured-work/project-detail-view.tsx',
  'components/research/research-paper-detail.tsx',
  'components/public/public-not-found-view.tsx',
  'components/admin/moderation-dashboard.tsx',
  'app/admin/page.tsx',
  'app/admin/loading.tsx',
  'app/forbidden.tsx',
  'components/e2e/public-report-harness.tsx',
  'components/e2e/circle-harness.tsx',
  'components/e2e/connections-harness.tsx',
  'components/e2e/settings-account-harness.tsx',
  'components/e2e/upload-progress-harness.tsx',
  'components/e2e/xss-public-harness.tsx',
];

describe('WS12-T001 skip-to-content contracts', () => {
  it('exposes a stable main-content target id', () => {
    expect(MAIN_CONTENT_ID).toBe('main-content');
    expect(MAIN_CONTENT_HREF).toBe('#main-content');
  });

  it('places the skip link first in the root document body', () => {
    const layout = read('app/layout.tsx');
    const skip = read('components/a11y/skip-to-content.tsx');
    expect(skip).toContain('Skip to main content');
    expect(skip).toContain('MAIN_CONTENT_HREF');
    expect(skip).toContain('cc-skip-link');
    expect(layout).toContain("import { SkipToContentLink } from '@/components/a11y/skip-to-content'");
    const bodyOpen = layout.indexOf('<body');
    const skipUse = layout.indexOf('<SkipToContentLink');
    const backdrop = layout.indexOf('<GlobalBackdrop');
    expect(bodyOpen).toBeGreaterThanOrEqual(0);
    expect(skipUse).toBeGreaterThan(bodyOpen);
    expect(backdrop).toBeGreaterThan(skipUse);
  });

  it('keeps skip-link styles visually hidden until focused', () => {
    const css = read('app/globals.css');
    expect(css).toContain('.cc-skip-link');
    expect(css).toContain('left: -10000px');
    expect(css).toMatch(/\.cc-skip-link:focus[\s\S]*left: 1rem/);
    expect(css).toContain('#main-content');
    expect(css).toContain('scroll-margin-top');
    expect(css).toContain('z-index: 10000');
  });

  it('gives every primary shell a unique main-content landmark target', () => {
    for (const path of SHELLS_WITH_MAIN_TARGET) {
      const source = read(path);
      expect(source).toMatch(/id=\{?MAIN_CONTENT_ID\}?|id=["']main-content["']/);
      expect(source).toMatch(/tabIndex=\{-1\}/);
      expect(source).toContain('<main');
    }
  });

  it('does not nest a second main inside the marketing AppShell references page', () => {
    const references = readRepo(
      'apps/web/src/app/(marketing)/research/references/page.tsx',
    );
    expect(references).not.toContain('<main');
  });

  it('dashboard content region is a main landmark', () => {
    const shell = read('components/dashboard/dashboard-shell.tsx');
    expect(shell).toContain('<main id={MAIN_CONTENT_ID}');
    expect(shell).toContain('cc-app-content');
    expect(shell).not.toMatch(/<div className="cc-app-content">/);
  });

  it('avoids positive tabIndex in skip-link and main targets', () => {
    const skip = read('components/a11y/skip-to-content.tsx');
    expect(skip).not.toMatch(/tabIndex=\{[1-9]/);
    for (const path of SHELLS_WITH_MAIN_TARGET) {
      expect(read(path)).not.toMatch(/tabIndex=\{[1-9]/);
    }
  });
});

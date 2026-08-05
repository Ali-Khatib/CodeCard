import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('Phase 0D public critical-path isolation', () => {
  it('keeps marketing free of ContentOpeningProvider mount and dashboard-only session prompts', () => {
    const marketing = read('src/app/(marketing)/layout.tsx');
    expect(marketing).not.toMatch(/import\s*\{[^}]*ContentOpeningProvider/);
    expect(marketing).not.toMatch(/<ContentOpeningProvider/);
    expect(marketing).toContain('DeferredVisitorConversionPrompt');
    expect(marketing).toContain('SmoothScrollProvider');
    expect(marketing).toContain('ProjectOpenProvider');
  });

  it('keeps /demo free of ContentOpeningProvider mount on the profile LCP route', () => {
    const demo = read('src/app/demo/layout.tsx');
    expect(demo).not.toMatch(/import\s*\{[^}]*ContentOpeningProvider/);
    expect(demo).not.toMatch(/<ContentOpeningProvider/);
    expect(demo).toContain('DeferredVisitorConversionPrompt');
    expect(demo).toContain('codecard-app-system.css');
    expect(read('src/app/demo/projects/layout.tsx')).toContain('ContentOpeningProvider');
    expect(read('src/app/demo/research/layout.tsx')).toContain('ContentOpeningProvider');
  });

  it('does not import app-system CSS from root globals', () => {
    const globals = read('src/app/globals.css');
    expect(globals).not.toMatch(/@import\s+['"].*codecard-app-system/);
  });

  it('defers Lenis/GSAP and project-open motion underlays', () => {
    const smooth = read('src/components/motion/smooth-scroll-provider.tsx');
    expect(smooth).toContain("import('lenis/react')");
    expect(smooth).not.toMatch(/^import \{ ReactLenis/m);

    const projectOpen = read('src/components/featured-work/project-open-overlay.tsx');
    expect(projectOpen).toContain("import('./project-open-underlay')");
    expect(projectOpen).not.toContain("from 'motion/react'");
    expect(projectOpen).not.toMatch(/from ['"]\.\/project-detail-view['"]/);
  });
});

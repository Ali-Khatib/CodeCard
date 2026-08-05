import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('Phase 0D public critical-path isolation', () => {
  it('keeps marketing free of dashboard-only session prompts and uses deferred conversion', () => {
    const marketing = read('src/app/(marketing)/layout.tsx');
    expect(marketing).toContain('ContentOpeningProvider');
    expect(marketing).toContain('DeferredVisitorConversionPrompt');
    expect(marketing).toContain('SmoothScrollProvider');
    expect(marketing).toContain('ProjectOpenProvider');
  });

  it('hosts ContentOpening on /demo/card via DemoInteractionsHost for project/research openings', () => {
    const card = read('src/app/demo/card/layout.tsx');
    const demo = read('src/app/demo/layout.tsx');
    expect(card).toContain('DemoInteractionsHost');
    expect(demo).toContain('DeferredVisitorConversionPrompt');
    expect(demo).toContain('codecard-app-system.css');
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

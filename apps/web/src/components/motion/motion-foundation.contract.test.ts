import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MOTION_DURATION,
  MOTION_LIMITS,
  MOTION_PATTERNS,
} from '@/components/motion/motion-tokens';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('Phase 0B motion foundation', () => {
  it('ships motion tokens with ownership rules', () => {
    expect(MOTION_DURATION.section).toBeGreaterThan(0);
    expect(MOTION_LIMITS.revealY).toBeLessThanOrEqual(40);
    expect(MOTION_PATTERNS['reveal-soft']).toBe('gsap');
    expect(MOTION_PATTERNS['button-press']).toBe('css');
    expect(MOTION_PATTERNS['route-opening']).toBe('motion');
  });

  it('registers GSAP once and exposes ScrollTrigger lifecycle helpers', () => {
    const runtime = read('src/components/motion/gsap-runtime.ts');
    expect(runtime).toContain('gsap.registerPlugin(ScrollTrigger)');
    expect(runtime).toContain('killAllScrollTriggers');
    expect(runtime).toContain('ScrollTrigger.refresh');
    expect(runtime).toContain("NEXT_PUBLIC_GSAP_MARKERS === '1'");
    expect(runtime).toContain("process.env.NODE_ENV === 'development'");
  });

  it('scopes Lenis to marketing and respects reduced motion', () => {
    const provider = read('src/components/motion/smooth-scroll-provider.tsx');
    const marketing = read('src/app/(marketing)/layout.tsx');
    const dashboard = read('src/app/dashboard/layout.tsx');

    expect(marketing).toContain('SmoothScrollProvider');
    expect(marketing).toContain('MotionPreferencesProvider');
    expect(dashboard).not.toContain('SmoothScrollProvider');
    expect(provider).toContain('canEnhanceMotion');
    expect(provider).toContain("import('lenis/react')");
    expect(provider).toContain("import('@/components/motion/gsap-runtime')");
    expect(provider).toContain('ReactLenis');
    expect(provider).toContain('ScrollTrigger.update');
    expect(provider).toContain('visibilitychange');
    expect(provider).toContain('gsap.ticker.remove');
    expect(provider).not.toContain('killAllScrollTriggers');
    expect(provider).not.toMatch(/ScrollTrigger\.getAll\s*\(\s*\)/);
    expect(provider).not.toContain('ScrollSmoother');
    // No static top-level Lenis/GSAP runtime imports in the critical chunk.
    expect(provider).not.toMatch(/^import \{[^}]*ReactLenis/m);
    expect(provider).not.toMatch(/^import \{[^}]*ensureGsapPlugins/m);
  });

  it('keeps killAllScrollTriggers as a deprecated diagnostic helper only', () => {
    const runtime = read('src/components/motion/gsap-runtime.ts');
    expect(runtime).toContain('@deprecated');
    expect(runtime).toContain('killAllScrollTriggers');
    expect(runtime).toContain('getScrollTriggerCount');
  });

  it('uses @gsap/react for the integration proof with transform/opacity only', () => {
    const proof = read('src/components/motion/section-reveal-proof.tsx');
    const product = read('src/components/landing/product-page.tsx');
    expect(proof).toContain("from '@gsap/react'");
    expect(proof).toContain('useGSAP');
    expect(proof).toContain('immediateRender: false');
    expect(proof).toContain("data-motion-pattern=\"reveal-soft\"");
    expect(proof).not.toContain('pin:');
    expect(proof).not.toContain('scrub:');
    expect(product).toContain('MotionSectionRevealProof');
    expect(product).toContain('research-support');
  });

  it('keeps content visible without waiting for animation init', () => {
    const proof = read('src/components/motion/section-reveal-proof.tsx');
    expect(proof).toContain('immediateRender: false');
    expect(proof).toContain('y: MOTION_LIMITS.revealY');
    expect(proof).not.toMatch(/\bopacity\s*:/);
  });

  it('exposes scroll-trigger refresh after fonts/images/routes', () => {
    expect(existsSync(resolve(process.cwd(), 'src/hooks/use-scroll-trigger-refresh.ts'))).toBe(
      true,
    );
    const hook = read('src/hooks/use-scroll-trigger-refresh.ts');
    expect(hook).toContain('document.fonts.ready');
    expect(hook).toContain('usePathname');
    expect(hook).toContain('refreshScrollTrigger');
  });
});

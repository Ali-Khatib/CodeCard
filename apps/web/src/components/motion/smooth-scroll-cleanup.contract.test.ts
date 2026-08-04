import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

/**
 * Source-level proof that marketing smooth-scroll cleanup is scoped.
 * Runtime ScrollTrigger ownership is asserted in e2e/motion-foundation.spec.ts.
 */
describe('SmoothScrollProvider scoped cleanup', () => {
  it('unmount removes ticker and Lenis listeners without global kill', () => {
    const provider = read('src/components/motion/smooth-scroll-provider.tsx');

    expect(provider).toContain("lenis.on('scroll', onScroll)");
    expect(provider).toContain("attachedLenis?.off('scroll', onScroll)");
    expect(provider).toContain('gsap.ticker.add(tick)');
    expect(provider).toContain('gsap.ticker.remove(tick)');
    expect(provider).toContain('tickerAttachedRef');

    expect(provider).not.toMatch(/killAllScrollTriggers\s*\(/);
    expect(provider).not.toMatch(/ScrollTrigger\.getAll\s*\(\s*\)/);
    expect(provider).not.toMatch(/globalTimeline\.clear/);
    expect(provider).not.toMatch(/killTweensOf\s*\(\s*['"]\*['"]\s*\)/);
  });

  it('section reveal owns its trigger via useGSAP context revert', () => {
    const proof = read('src/components/motion/section-reveal-proof.tsx');
    expect(proof).toContain('useGSAP');
    expect(proof).toContain('revertOnUpdate: true');
    expect(proof).toContain('scope: ref');
    expect(proof).not.toContain('killAllScrollTriggers');
  });
});

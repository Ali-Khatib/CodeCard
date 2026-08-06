import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (path: string) => readFileSync(resolve(WEB, path), 'utf8');

describe('Phase 2 cinematic landing contract', () => {
  it('wires cinematic scenes only into the marketing ProductPage', () => {
    const page = read('src/components/landing/product-page.tsx');
    expect(page).toContain('ScatteredWorkScene');
    expect(page).toContain('ProductShowcaseScene');
    expect(page).toContain("import('@/components/cinematic/scattered-work-scene')");
    expect(page).toContain("import('@/components/cinematic/product-showcase-scene')");
    expect(page).toContain("import '@/styles/cinematic-landing.css'");

    expect(read('src/app/demo/(workspace)/layout.tsx')).not.toContain('cinematic');
    expect(read('src/app/demo/card/layout.tsx')).not.toContain('cinematic');
    expect(read('src/app/dashboard/layout.tsx')).not.toContain('ScatteredWorkScene');
  });

  it('keeps hero LCP rules: server headline, deferred scroll cue, no opacity-0 headline', () => {
    const hero = read('src/components/landing/product-hero.tsx');
    expect(hero).toContain('data-hero-statement');
    expect(hero).toContain('cc-hume-hero__headline');
    expect(hero).toContain('HeroScrollCue');
    expect(hero).not.toContain('opacity-0');
    expect(hero).toContain("from '@/components/cinematic/hero-scroll-cue'");
  });

  it('owns scene files and responsive hook', () => {
    expect(existsSync(resolve(WEB, 'src/components/cinematic/scattered-work-scene.tsx'))).toBe(
      true,
    );
    expect(existsSync(resolve(WEB, 'src/components/cinematic/product-showcase-scene.tsx'))).toBe(
      true,
    );
    expect(existsSync(resolve(WEB, 'src/components/cinematic/cinematic-progress.tsx'))).toBe(true);
    expect(existsSync(resolve(WEB, 'src/hooks/use-responsive-scroll-scene.ts'))).toBe(true);

    const scattered = read('src/components/cinematic/scattered-work-scene.tsx');
    const showcase = read('src/components/cinematic/product-showcase-scene.tsx');
    expect(scattered).toContain('useGSAP');
    expect(showcase).toContain('useGSAP');
    expect(scattered).toContain('cinematic-scattered-pin');
    expect(showcase).toContain('cinematic-showcase-pin');
    expect(scattered).toContain("start: PIN_START");
    expect(showcase).toContain("start: PIN_START");
    expect(showcase).toContain('resolveStage');
    expect(scattered).toContain('invalidateOnRefresh');
    expect(showcase).toContain('invalidateOnRefresh');
    expect(scattered).not.toContain('killAllScrollTriggers');
    expect(showcase).not.toContain('killAllScrollTriggers');
  });

  it('keeps final CTA destinations correct', () => {
    const closing = read('src/components/landing/build-yours-section.tsx');
    expect(closing).toContain('MorphSignupCta');
    expect(closing).toContain('LiveDemoLink');
    expect(closing).toContain('LIVE_DEMO_HREF');
    expect(closing).toContain('closing-profile-preview-link');
  });

  it('limits pinned triggers to the two major scenes', () => {
    const scattered = read('src/components/cinematic/scattered-work-scene.tsx');
    const showcase = read('src/components/cinematic/product-showcase-scene.tsx');
    const pinScattered = (scattered.match(/pin:\s*true/g) ?? []).length;
    const pinShowcase = (showcase.match(/pin:\s*true/g) ?? []).length;
    expect(pinScattered).toBe(1);
    expect(pinShowcase).toBe(1);
  });
});

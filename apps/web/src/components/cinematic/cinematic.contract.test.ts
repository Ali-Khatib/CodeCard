import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (path: string) => readFileSync(resolve(WEB, path), 'utf8');

describe('Identity cinematic landing contract', () => {
  it('wires identity landing only into the marketing ProductPage', () => {
    const page = read('src/components/landing/product-page.tsx');
    expect(page).toContain('IdentityLanding');
    expect(page).toContain("from './identity/identity-landing'");
    expect(page).not.toContain('ScatteredWorkScene');
    expect(page).not.toContain('ProductShowcaseScene');
    expect(page).not.toContain('ResearchProvider');

    expect(read('src/app/demo/(workspace)/layout.tsx')).not.toContain('identity-landing');
    expect(read('src/app/demo/card/layout.tsx')).not.toContain('identity-landing');
    expect(read('src/app/dashboard/layout.tsx')).not.toContain('IdentityLanding');
  });

  it('keeps hero LCP rules: server headline, no opacity-0 headline', () => {
    const hero = read('src/components/landing/identity/identity-hero.tsx');
    expect(hero).toContain('data-hero-statement');
    expect(hero).toContain('YOUR WORK.');
    expect(hero).not.toContain('opacity-0');
    expect(hero).not.toContain("'use client'");
  });

  it('owns identity scene files and responsive hook', () => {
    expect(existsSync(resolve(WEB, 'src/components/landing/identity/identity-assembly.tsx'))).toBe(
      true,
    );
    expect(existsSync(resolve(WEB, 'src/components/landing/identity/identity-inspect.tsx'))).toBe(
      true,
    );
    expect(existsSync(resolve(WEB, 'src/styles/cinematic-identity.css'))).toBe(true);
    expect(existsSync(resolve(WEB, 'src/hooks/use-responsive-scroll-scene.ts'))).toBe(true);

    const assembly = read('src/components/landing/identity/identity-assembly.tsx');
    const inspect = read('src/components/landing/identity/identity-inspect.tsx');
    expect(assembly).toContain('useGSAP');
    expect(inspect).toContain('useGSAP');
    expect(assembly).toContain('identity-assembly-pin');
    expect(inspect).toContain('identity-inspect-pin');
    expect(assembly).toContain("start: PIN_START");
    expect(inspect).toContain("start: PIN_START");
    expect(assembly).toContain('invalidateOnRefresh');
    expect(inspect).toContain('invalidateOnRefresh');
    expect(assembly).not.toContain('killAllScrollTriggers');
    expect(inspect).not.toContain('killAllScrollTriggers');
  });

  it('keeps final CTA destinations correct', () => {
    const closing = read('src/components/landing/identity/identity-finale.tsx');
    expect(closing).toContain('MagneticCta');
    expect(closing).toContain('LiveDemoLink');
    expect(closing).toContain('LIVE_DEMO_PROFILE_HREF');
    expect(closing).toContain('closing-profile-preview-link');
    expect(closing).toContain('id="build-yours"');
  });

  it('limits pinned triggers to the two major scenes', () => {
    const assembly = read('src/components/landing/identity/identity-assembly.tsx');
    const inspect = read('src/components/landing/identity/identity-inspect.tsx');
    const pinAssembly = (assembly.match(/pin:\s*true/g) ?? []).length;
    const pinInspect = (inspect.match(/pin:\s*true/g) ?? []).length;
    expect(pinAssembly).toBe(1);
    expect(pinInspect).toBe(1);
  });
});

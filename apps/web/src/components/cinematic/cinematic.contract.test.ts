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

  it('keeps hero LCP rules: server headline, pitch title, no opacity-0 headline', () => {
    const hero = read('src/components/landing/identity/identity-hero.tsx');
    expect(hero).toContain('data-hero-statement');
    expect(hero).toContain('Your best work.');
    expect(hero).toContain('Ready to share in seconds.');
    expect(hero).not.toContain('opacity-0');
    expect(hero).not.toContain("'use client'");
  });

  it('owns assembly + how-it-works + five audience cards; no inspect toy section', () => {
    const landing = read('src/components/landing/identity/identity-landing.tsx');
    expect(landing).toContain('IdentityAssembly');
    expect(landing).toContain('HowItWorksSection');
    expect(landing).toContain('AudienceBounceCards');
    expect(landing).not.toContain('IdentityInspect');
    expect(existsSync(resolve(WEB, 'src/components/landing/identity/identity-inspect.tsx'))).toBe(
      false,
    );
    expect(existsSync(resolve(WEB, 'src/components/landing/audience-bounce-cards.tsx'))).toBe(true);
    expect(existsSync(resolve(WEB, 'src/components/landing/how-it-works-page.tsx'))).toBe(true);
    expect(existsSync(resolve(WEB, 'src/styles/cinematic-identity.css'))).toBe(true);

    const assembly = read('src/components/landing/identity/identity-assembly.tsx');
    expect(assembly).toContain('useGSAP');
    expect(assembly).toContain('identity-assembly-pin');
    expect(assembly).toContain('invalidateOnRefresh');
    expect(assembly).not.toContain('killAllScrollTriggers');
    expect((assembly.match(/pin:\s*true/g) ?? []).length).toBe(1);
  });

  it('keeps final CTA destinations correct', () => {
    const closing = read('src/components/landing/identity/identity-finale.tsx');
    expect(closing).toContain('MagneticCta');
    expect(closing).toContain('LiveDemoLink');
    expect(closing).toContain('LIVE_DEMO_PROFILE_HREF');
    expect(closing).toContain('closing-profile-preview-link');
    expect(closing).toContain('id="build-yours"');
    expect(closing).toContain('Ready to share in seconds.');
  });
});

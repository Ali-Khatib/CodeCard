import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('Phase 0C LCP recovery contracts', () => {
  it('keeps hero LCP text free of opacity animation', () => {
    const hero = read('src/components/landing/editorial/editorial-hero.tsx');
    expect(hero).toContain('data-hero-statement');
    expect(hero).not.toContain("'use client'");
    expect(hero).not.toContain('fromTo');
    expect(hero).not.toContain('opacity');
  });

  it('preloads Instrument Serif with optional display for landing headline LCP', () => {
    const layout = read('src/app/layout.tsx');
    expect(layout).toContain('Instrument_Serif');
    expect(layout).toMatch(/Instrument_Serif\([\s\S]*?display:\s*'optional'/);
    expect(layout).toMatch(/Instrument_Serif\([\s\S]*?preload:\s*true/);
  });

  it('defers atmosphere with dynamic import; hero stays eager', () => {
    const landing = read('src/components/landing/editorial/editorial-landing.tsx');
    const product = read('src/components/landing/product-page.tsx');
    expect(product).toContain('EditorialLanding');
    expect(landing).toContain("from 'next/dynamic'");
    expect(landing).toContain('EditorialAtmosphere');
    expect(landing).toContain('EditorialHero');
    expect(landing).not.toContain('AudienceBounceCards');
    expect(landing).not.toContain('HowItWorksSection');
  });

  it('does not high-priority the demo avatar when bio text is LCP', () => {
    const focused = read('src/components/profile/public-profile-focused.tsx');
    expect(focused).toContain('avatarUrl');
    expect(focused).not.toMatch(/fetchPriority=["']high["']/);
    const avatarBlock = focused.slice(
      focused.indexOf('{avatarUrl ? ('),
      focused.indexOf(') : ('),
    );
    const withoutComments = avatarBlock.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(withoutComments).not.toMatch(/\bpriority\b/);
  });
});

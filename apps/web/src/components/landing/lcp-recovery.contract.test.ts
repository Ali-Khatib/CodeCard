import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('Phase 0C LCP recovery contracts', () => {
  it('keeps hero LCP text free of opacity animation on the proof cold open', () => {
    const open = read('src/components/landing/proof/proof-cold-open.tsx');
    expect(open).toContain('data-hero-statement');
    expect(open).not.toContain("'use client'");
    expect(open).not.toContain('fromTo');
    expect(open).not.toContain('opacity-0');
    expect(open).not.toMatch(/\bopacity:\s*0\b/);
  });

  it('preloads Instrument Serif with optional display for landing headline LCP', () => {
    const layout = read('src/app/layout.tsx');
    expect(layout).toContain('Instrument_Serif');
    expect(layout).toMatch(/Instrument_Serif\([\s\S]*?display:\s*'optional'/);
    expect(layout).toMatch(/Instrument_Serif\([\s\S]*?preload:\s*true/);
  });

  it('wires the proof landing experience into ProductPage', () => {
    const product = read('src/components/landing/product-page.tsx');
    expect(product).toContain('ProofLanding');
    expect(product).not.toContain('ProductHero');
    expect(product).not.toContain('AudienceBounceCards');
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

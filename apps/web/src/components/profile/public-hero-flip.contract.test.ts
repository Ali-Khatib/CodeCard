import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('public hero identity flip', () => {
  it('keeps the charcoal panel as a 3D flip with history on the back', () => {
    const focused = read('src/components/profile/public-profile-focused.tsx');
    const panel = read('src/components/profile/public-hero-flip-panel.tsx');
    const flip = read('src/components/ui/flip-card.tsx');
    const css = read('src/styles/codecard-app-system.css');

    expect(focused).toContain('<h1');
    expect(focused).toContain('PublicHeroFlipPanel');
    expect(focused).toContain('profileQuickHistory');
    expect(focused).not.toMatch(/^['"]use client['"]/m);

    expect(focused).toContain('PublicProfileHeroActions');
    expect(panel).toContain('Quick history');
    expect(panel).toContain('Spin');
    expect(panel).not.toContain('onMouseEnter');
    expect(flip).toContain('stopPropagation');

    expect(flip).toContain("'use client'");
    expect(flip).toContain('preserve-3d');
    expect(flip).not.toContain('styled-jsx');
    expect(flip).not.toContain('Math.random');

    expect(css).toContain('.cc-flip-card__hint');
    expect(css).toContain('.cc-public-hero__flip-scene .cc-flip-card__hint');
    expect(css).not.toContain('.cc-public-hero__panel:hover .cc-flip-card__rotator');
    expect(css).toContain('prefers-reduced-motion: reduce');
  });
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FOUNDER_ABOUT } from '@/lib/marketing/founder-about';

const WEB = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(WEB, path), 'utf8');

describe('founder about lanyard overlay', () => {
  it('exposes About me on the marketing pill without a seventh Home tab', () => {
    const nav = read('src/components/landing/landing-hero-nav.tsx');
    const shell = read('src/components/landing/landing-shell-nav.tsx');
    expect(nav).toContain('About me');
    expect(nav).toContain('onAboutMe');
    expect(nav).toContain('type="button"');
    expect(shell).toContain('AboutMeOverlay');
    expect(shell).not.toContain("{ label: 'Home'");
  });

  it('drops the React Bits lanyard with founder copy and local portrait', () => {
    const overlay = read('src/components/landing/about-me-overlay.tsx');
    expect(overlay).toContain("@/components/react-bits/lanyard/lanyard");
    expect(overlay).toContain('cc-about-lanyard');
    expect(overlay).toContain(FOUNDER_ABOUT.photoSrc);
    expect(overlay).toContain(FOUNDER_ABOUT.displayName);
    expect(overlay).toContain(FOUNDER_ABOUT.headline);
    expect(overlay).toContain('Bahçeşehir University');
    expect(overlay).toContain('ASYU 2026');
    expect(overlay).toContain('Accepted Author');
    expect(overlay).not.toContain('—');
  });
});

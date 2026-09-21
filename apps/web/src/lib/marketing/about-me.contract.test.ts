import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const WEB = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(WEB, path), 'utf8');

describe('marketing nav without About me', () => {
  it('keeps Pricing and FAQ and does not add a Home tab or About me overlay', () => {
    const nav = read('src/components/landing/landing-hero-nav.tsx');
    const shell = read('src/components/landing/landing-shell-nav.tsx');
    expect(nav).toContain('Pricing');
    expect(shell).toContain("href: '/faq'");
    expect(nav).not.toContain('About me');
    expect(nav).not.toContain('onAboutMe');
    expect(shell).not.toContain('AboutMeOverlay');
    expect(shell).not.toContain("{ label: 'Home'");
    expect(existsSync(resolve(WEB, 'src/components/landing/about-me-overlay.tsx'))).toBe(
      false,
    );
  });
});

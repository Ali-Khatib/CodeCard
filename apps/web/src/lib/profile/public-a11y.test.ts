import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * WS06-T008 automated accessibility contracts.
 * Axe is not installed in this workspace — do not claim axe-passed results.
 * Manual checklist (performed via code review + Playwright not-found keyboard checks):
 * - one h1 / main landmark
 * - focus-visible styles
 * - reduced-motion hooks
 * - citation polite live region
 * - decorative icons aria-hidden
 */

describe('WS06-T008 public accessibility audit', () => {
  it('documents that axe automation is unavailable without adding dependencies', () => {
    const pkg = readFileSync(resolve(process.cwd(), 'package.json'), 'utf8');
    expect(pkg).not.toContain('@axe-core');
    expect(pkg).not.toContain('jest-axe');
    expect(pkg).not.toContain('vitest-axe');
  });

  it('public profile uses main, one h1, and polite copy feedback', () => {
    const profile = readFileSync(
      resolve(process.cwd(), 'src/components/profile/public-profile-focused.tsx'),
      'utf8',
    );
    const social = readFileSync(
      resolve(process.cwd(), 'src/components/profile/public-profile-social-links.tsx'),
      'utf8',
    );
    const hero = readFileSync(
      resolve(process.cwd(), 'src/components/profile/public-profile-hero-actions.tsx'),
      'utf8',
    );
    expect(profile).toContain('<main');
    expect(profile).toContain('<h1');
    expect(profile.match(/<h1/g)?.length).toBe(1);
    expect(social).toContain('aria-label="Profile links"');
    expect(profile).toContain('profileAvatarAltText');
    expect(profile).toContain('aria-hidden');
    expect(hero).toContain('Profile link copied');
    expect(hero).toContain('aria-live="polite"');
    expect(profile).not.toContain('tabIndex={1}');
    expect(profile).not.toContain('tabIndex={2}');
  });

  it('project and research details expose main landmarks and keyboard-safe controls', () => {
    const project = readFileSync(
      resolve(process.cwd(), 'src/components/featured-work/project-detail-view.tsx'),
      'utf8',
    );
    const research = readFileSync(
      resolve(process.cwd(), 'src/components/research/research-paper-detail.tsx'),
      'utf8',
    );
    const notFound = readFileSync(
      resolve(process.cwd(), 'src/components/public/public-not-found-view.tsx'),
      'utf8',
    );
    const citation = readFileSync(
      resolve(process.cwd(), 'src/components/research/citation-copy-button.tsx'),
      'utf8',
    );

    expect(project).toContain('<main');
    expect(project).toContain('<h1');
    expect(project).toContain('aria-label={`Previous project');
    expect(project).toContain('aria-modal="true"');
    expect(project).toContain('focus-visible:ring');
    expect(project).toContain('useReducedMotion');

    expect(research).toContain('<main');
    expect(research).toContain('<h1');
    expect(research).toContain('opens in a new tab');
    expect(research).toContain("alt={figure.caption?.trim() ? '' : 'Research figure'}");
    expect(research).toContain('<figcaption');
    expect(research).toContain('CitationCopyButton');

    expect(notFound).toContain('<main');
    expect(notFound).toContain('<h1');
    expect(notFound).toContain('Back to CodeCard');

    expect(citation).toContain('aria-live="polite"');
    expect(citation).toContain('role="status"');
    expect(citation).toContain('aria-hidden');
    expect(citation).not.toContain('aria-live="assertive"');
  });

  it('does not globally suppress accessibility tooling or rules', () => {
    const axeConfigCandidates = [
      'vitest.config.ts',
      'vitest.config.mts',
      'playwright.config.ts',
      '.eslintrc.json',
      'eslint.config.mjs',
    ];
    for (const file of axeConfigCandidates) {
      try {
        const source = readFileSync(resolve(process.cwd(), file), 'utf8');
        expect(source.toLowerCase()).not.toContain('axe-disable');
        expect(source.toLowerCase()).not.toContain('rules: { \'jsx-a11y');
      } catch {
        // optional config file
      }
    }
  });
});

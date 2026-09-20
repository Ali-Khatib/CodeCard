import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANDING_FAQ_ITEMS } from '@/lib/marketing/landing-faq';
import { CODECARD_TAGLINE, CODECARD_SUMMARY } from '@/lib/marketing/positioning';

const WEB = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(WEB, path), 'utf8');

describe('landing positioning copy', () => {
  it('keeps Pricing and FAQ in the marketing pill, with a corner home control', () => {
    const shell = read('src/components/landing/landing-shell-nav.tsx');
    const mark = read('src/components/landing/codecard-mark-logo.tsx');
    const home = read('src/components/landing/marketing-home-control.tsx');
    expect(shell).toContain("{ label: 'Pricing', href: '/pricing' }");
    expect(shell).toContain("{ label: 'FAQ', href: '/faq'");
    expect(shell).toContain('MarketingHomeControl');
    expect(shell).not.toContain("{ label: 'Home', href: MARKETING_HOME_HREF");
    expect(mark).toContain('Top of page');
    expect(mark).not.toContain('href={MARKETING_HOME_HREF}');
    expect(home).toContain('CodeCard landing');
    expect(home).toContain('MARKETING_HOME_HREF');
  });

  it('answers recurring product questions without replacement claims', () => {
    const questions = LANDING_FAQ_ITEMS.map((item) => item.question);
    expect(questions).toContain('Is CodeCard a replacement for GitHub?');
    expect(questions).toContain('Is CodeCard a replacement for LinkedIn?');
    expect(questions).toContain('Is CodeCard a social network?');
    expect(questions).toContain('Is CodeCard just a portfolio?');
    expect(questions).toContain('Do visitors need the CodeCard app?');
    const blob = LANDING_FAQ_ITEMS.map((item) => item.answer).join(' ');
    expect(blob).toContain('not a replacement');
    expect(blob).toContain('open your CodeCard directly in their browser');
    expect(blob).not.toMatch(/LinkedIn alternative|GitHub alternative|GitHub meets LinkedIn/i);
    expect(blob).not.toContain('—');
  });

  it('frames CodeCard around introductions rather than identity slogans', () => {
    expect(CODECARD_TAGLINE).toBe(
      'Share your work. Keep the connection.',
    );
    expect(CODECARD_SUMMARY).toContain('scan your QR code');
    expect(CODECARD_SUMMARY).not.toContain('living technical identity');
    const hero = read('src/components/landing/editorial/editorial-hero.tsx');
    expect(hero).toContain('SHARE YOUR WORK.');
    expect(hero).toContain('KEEP THE CONNECTION.');
    expect(hero).toContain('real-world introductions');
    expect(hero).toContain('Phone or QR, then a browser.');
    expect(hero).not.toContain('scan your QR.');
    expect(hero).not.toContain('Hand them your phone.');
    expect(hero).not.toContain('YOUR PHONE.');
    const scene = read(
      'src/components/landing/editorial/editorial-hero-scene.tsx',
    );
    expect(scene).toContain('share your QR code');
    const walk = read(
      'src/components/landing/editorial/editorial-feature-walkthrough.tsx',
    );
    expect(walk).toContain('Projects');
    expect(walk).toContain('Research');
    expect(walk).toContain('Connections');
    expect(walk).toContain('Events');
    expect(walk).toContain('Circle');
    expect(walk).toContain('Analytics');
    const landing = read('src/components/landing/editorial/editorial-landing.tsx');
    expect(landing).not.toContain('EditorialFaq');
    const compare = read(
      'src/components/landing/editorial/editorial-comparison.tsx',
    );
    expect(compare).toContain('Built for a different moment.');
    expect(compare).toContain('Not a core capability');
    expect(compare).toContain('<table');
    expect(compare).toContain('Handoff in the conversation');
    expect(compare).toContain('Introduction record');
    expect(compare).toContain('Home calendar');
    expect(compare).toContain('What they opened after a scan');
    expect(compare).not.toContain('In-person work presentation');
    expect(compare).not.toContain('Meeting-based connections');
    expect(compare).not.toMatch(/better than|beats |replaces |outdated|fake networking/i);
  });
});

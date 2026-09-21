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
    const faqPage = read('src/components/landing/faq-page.tsx');
    expect(shell).toContain("{ label: 'Pricing', href: '/pricing' }");
    expect(shell).toContain("{ label: 'FAQ', href: '/faq'");
    expect(shell).toContain('MarketingHomeControl');
    expect(shell).not.toContain("{ label: 'Home', href: MARKETING_HOME_HREF");
    expect(mark).toContain('Top of page');
    expect(mark).not.toContain('href={MARKETING_HOME_HREF}');
    expect(home).toContain('CodeCard landing');
    expect(home).toContain('MARKETING_HOME_HREF');
    const chrome = read('src/styles/editorial-landing.css');
    expect(chrome).toContain(
      '.cc-marketing-shell:has(.cc-ed-hero-scene) .cc-ed-mark-logo:not(.cc-auth-mark)',
    );
    expect(chrome).toContain(
      '.cc-marketing-shell:not(:has(.cc-ed-hero-scene)) .cc-ed-mark-logo:not(.cc-auth-mark)',
    );
    expect(faqPage).toContain('cc-faq-page');
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
    expect(hero).toContain(
      'Where your work meets your people, and introductions become',
    );
    expect(hero).not.toContain('Open it on your phone, or they scan the QR.');
    expect(hero).not.toContain('scan your QR.');
    expect(hero).not.toContain('Hand them your phone.');
    expect(hero).not.toContain('YOUR PHONE.');
    const scene = read(
      'src/components/landing/editorial/editorial-hero-scene.tsx',
    );
    expect(scene).toContain('scan your QR');
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
    expect(compare).toContain('Built for the handshake.');
    expect(compare).toContain('Not a core capability');
    expect(compare).toContain('<table');
    expect(compare).toContain('Definition');
    expect(compare).toContain('Use case, and what it is mainly for.');
    expect(compare).toContain('When the conversation turns to your work');
    expect(compare).toContain('After you already have a name');
    expect(compare).toContain('already know the repo');
    expect(compare).toContain('public builder audience');
    expect(compare).toContain('You mainly use it as a public professional network.');
    expect(compare).toContain('You mainly use it to host and review code.');
    expect(compare).toContain('You mainly use it as a public builder feed.');
    expect(compare).not.toContain('CodeCard does');
    expect(compare).not.toContain('CodeCard is.');
    expect(compare).toContain('data-compare-fit');
    expect(compare).toContain('cc-ed-compare__define-vs');
    expect(compare).not.toContain('shareable technical record for in-person introductions');
    expect(compare).toContain('Open the work in the room, on your phone or with a QR');
    expect(compare).toContain('Keep the person from that introduction, not a later search');
    expect(compare).toContain('Time, place, private note, and next step on the same person');
    expect(compare).toContain('Events and follow-ups in a single calendar');
    expect(compare).toContain('Private circle of people you actually exchanged with');
    expect(compare).toContain('See which projects and papers they opened after the scan');
    expect(compare).not.toContain('In-conversation handoff');
    expect(compare).not.toContain('Session-origin connection');
    expect(compare).not.toContain('Introduction object');
    expect(compare).not.toContain('Post-scan instrumentation');
    expect(compare).not.toContain('In-person work presentation');
    expect(compare).not.toContain('Meeting-based connections');
    expect(compare).not.toMatch(/better than|beats |replaces |outdated|fake networking/i);
  });
});

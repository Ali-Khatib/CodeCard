import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANDING_FAQ_ITEMS } from '@/lib/marketing/landing-faq';
import { CODECARD_TAGLINE, CODECARD_SUMMARY } from '@/lib/marketing/positioning';

const WEB = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(WEB, path), 'utf8');

describe('landing positioning copy', () => {
  it('keeps FAQ in the marketing pill as a fourth item', () => {
    const shell = read('src/components/landing/landing-shell-nav.tsx');
    expect(shell).toContain("{ label: 'Pricing', href: '/pricing' }");
    expect(shell).toContain("{ label: 'FAQ', href: '/#faq'");
  });

  it('answers recurring product questions without replacement claims', () => {
    const questions = LANDING_FAQ_ITEMS.map((item) => item.question);
    expect(questions).toContain("Isn't CodeCard just GitHub?");
    expect(questions).toContain("Isn't CodeCard just LinkedIn?");
    expect(questions).toContain('Is CodeCard a social network?');
    expect(questions).toContain('Does the other person need the CodeCard app?');
    const blob = LANDING_FAQ_ITEMS.map((item) => item.answer).join(' ');
    expect(blob).toContain('not a replacement');
    expect(blob).toContain('open your CodeCard directly in their browser');
    expect(blob).not.toMatch(/LinkedIn alternative|GitHub alternative|GitHub meets LinkedIn/i);
    expect(blob).not.toContain('—');
  });

  it('frames CodeCard as showcase, connection holder, and follow up', () => {
    expect(CODECARD_TAGLINE).toBe('The quickest way to impress someone with your work.');
    expect(CODECARD_SUMMARY).toContain('people you actually meet');
    const hero = read('src/components/landing/editorial/editorial-hero.tsx');
    expect(hero).toContain('They do not need the app just to look');
    expect(hero).not.toContain('ONE IDENTITY');
    const landing = read('src/components/landing/editorial/editorial-landing.tsx');
    expect(landing).toContain('EditorialFaq');
  });
});

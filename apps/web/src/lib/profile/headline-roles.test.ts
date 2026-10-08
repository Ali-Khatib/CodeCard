import { describe, expect, it } from 'vitest';
import {
  displayHeadlineParts,
  headlinePlainText,
  parseHeadlineParts,
  serializeHeadlineParts,
} from './headline-roles';
import { parseHeadline } from './parse-headline';

describe('headline roles', () => {
  it('round-trips icon tokens without putting them in the visible text', () => {
    const stored = serializeHeadlineParts([
      { text: 'Founder of CodeCard', icon: 'work' },
      { text: 'Software Engineer', icon: 'code' },
      { text: 'AI/ML Researcher', icon: 'lab' },
    ]);

    expect(stored).toBe(
      '[work] Founder of CodeCard · [code] Software Engineer · [lab] AI/ML Researcher',
    );
    expect(parseHeadlineParts(stored)).toEqual([
      { text: 'Founder of CodeCard', icon: 'work' },
      { text: 'Software Engineer', icon: 'code' },
      { text: 'AI/ML Researcher', icon: 'lab' },
    ]);
    expect(headlinePlainText(stored)).toBe(
      'Founder of CodeCard · Software Engineer · AI/ML Researcher',
    );
  });

  it('keeps a two-part headline on one line and gives the founder three default icons', () => {
    expect(displayHeadlineParts('Senior AI Engineer · Stripe')).toEqual([
      { text: 'Senior AI Engineer', icon: 'work' },
      { text: 'Stripe', icon: null },
    ]);

    const founder = displayHeadlineParts(
      'Founder of CodeCard · Software Engineer · AI/ML Researcher',
      { founder: true },
    );
    expect(founder.map((part) => part.icon)).toEqual(['work', 'code', 'lab']);
    expect(founder[0]?.text).toBe('Founder of CodeCard');
  });

  it('strips icon tokens before role and company are split', () => {
    expect(
      parseHeadline('[work] Founder of CodeCard · [code] Software Engineer · [lab] AI/ML Researcher'),
    ).toEqual({
      role: 'Founder of CodeCard',
      company: 'Software Engineer · AI/ML Researcher',
    });
  });
});

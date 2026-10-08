import { describe, expect, it } from 'vitest';
import { profileQuickHistory } from './quick-history';

describe('profileQuickHistory', () => {
  it('returns demo history for the Alex Chen card', () => {
    const lines = profileQuickHistory({
      profileSlug: 'demo',
      headline: 'Senior AI Engineer · Stripe',
      location: 'San Francisco',
      bio: 'I ship tools that help teams move faster. Previously early engineer at infra startups.',
    });

    expect(lines.map((line) => line.label)).toEqual(['Now', 'Before', 'Studied', 'Based']);
    expect(lines[0]?.value).toContain('Stripe');
    expect(lines[2]?.value).toContain('Berkeley');
  });

  it('derives now / based / before from real profile fields without inventing school', () => {
    const lines = profileQuickHistory({
      profileSlug: 'maya',
      headline: 'Staff Engineer · Notion',
      location: 'NYC',
      bio: 'I design systems. Previously founding engineer at a data startup.',
    });

    expect(lines).toEqual([
      { label: 'Now', value: 'Staff Engineer · Notion', icon: 'now' },
      { label: 'Before', value: 'Founding engineer at a data startup', icon: 'before' },
      { label: 'Based', value: 'NYC', icon: 'based' },
    ]);
  });

  it('shows saved history on the back and skips blank lines', () => {
    const lines = profileQuickHistory({
      profileSlug: 'maya',
      headline: 'Staff Engineer',
      location: '',
      bio: 'Previously founding engineer at a data startup.',
      history: {
        before: 'Research intern',
        studied: 'M.S. Computer Science',
      },
    });

    expect(lines).toEqual([
      { label: 'Now', value: 'Staff Engineer', icon: 'now' },
      { label: 'Before', value: 'Research intern', icon: 'before' },
      { label: 'Studied', value: 'M.S. Computer Science', icon: 'studied' },
    ]);
  });
});

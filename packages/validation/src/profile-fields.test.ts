import { describe, expect, it } from 'vitest';
import {
  normalizeProfileLocation,
  normalizeProfileSkills,
  parseCommaSeparatedSkills,
  profileLocationSchema,
  profileSkillsSchema,
  updateProfileSchema,
} from '../src/index';

describe('normalizeProfileLocation', () => {
  it('accepts Unicode and punctuation', () => {
    expect(normalizeProfileLocation('São Paulo, BR')).toBe('São Paulo, BR');
    expect(normalizeProfileLocation('北京')).toBe('北京');
  });

  it('normalizes empty strings to null', () => {
    expect(normalizeProfileLocation('')).toBeNull();
    expect(normalizeProfileLocation('   ')).toBeNull();
  });
});

describe('profileLocationSchema', () => {
  it('accepts valid location', () => {
    expect(profileLocationSchema.parse('San Francisco, CA')).toBe('San Francisco, CA');
  });

  it('rejects overlong location', () => {
    expect(() => profileLocationSchema.parse('a'.repeat(121))).toThrow();
  });

  it('normalizes empty location to null', () => {
    expect(profileLocationSchema.parse('')).toBeNull();
  });
});

describe('profileSkillsSchema', () => {
  it('accepts technical skill names', () => {
    expect(
      profileSkillsSchema.parse([
        'TypeScript',
        'Next.js',
        'Node.js',
        'C++',
        'C#',
        '.NET',
        'PostgreSQL',
        'Machine Learning',
      ]),
    ).toEqual([
      'TypeScript',
      'Next.js',
      'Node.js',
      'C++',
      'C#',
      '.NET',
      'PostgreSQL',
      'Machine Learning',
    ]);
  });

  it('removes duplicates case-insensitively and preserves first capitalization', () => {
    expect(profileSkillsSchema.parse(['TypeScript', 'typescript', 'TYPESCRIPT'])).toEqual([
      'TypeScript',
    ]);
  });

  it('strips empty skill values instead of storing them', () => {
    expect(profileSkillsSchema.parse(['TypeScript', ''])).toEqual(['TypeScript']);
  });

  it('enforces skill count limit', () => {
    const skills = Array.from({ length: 31 }, (_, i) => `Skill${i}`);
    expect(() => profileSkillsSchema.parse(skills)).toThrow(/30 skills/);
  });

  it('enforces per-skill length limit', () => {
    expect(() => profileSkillsSchema.parse(['a'.repeat(51)])).toThrow();
  });
});

describe('parseCommaSeparatedSkills', () => {
  it('parses comma-separated input', () => {
    expect(parseCommaSeparatedSkills('TypeScript, Next.js, C++')).toEqual([
      'TypeScript',
      'Next.js',
      'C++',
    ]);
  });

  it('returns empty array for blank input', () => {
    expect(parseCommaSeparatedSkills('')).toEqual([]);
    expect(parseCommaSeparatedSkills(' , ')).toEqual([]);
  });
});

describe('normalizeProfileSkills', () => {
  it('deduplicates while preserving order', () => {
    expect(normalizeProfileSkills(['Go', 'Rust', 'go'])).toEqual(['Go', 'Rust']);
  });
});

describe('updateProfileSchema location and skills', () => {
  it('accepts partial location and skills updates', () => {
    const result = updateProfileSchema.safeParse({
      location: 'Berlin, Germany',
      skills: ['React', 'GraphQL'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.location).toBe('Berlin, Germany');
      expect(result.data.skills).toEqual(['React', 'GraphQL']);
    }
  });
});

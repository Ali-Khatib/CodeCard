import { describe, expect, it } from 'vitest';
import {
  getPasswordRequirements,
  getPasswordStrength,
  PASSWORD_REQUIREMENTS_SUMMARY,
} from '@/lib/auth/password-guidance';

describe('getPasswordRequirements', () => {
  it('lists every password rule with clear labels', () => {
    const reqs = getPasswordRequirements('');
    expect(reqs.map((r) => r.label)).toEqual([
      'At least 8 characters',
      'At least one uppercase letter (A-Z)',
      'At least one lowercase letter (a-z)',
      'At least one number (0-9)',
    ]);
    expect(reqs.every((r) => !r.met)).toBe(true);
    expect(PASSWORD_REQUIREMENTS_SUMMARY).toMatch(/8 characters/i);
    expect(PASSWORD_REQUIREMENTS_SUMMARY).toMatch(/uppercase/i);
    expect(PASSWORD_REQUIREMENTS_SUMMARY).toMatch(/lowercase/i);
    expect(PASSWORD_REQUIREMENTS_SUMMARY).toMatch(/number/i);
  });

  it('reports unmet requirements for weak passwords', () => {
    const reqs = getPasswordRequirements('ab');
    expect(reqs.find((r) => r.id === 'length')?.met).toBe(false);
    expect(reqs.find((r) => r.id === 'upper')?.met).toBe(false);
  });

  it('marks all requirements for a strong password', () => {
    const reqs = getPasswordRequirements('SecurePass1');
    expect(reqs.every((r) => r.met)).toBe(true);
  });
});

describe('getPasswordStrength', () => {
  it('returns empty for blank password', () => {
    expect(getPasswordStrength('')).toMatchObject({ level: 'empty', score: 0, label: '' });
  });

  it('rates partial rule matches as weak through strong', () => {
    expect(getPasswordStrength('a').level).toBe('weak');
    expect(getPasswordStrength('ab').score).toBe(1);
    expect(getPasswordStrength('abcdefgh').level).toBe('medium'); // length + lower
    expect(getPasswordStrength('Abcdefgh').level).toBe('strong'); // length + lower + upper
  });

  it('marks SecurePass1 as strong (valid signup) and longer/symbol as very strong', () => {
    expect(getPasswordStrength('SecurePass1')).toMatchObject({
      level: 'strong',
      score: 4,
      label: 'Strong',
    });
    expect(getPasswordStrength('SecurePass1!')).toMatchObject({
      level: 'very_strong',
      score: 4,
      label: 'Very strong',
    });
    expect(getPasswordStrength('SecurePass12')).toMatchObject({
      level: 'very_strong',
      label: 'Very strong',
    });
  });
});

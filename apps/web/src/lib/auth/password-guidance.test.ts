import { describe, expect, it } from 'vitest';
import { getPasswordRequirements } from '@/lib/auth/password-guidance';

describe('getPasswordRequirements', () => {
  it('reports unmet requirements for weak passwords', () => {
    const reqs = getPasswordRequirements('ab');
    expect(reqs.every((r) => !r.met)).toBe(false);
    expect(reqs.find((r) => r.id === 'length')?.met).toBe(false);
    expect(reqs.find((r) => r.id === 'upper')?.met).toBe(false);
  });

  it('marks all requirements for a strong password', () => {
    const reqs = getPasswordRequirements('SecurePass1');
    expect(reqs.every((r) => r.met)).toBe(true);
  });
});

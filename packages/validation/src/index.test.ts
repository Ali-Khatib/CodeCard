import { describe, it, expect } from 'vitest';
import { slugSchema, signUpSchema, urlSchema } from '../src/index';

describe('slugSchema', () => {
  it('accepts valid slugs', () => {
    expect(slugSchema.safeParse('jane-doe').success).toBe(true);
    expect(slugSchema.safeParse('abc').success).toBe(true);
  });

  it('rejects invalid slugs', () => {
    expect(slugSchema.safeParse('ab').success).toBe(false);
    expect(slugSchema.safeParse('UPPER').success).toBe(false);
    expect(slugSchema.safeParse('-start').success).toBe(false);
  });
});

describe('urlSchema', () => {
  it('accepts https URLs', () => {
    expect(urlSchema.safeParse('https://example.com').success).toBe(true);
  });

  it('rejects non-http protocols', () => {
    expect(urlSchema.safeParse('javascript:alert(1)').success).toBe(false);
    expect(urlSchema.safeParse('ftp://example.com').success).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('requires strong password', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: 'weak',
      display_name: 'Test User',
      slug: 'test-user',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toMatch(/8 characters/i);
      expect(result.error.errors[0]?.message).toMatch(/uppercase/i);
      expect(result.error.errors[0]?.message).toMatch(/lowercase/i);
      expect(result.error.errors[0]?.message).toMatch(/number/i);
    }
  });

  it('rejects empty password with the full requirements message', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: '',
      display_name: 'Test User',
      slug: 'test-user',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).not.toMatch(/at least 1 character/i);
      expect(result.error.errors[0]?.message).toMatch(/8 characters/i);
    }
  });

  it('accepts valid signup', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: 'SecurePass1',
      display_name: 'Test User',
      slug: 'test-user',
    });
    expect(result.success).toBe(true);
  });
});

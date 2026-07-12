import { describe, expect, it } from 'vitest';
import {
  normalizeProjectSlug,
  normalizeProjectUserRole,
  projectDateSchema,
  projectSlugSchema,
  projectStatusSchema,
  projectUserRoleSchema,
  validateProjectDateRange,
} from '../src/index';

describe('normalizeProjectSlug', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(normalizeProjectSlug('Dev Flow')).toBe('dev-flow');
    expect(normalizeProjectSlug('UPPER CASE')).toBe('upper-case');
  });

  it('rejects invalid slugs and normalizes leading or trailing separators', () => {
    expect(projectSlugSchema.safeParse('ab').success).toBe(false);
    expect(projectSlugSchema.safeParse('../traversal').success).toBe(false);
    expect(projectSlugSchema.safeParse('a..b').success).toBe(false);
    expect(projectSlugSchema.parse('-leading')).toBe('leading');
    expect(projectSlugSchema.parse('trailing-')).toBe('trailing');
    expect(projectSlugSchema.safeParse('a'.repeat(64)).success).toBe(false);
    expect(projectSlugSchema.safeParse('!!!').success).toBe(false);
  });

  it('accepts valid slugs and normalizes input', () => {
    expect(projectSlugSchema.parse('Dev-Flow')).toBe('dev-flow');
    expect(projectSlugSchema.parse('schema_sync')).toBe('schema-sync');
    expect(projectSlugSchema.parse('abc')).toBe('abc');
  });
});

describe('normalizeProjectUserRole', () => {
  it('preserves Unicode and trims whitespace', () => {
    expect(normalizeProjectUserRole('  Frontend Engineer  ')).toBe('Frontend Engineer');
    expect(projectUserRoleSchema.parse('Product Designer')).toBe('Product Designer');
    expect(projectUserRoleSchema.parse('研究員')).toBe('研究員');
  });

  it('normalizes empty values to null', () => {
    expect(projectUserRoleSchema.parse('')).toBeNull();
    expect(projectUserRoleSchema.parse(null)).toBeNull();
  });
});

describe('projectDateSchema', () => {
  it('accepts start date without end date', () => {
    expect(projectDateSchema.parse('2024-01-15')).toBe('2024-01-15');
    expect(projectDateSchema.parse(null)).toBeNull();
  });

  it('rejects invalid date strings', () => {
    expect(projectDateSchema.safeParse('01/15/2024').success).toBe(false);
    expect(projectDateSchema.safeParse('2024-13-01').success).toBe(true);
  });
});

describe('validateProjectDateRange', () => {
  it('accepts valid date ranges and open-ended projects', () => {
    expect(validateProjectDateRange({ started_at: '2024-01-01', ended_at: '2024-06-01' })).toBeNull();
    expect(validateProjectDateRange({ started_at: '2024-01-01', ended_at: null })).toBeNull();
    expect(validateProjectDateRange({ started_at: null, ended_at: null })).toBeNull();
  });

  it('rejects end date before start date', () => {
    expect(
      validateProjectDateRange({ started_at: '2024-06-01', ended_at: '2024-01-01' }),
    ).toBe('End date cannot be earlier than start date.');
  });
});

describe('projectStatusSchema', () => {
  it('allows nullable lifecycle status text within length limits', () => {
    expect(projectStatusSchema.parse('active')).toBe('active');
    expect(projectStatusSchema.parse(null)).toBeNull();
    expect(projectStatusSchema.parse('')).toBeNull();
  });
});

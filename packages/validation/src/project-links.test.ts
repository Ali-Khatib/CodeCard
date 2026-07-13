import { describe, expect, it } from 'vitest';
import {
  findDuplicateProjectLink,
  isAllowedProjectLinkHref,
  PROJECT_LINKS_MAX_COUNT,
  projectLinkInputSchema,
} from './project-links';

describe('projectLinkInputSchema', () => {
  it('accepts valid HTTPS URLs', () => {
    const result = projectLinkInputSchema.safeParse({
      type: 'repo',
      label: 'GitHub',
      url: 'https://github.com/org/repo',
    });
    expect(result.success).toBe(true);
  });

  it('rejects malformed URLs', () => {
    expect(
      projectLinkInputSchema.safeParse({ type: 'repo', url: 'not-a-url' }).success,
    ).toBe(false);
  });

  it('rejects javascript URLs', () => {
    expect(
      projectLinkInputSchema.safeParse({ type: 'other', url: 'javascript:alert(1)' }).success,
    ).toBe(false);
  });

  it('rejects data URLs', () => {
    expect(
      projectLinkInputSchema.safeParse({ type: 'other', url: 'data:text/html,hi' }).success,
    ).toBe(false);
  });

  it('rejects protocol-relative URLs', () => {
    expect(isAllowedProjectLinkHref('//evil.example')).toBe(false);
  });

  it('rejects unsupported schemes', () => {
    expect(isAllowedProjectLinkHref('ftp://example.com')).toBe(false);
  });

  it('rejects overlong URLs', () => {
    const result = projectLinkInputSchema.safeParse({
      type: 'live',
      url: `https://example.com/${'a'.repeat(2048)}`,
    });
    expect(result.success).toBe(false);
  });

  it('rejects overlong labels', () => {
    const result = projectLinkInputSchema.safeParse({
      type: 'paper',
      label: 'x'.repeat(51),
      url: 'https://example.com/paper.pdf',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unsupported link types', () => {
    const result = projectLinkInputSchema.safeParse({
      type: 'github',
      url: 'https://github.com/org/repo',
    });
    expect(result.success).toBe(false);
  });
});

describe('findDuplicateProjectLink', () => {
  it('detects duplicate type and URL pairs', () => {
    expect(
      findDuplicateProjectLink(
        [{ id: '1', type: 'repo', url: 'https://github.com/a/b' }],
        { type: 'repo', url: 'https://github.com/a/b' },
      ),
    ).toBe(true);
  });

  it('allows the same link when updating itself', () => {
    expect(
      findDuplicateProjectLink(
        [{ id: '1', type: 'repo', url: 'https://github.com/a/b' }],
        { id: '1', type: 'repo', url: 'https://github.com/a/b' },
      ),
    ).toBe(false);
  });
});

describe('PROJECT_LINKS_MAX_COUNT', () => {
  it('defines a server-enforced maximum', () => {
    expect(PROJECT_LINKS_MAX_COUNT).toBeGreaterThan(0);
    expect(PROJECT_LINKS_MAX_COUNT).toBeLessThanOrEqual(20);
  });
});

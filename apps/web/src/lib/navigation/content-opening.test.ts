import { describe, expect, it } from 'vitest';
import {
  CONTENT_OPENING_FAILSAFE_MS,
  CONTENT_OPENING_MIN_MS,
  contentOpeningHeadline,
  contentOpeningMatchesPath,
  contentOpeningTitle,
  resolveContentOpeningKind,
  shouldInterceptContentOpeningClick,
} from './content-opening';

describe('content opening helpers', () => {
  it('uses exact opening copy and fallbacks', () => {
    expect(contentOpeningHeadline('project')).toBe('Opening project');
    expect(contentOpeningHeadline('research')).toBe('Opening research');
    expect(contentOpeningTitle('project', ' Atlas ')).toBe('Atlas');
    expect(contentOpeningTitle('research', null)).toBe('Your research');
    expect(contentOpeningTitle('project', '')).toBe('Your project');
  });

  it('keeps a short minimum display and failsafe timeout', () => {
    expect(CONTENT_OPENING_MIN_MS).toBeGreaterThanOrEqual(350);
    expect(CONTENT_OPENING_MIN_MS).toBeLessThanOrEqual(500);
    expect(CONTENT_OPENING_FAILSAFE_MS).toBeGreaterThan(CONTENT_OPENING_MIN_MS);
  });

  it('matches internal project and research detail/edit routes', () => {
    expect(resolveContentOpeningKind('/alex-chen/projects/abc')).toBe('project');
    expect(resolveContentOpeningKind('/dashboard/projects/abc/edit')).toBe('project');
    expect(resolveContentOpeningKind('/demo/research/paper-slug')).toBe('research');
    expect(resolveContentOpeningKind('/dashboard/research/abc/edit')).toBe('research');
    expect(resolveContentOpeningKind('/dashboard/projects')).toBeNull();
    expect(resolveContentOpeningKind('/dashboard/projects/new')).toBeNull();
    expect(resolveContentOpeningKind('/dashboard/research/new')).toBeNull();
    expect(resolveContentOpeningKind('https://github.com/org/repo')).toBeNull();
  });

  it('preserves new-tab modifier and middle-click behavior', () => {
    expect(shouldInterceptContentOpeningClick({ button: 0 })).toBe(true);
    expect(shouldInterceptContentOpeningClick({ button: 1 })).toBe(false);
    expect(shouldInterceptContentOpeningClick({ button: 0, metaKey: true })).toBe(false);
    expect(shouldInterceptContentOpeningClick({ button: 0, ctrlKey: true })).toBe(false);
    expect(shouldInterceptContentOpeningClick({ button: 0, shiftKey: true })).toBe(false);
    expect(shouldInterceptContentOpeningClick({ button: 0, altKey: true })).toBe(false);
    expect(shouldInterceptContentOpeningClick({ button: 0, defaultPrevented: true })).toBe(false);
  });

  it('clears when the destination pathname matches', () => {
    expect(
      contentOpeningMatchesPath('/dashboard/projects/abc/edit', '/dashboard/projects/abc/edit/'),
    ).toBe(true);
    expect(contentOpeningMatchesPath('/a/projects/1', '/a/research/1')).toBe(false);
  });
});

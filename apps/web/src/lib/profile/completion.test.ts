import { describe, expect, it } from 'vitest';
import {
  PROFILE_COMPLETION_TOTAL,
  PROFILE_COMPLETION_WEIGHT,
  calculateProfileCompletion,
  deriveProfileCompletionInput,
  getProfileCompletionNextStep,
  hasPersistedAvatar,
  hasPersistedBio,
  hasPersistedHeadline,
} from './completion';

const emptyInput = {
  hasHeadline: false,
  hasBio: false,
  hasAvatar: false,
  hasProfileLink: false,
  hasPublishedProject: false,
};

describe('calculateProfileCompletion', () => {
  it('returns 0% when no criteria are complete', () => {
    const result = calculateProfileCompletion(emptyInput);
    expect(result.percentage).toBe(0);
    expect(result.completedCount).toBe(0);
    expect(result.totalCount).toBe(PROFILE_COMPLETION_TOTAL);
    expect(result.incompleteCriteria).toHaveLength(5);
  });

  it.each([
    ['headline', { hasHeadline: true }],
    ['bio', { hasBio: true }],
    ['avatar', { hasAvatar: true }],
    ['profile link', { hasProfileLink: true }],
    ['published project', { hasPublishedProject: true }],
  ] as const)('returns 20%% when only %s is complete', (_label, partial) => {
    const result = calculateProfileCompletion({ ...emptyInput, ...partial });
    expect(result.percentage).toBe(PROFILE_COMPLETION_WEIGHT);
    expect(result.completedCount).toBe(1);
  });

  it('returns 40% when two criteria are complete', () => {
    const result = calculateProfileCompletion({
      ...emptyInput,
      hasHeadline: true,
      hasBio: true,
    });
    expect(result.percentage).toBe(40);
    expect(result.completedCount).toBe(2);
  });

  it('returns 60% when three criteria are complete', () => {
    const result = calculateProfileCompletion({
      ...emptyInput,
      hasHeadline: true,
      hasBio: true,
      hasAvatar: true,
    });
    expect(result.percentage).toBe(60);
  });

  it('returns 80% when four criteria are complete', () => {
    const result = calculateProfileCompletion({
      ...emptyInput,
      hasHeadline: true,
      hasBio: true,
      hasAvatar: true,
      hasProfileLink: true,
    });
    expect(result.percentage).toBe(80);
  });

  it('returns 100% when all five criteria are complete', () => {
    const result = calculateProfileCompletion({
      hasHeadline: true,
      hasBio: true,
      hasAvatar: true,
      hasProfileLink: true,
      hasPublishedProject: true,
    });
    expect(result.percentage).toBe(100);
    expect(result.completedCount).toBe(5);
    expect(result.incompleteCriteria).toHaveLength(0);
  });

  it('never exceeds 100%', () => {
    const result = calculateProfileCompletion({
      hasHeadline: true,
      hasBio: true,
      hasAvatar: true,
      hasProfileLink: true,
      hasPublishedProject: true,
    });
    expect(result.percentage).toBeLessThanOrEqual(100);
    expect(result.totalCount).toBe(5);
  });

  it('ignores whitespace-only headline and bio values', () => {
    const input = deriveProfileCompletionInput(
      { headline: '   ', bio: '\n\t', avatar_url: 'https://cdn.example/avatar.jpg' },
      { hasProfileLink: false, hasPublishedProject: false },
    );
    expect(input.hasHeadline).toBe(false);
    expect(input.hasBio).toBe(false);
    expect(input.hasAvatar).toBe(true);
  });

  it('ignores whitespace-only avatar values', () => {
    expect(hasPersistedAvatar('   ')).toBe(false);
    expect(hasPersistedHeadline('Engineer')).toBe(true);
    expect(hasPersistedBio('Builder')).toBe(true);
  });
});

describe('getProfileCompletionNextStep', () => {
  it('points missing published project to new project route when user has no projects', () => {
    const completion = calculateProfileCompletion({
      hasHeadline: true,
      hasBio: true,
      hasAvatar: true,
      hasProfileLink: true,
      hasPublishedProject: false,
    });
    const step = getProfileCompletionNextStep(completion, { hasAnyProject: false });
    expect(step?.href).toBe('/dashboard/projects/new');
  });

  it('points missing published project to projects list when drafts exist', () => {
    const completion = calculateProfileCompletion({
      ...emptyInput,
      hasHeadline: true,
      hasBio: true,
      hasAvatar: true,
      hasProfileLink: true,
    });
    const step = getProfileCompletionNextStep(completion, { hasAnyProject: true });
    expect(step?.href).toBe('/dashboard/projects');
  });

  it('returns null when profile is complete', () => {
    const completion = calculateProfileCompletion({
      hasHeadline: true,
      hasBio: true,
      hasAvatar: true,
      hasProfileLink: true,
      hasPublishedProject: true,
    });
    expect(getProfileCompletionNextStep(completion, { hasAnyProject: true })).toBeNull();
  });
});

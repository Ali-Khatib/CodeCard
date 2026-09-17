import { describe, expect, it } from 'vitest';
import {
  PROFILE_COMPLETION_TOTAL,
  PROFILE_COMPLETION_WEIGHT,
  calculateProfileCompletion,
  deriveProfileCompletionInput,
  getProfileCompletionNextStep,
  getHomeWorkspaceNextStep,
  getHomeLoopState,
  shellCreateProjectEmphasis,
  isIdentityComplete,
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
    expect(step?.href).toBe('/dashboard/work#projects');
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

describe('getHomeLoopState', () => {
  const identityReady = calculateProfileCompletion({
    hasHeadline: true,
    hasBio: true,
    hasAvatar: true,
    hasProfileLink: true,
    hasPublishedProject: false,
  });
  const fullyComplete = calculateProfileCompletion({
    hasHeadline: true,
    hasBio: true,
    hasAvatar: true,
    hasProfileLink: true,
    hasPublishedProject: true,
  });

  it('is complete_identity until headline, bio, avatar, and a link exist', () => {
    const incomplete = calculateProfileCompletion(emptyInput);
    expect(isIdentityComplete(incomplete)).toBe(false);
    expect(getHomeLoopState(incomplete, { hasAnyProject: false, isPublic: false })).toBe(
      'complete_identity',
    );
  });

  it('asks for a first project after identity, even with no published project', () => {
    expect(isIdentityComplete(identityReady)).toBe(true);
    expect(getHomeLoopState(identityReady, { hasAnyProject: false, isPublic: false })).toBe(
      'create_project',
    );
    expect(
      getHomeWorkspaceNextStep(identityReady, { hasAnyProject: false, isPublic: false }).href,
    ).toBe('/dashboard/projects/new');
  });

  it('asks to publish the CodeCard once any project exists and the card is private', () => {
    expect(getHomeLoopState(identityReady, { hasAnyProject: true, isPublic: false })).toBe(
      'publish_card',
    );
    expect(
      getHomeWorkspaceNextStep(identityReady, { hasAnyProject: true, isPublic: false }).title,
    ).toBe('Publish your CodeCard');
  });

  it('asks to share once the card is public', () => {
    expect(getHomeLoopState(fullyComplete, { hasAnyProject: true, isPublic: true })).toBe(
      'share_card',
    );
    expect(
      getHomeWorkspaceNextStep(fullyComplete, { hasAnyProject: true, isPublic: true }).href,
    ).toBe('/dashboard#share');
  });
});

describe('shellCreateProjectEmphasis', () => {
  it('is primary only when the Home loop is create_project', () => {
    expect(shellCreateProjectEmphasis('complete_identity')).toBe('ghost');
    expect(shellCreateProjectEmphasis('create_project')).toBe('primary');
    expect(shellCreateProjectEmphasis('publish_card')).toBe('ghost');
    expect(shellCreateProjectEmphasis('share_card')).toBe('ghost');
    expect(shellCreateProjectEmphasis(null)).toBe('ghost');
  });
});

describe('getHomeWorkspaceNextStep', () => {
  it('keeps identity steps ahead of publishing', () => {
    const incomplete = calculateProfileCompletion(emptyInput);
    const step = getHomeWorkspaceNextStep(incomplete, { hasAnyProject: false, isPublic: false });
    expect(step.title).toBe('Add a headline');
  });

  it('does not send a draft-only user to publish-a-project instead of publish-the-card', () => {
    const identityReady = calculateProfileCompletion({
      hasHeadline: true,
      hasBio: true,
      hasAvatar: true,
      hasProfileLink: true,
      hasPublishedProject: false,
    });
    const step = getHomeWorkspaceNextStep(identityReady, { hasAnyProject: true, isPublic: false });
    expect(step.href).toBe('/dashboard#visibility');
  });
});

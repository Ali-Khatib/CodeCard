export const PROFILE_COMPLETION_CRITERIA = [
  'headline',
  'bio',
  'avatar',
  'profileLink',
  'publishedProject',
] as const;

export type ProfileCompletionCriterion = (typeof PROFILE_COMPLETION_CRITERIA)[number];

export const PROFILE_COMPLETION_TOTAL = 5;
export const PROFILE_COMPLETION_WEIGHT = 20;

export type ProfileCompletionInput = {
  hasHeadline: boolean;
  hasBio: boolean;
  hasAvatar: boolean;
  hasProfileLink: boolean;
  hasPublishedProject: boolean;
};

export type ProfileCompletionCriterionResult = {
  id: ProfileCompletionCriterion;
  label: string;
  complete: boolean;
  href: string;
};

export type ProfileCompletionResult = {
  percentage: number;
  completedCount: number;
  totalCount: number;
  criteria: ProfileCompletionCriterionResult[];
  incompleteCriteria: ProfileCompletionCriterion[];
};

const CRITERION_LABELS: Record<ProfileCompletionCriterion, string> = {
  headline: 'Headline',
  bio: 'Bio',
  avatar: 'Avatar',
  profileLink: 'Profile link',
  publishedProject: 'Published project',
};

export function hasPersistedHeadline(headline?: string | null): boolean {
  return Boolean(headline?.trim());
}

export function hasPersistedBio(bio?: string | null): boolean {
  return Boolean(bio?.trim());
}

export function hasPersistedAvatar(avatarUrl?: string | null): boolean {
  return Boolean(avatarUrl?.trim());
}

export function deriveProfileCompletionInput(
  profile: {
    headline?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
  },
  flags: {
    hasProfileLink: boolean;
    hasPublishedProject: boolean;
  },
): ProfileCompletionInput {
  return {
    hasHeadline: hasPersistedHeadline(profile.headline),
    hasBio: hasPersistedBio(profile.bio),
    hasAvatar: hasPersistedAvatar(profile.avatar_url),
    hasProfileLink: flags.hasProfileLink,
    hasPublishedProject: flags.hasPublishedProject,
  };
}

/** Identity fields visitors see first — work/publish come after these. */
export const PROFILE_IDENTITY_CRITERIA = [
  'headline',
  'bio',
  'avatar',
  'profileLink',
] as const;

export type HomeLoopState =
  | 'complete_identity'
  | 'create_project'
  | 'publish_card'
  | 'share_card';

function workspacePath(basePath: string, suffix: string): string {
  const base = basePath.replace(/\/$/, '') || '/dashboard';
  if (!suffix) return base;
  if (suffix.startsWith('#')) return `${base}${suffix}`;
  if (suffix.startsWith('/')) return `${base}${suffix}`;
  return `${base}/${suffix}`;
}

function criterionHref(
  id: ProfileCompletionCriterion,
  options: { hasAnyProject: boolean; basePath?: string },
): string {
  const basePath = options.basePath ?? '/dashboard';
  if (id === 'publishedProject') {
    return options.hasAnyProject
      ? workspacePath(basePath, 'work#projects')
      : workspacePath(basePath, 'projects/new');
  }
  if (id === 'headline') return workspacePath(basePath, '#headline');
  if (id === 'bio') return workspacePath(basePath, '#bio');
  if (id === 'avatar') return workspacePath(basePath, '#photo');
  if (id === 'profileLink') return workspacePath(basePath, '#links');
  return workspacePath(basePath, '#profile');
}

export function calculateProfileCompletion(
  input: ProfileCompletionInput,
  options: { hasAnyProject?: boolean } = {},
): ProfileCompletionResult {
  const hasAnyProject = options.hasAnyProject ?? false;
  const values: Record<ProfileCompletionCriterion, boolean> = {
    headline: input.hasHeadline,
    bio: input.hasBio,
    avatar: input.hasAvatar,
    profileLink: input.hasProfileLink,
    publishedProject: input.hasPublishedProject,
  };

  const criteria = PROFILE_COMPLETION_CRITERIA.map((id) => ({
    id,
    label: CRITERION_LABELS[id],
    complete: values[id],
    href: criterionHref(id, { hasAnyProject }),
  }));

  const completedCount = criteria.filter((item) => item.complete).length;
  const percentage = Math.min(100, completedCount * PROFILE_COMPLETION_WEIGHT);

  return {
    percentage,
    completedCount,
    totalCount: PROFILE_COMPLETION_TOTAL,
    criteria,
    incompleteCriteria: criteria.filter((item) => !item.complete).map((item) => item.id),
  };
}

export type HomeWorkspaceNextStep = {
  title: string;
  detail: string;
  href: string;
};

export function getProfileCompletionNextStep(
  completion: ProfileCompletionResult,
  options: { hasAnyProject: boolean; basePath?: string },
): HomeWorkspaceNextStep | null {
  const next = completion.criteria.find((item) => !item.complete);
  if (!next) return null;

  const href = criterionHref(next.id, options);

  switch (next.id) {
    case 'headline':
      return {
        title: 'Add a headline',
        detail: 'Tell visitors what you do in one clear line.',
        href,
      };
    case 'bio':
      return {
        title: 'Write your bio',
        detail: 'Share a short story about your work and focus.',
        href,
      };
    case 'avatar':
      return {
        title: 'Upload your avatar',
        detail: 'A photo helps people recognize your CodeCard instantly.',
        href,
      };
    case 'profileLink':
      return {
        title: 'Add a profile link',
        detail: 'Connect visitors to your site, GitHub, or portfolio.',
        href,
      };
    case 'publishedProject':
      return {
        title: options.hasAnyProject ? 'Publish a project' : 'Create your first project',
        detail: options.hasAnyProject
          ? 'Publish at least one project so visitors can see your work.'
          : 'Add a project, then publish it to complete your profile.',
        href,
      };
    default:
      return null;
  }
}

/**
 * Home loop: identity → first project → publish card → share.
 * Identity uses the existing completion criteria minus publishedProject.
 */
export function isIdentityComplete(completion: ProfileCompletionResult): boolean {
  return PROFILE_IDENTITY_CRITERIA.every(
    (id) => completion.criteria.find((item) => item.id === id)?.complete === true,
  );
}

export function getHomeLoopState(
  completion: ProfileCompletionResult,
  options: { hasAnyProject: boolean; isPublic: boolean },
): HomeLoopState {
  if (!isIdentityComplete(completion)) return 'complete_identity';
  if (!options.hasAnyProject) return 'create_project';
  if (!options.isPublic) return 'publish_card';
  return 'share_card';
}

export function getHomeWorkspaceNextStep(
  completion: ProfileCompletionResult,
  options: { hasAnyProject: boolean; isPublic: boolean; basePath?: string },
): HomeWorkspaceNextStep {
  const basePath = options.basePath ?? '/dashboard';
  const state = getHomeLoopState(completion, options);

  if (state === 'complete_identity') {
    return (
      getProfileCompletionNextStep(completion, options) ?? {
        title: 'Complete your CodeCard',
        detail: 'Add the details visitors see first: headline, bio, photo, and a profile link.',
        href: workspacePath(basePath, '#profile'),
      }
    );
  }

  if (state === 'create_project') {
    return {
      title: 'Create your first project',
      detail: 'One real project is enough. Visitors should see what you have built.',
      href: workspacePath(basePath, 'projects/new'),
    };
  }

  if (state === 'publish_card') {
    return {
      title: 'Publish your CodeCard',
      detail: 'Your card is private. Publish it so shared links and QR codes work for visitors.',
      href: workspacePath(basePath, '#visibility'),
    };
  }

  return {
    title: 'Share your CodeCard',
    detail: 'Copy your public link or download a QR so people can open your card.',
    href: workspacePath(basePath, '#share'),
  };
}

/** Shell Create project stays available; only State B makes it visually primary. */
export function shellCreateProjectEmphasis(
  state: HomeLoopState | null | undefined,
): 'primary' | 'ghost' {
  return state === 'create_project' ? 'primary' : 'ghost';
}

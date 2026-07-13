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

function criterionHref(
  id: ProfileCompletionCriterion,
  options: { hasAnyProject: boolean },
): string {
  if (id === 'publishedProject') {
    return options.hasAnyProject ? '/dashboard/projects' : '/dashboard/projects/new';
  }
  return '/dashboard/profile';
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

export function getProfileCompletionNextStep(
  completion: ProfileCompletionResult,
  options: { hasAnyProject: boolean },
): { title: string; detail: string; href: string } | null {
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

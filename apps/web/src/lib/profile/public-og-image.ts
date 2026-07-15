import {
  normalizePublicMetadataText,
  PUBLIC_OG_IMAGE_HEIGHT,
  PUBLIC_OG_IMAGE_WIDTH,
} from '@/lib/profile/public-metadata';

export const PUBLIC_OG_IMAGE_SIZE = {
  width: PUBLIC_OG_IMAGE_WIDTH,
  height: PUBLIC_OG_IMAGE_HEIGHT,
} as const;

export const PUBLIC_OG_IMAGE_CONTENT_TYPE = 'image/png';
export const PUBLIC_OG_IMAGE_ALT = 'CodeCard';

export type PublicOgCard = {
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  handle?: string | null;
};

export function safeOgLine(value: string | null | undefined, maxLength: number): string {
  return normalizePublicMetadataText(value, maxLength);
}

export function buildGenericPublicOgCard(): PublicOgCard {
  return {
    eyebrow: 'CodeCard',
    title: 'Showcase your work',
    subtitle: 'Profiles, projects, and research — ready to share.',
  };
}

export function buildPublicProfileOgCard(input: {
  displayName: string;
  headline: string | null;
  handle: string;
}): PublicOgCard {
  const handle = safeOgLine(input.handle, 40);
  return {
    eyebrow: 'CodeCard profile',
    title: safeOgLine(input.displayName, 48) || 'CodeCard',
    subtitle: safeOgLine(input.headline, 90) || null,
    handle: handle ? `@${handle}` : null,
  };
}

export function buildPublicProjectOgCard(input: {
  projectTitle: string;
  profileDisplayName: string;
}): PublicOgCard {
  const profileName = safeOgLine(input.profileDisplayName, 48);
  return {
    eyebrow: 'CodeCard project',
    title: safeOgLine(input.projectTitle, 56) || 'Project',
    subtitle: profileName ? `by ${profileName}` : null,
  };
}

export function buildPublicResearchOgCard(input: {
  paperTitle: string;
  profileDisplayName: string;
}): PublicOgCard {
  const profileName = safeOgLine(input.profileDisplayName, 48);
  return {
    eyebrow: 'CodeCard research',
    title: safeOgLine(input.paperTitle, 56) || 'Research',
    subtitle: profileName ? `by ${profileName}` : null,
  };
}

import type { Metadata } from 'next';
import { stripControlChars } from '@/lib/security/sanitize';
import { buildPublicProjectDetailHref } from '@/lib/projects/project-navigation';

export const PUBLIC_METADATA_DESCRIPTION_MAX = 160;
export const PUBLIC_OG_IMAGE_WIDTH = 1200;
export const PUBLIC_OG_IMAGE_HEIGHT = 630;

/** Strip controls, collapse whitespace, and enforce a max length for public metadata text. */
export function normalizePublicMetadataText(
  value: string | null | undefined,
  maxLength = PUBLIC_METADATA_DESCRIPTION_MAX,
): string {
  if (!value) return '';
  // Collapse whitespace first so newlines/tabs become spaces, then drop remaining controls.
  const cleaned = stripControlChars(value.replace(/\s+/g, ' '), false).trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function buildPublicProfilePath(profileSlug: string): string {
  return `/${profileSlug}`;
}

export function buildPublicResearchPath(profileSlug: string, paperSlug: string): string {
  return `/${profileSlug}/research/${paperSlug}`;
}

export function buildPublicOgImagePath(canonicalPath: string): string {
  const base = canonicalPath.endsWith('/') ? canonicalPath.slice(0, -1) : canonicalPath;
  return `${base}/opengraph-image`;
}

function socialImageEntry(canonicalPath: string) {
  return {
    url: buildPublicOgImagePath(canonicalPath),
    width: PUBLIC_OG_IMAGE_WIDTH,
    height: PUBLIC_OG_IMAGE_HEIGHT,
    type: 'image/png' as const,
  };
}

export function buildUnavailablePublicMetadata(
  kind: 'profile' | 'project' | 'research',
): Metadata {
  const title =
    kind === 'profile'
      ? 'Profile not found'
      : kind === 'project'
        ? 'Project not found'
        : 'Research not found';
  const description =
    kind === 'profile'
      ? 'This profile could not be found on CodeCard.'
      : kind === 'project'
        ? 'This project could not be found on CodeCard.'
        : 'This research page could not be found on CodeCard.';

  return {
    title,
    description,
    robots: { index: false, follow: false },
  };
}

export function buildPublicProfileMetadata(input: {
  profileSlug: string;
  displayName: string;
  headline: string | null;
  bio?: string | null;
}): Metadata {
  const displayName = normalizePublicMetadataText(input.displayName, 80) || 'CodeCard';
  const headline = normalizePublicMetadataText(input.headline, PUBLIC_METADATA_DESCRIPTION_MAX);
  const bio = normalizePublicMetadataText(input.bio, PUBLIC_METADATA_DESCRIPTION_MAX);
  const description = headline || bio || `${displayName} on CodeCard`;
  const canonical = buildPublicProfilePath(input.profileSlug);
  const image = socialImageEntry(canonical);

  return {
    title: displayName,
    description,
    alternates: { canonical },
    openGraph: {
      title: displayName,
      description,
      url: canonical,
      type: 'profile',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: displayName,
      description,
      images: [image.url],
    },
  };
}

export function buildPublicProjectMetadata(input: {
  profileSlug: string;
  profileDisplayName: string;
  projectId: string;
  projectTitle: string;
  description: string | null;
}): Metadata {
  const projectTitle = normalizePublicMetadataText(input.projectTitle, 120) || 'Project';
  const profileDisplayName =
    normalizePublicMetadataText(input.profileDisplayName, 80) || 'CodeCard';
  const description =
    normalizePublicMetadataText(input.description) ||
    `${projectTitle} by ${profileDisplayName} on CodeCard`;
  const title = `${projectTitle} · ${profileDisplayName}`;
  const canonical = buildPublicProjectDetailHref(input.profileSlug, input.projectId);
  const image = socialImageEntry(canonical);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  };
}

export function buildPublicResearchPageMetadata(input: {
  profileSlug: string;
  profileDisplayName: string;
  paperSlug: string;
  paperTitle: string;
  abstract: string | null;
}): Metadata {
  const paperTitle = normalizePublicMetadataText(input.paperTitle, 120) || 'Research';
  const profileDisplayName =
    normalizePublicMetadataText(input.profileDisplayName, 80) || 'CodeCard';
  const description =
    normalizePublicMetadataText(input.abstract) ||
    `${paperTitle} by ${profileDisplayName} on CodeCard`;
  const title = `${paperTitle} · ${profileDisplayName}`;
  const canonical = buildPublicResearchPath(input.profileSlug, input.paperSlug);
  const image = socialImageEntry(canonical);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  };
}

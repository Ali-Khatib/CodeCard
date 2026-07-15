import { revalidatePath } from 'next/cache';
import {
  PUBLIC_CACHE_SECONDS,
  PUBLIC_STALE_WHILE_REVALIDATE,
} from '@codecard/config';

/**
 * Central public-route ISR duration (seconds).
 * Time-based revalidation is a fallback; mutations should invalidate immediately.
 */
export function getPublicCacheSeconds(): number {
  return PUBLIC_CACHE_SECONDS;
}

export function getPublicStaleWhileRevalidateSeconds(): number {
  return PUBLIC_STALE_WHILE_REVALIDATE;
}

/** Route segment `revalidate` export value for public pages. */
export const PUBLIC_ROUTE_REVALIDATE_SECONDS = PUBLIC_CACHE_SECONDS;

const SAFE_SEGMENT = /^[a-z0-9][a-z0-9-]{0,62}$/i;
const SAFE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizePublicCacheSegment(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('..')) {
    return null;
  }
  if (SAFE_UUID.test(trimmed)) return trimmed.toLowerCase();
  if (SAFE_SEGMENT.test(trimmed)) return trimmed.toLowerCase();
  return null;
}

export function buildPublicProfilePath(profileSlug: string): string | null {
  const slug = normalizePublicCacheSegment(profileSlug);
  return slug ? `/${slug}` : null;
}

export function buildPublicProjectPath(profileSlug: string, projectId: string): string | null {
  const slug = normalizePublicCacheSegment(profileSlug);
  const id = normalizePublicCacheSegment(projectId);
  if (!slug || !id) return null;
  return `/${slug}/projects/${id}`;
}

export function buildPublicResearchPath(profileSlug: string, paperSlug: string): string | null {
  const slug = normalizePublicCacheSegment(profileSlug);
  const paper = normalizePublicCacheSegment(paperSlug);
  if (!slug || !paper) return null;
  return `/${slug}/research/${paper}`;
}

export function buildPublicOgImagePath(canonicalPath: string): string {
  const base = canonicalPath.endsWith('/') ? canonicalPath.slice(0, -1) : canonicalPath;
  return `${base}/opengraph-image`;
}

/**
 * Conceptual tag names for documentation/tests.
 * Next.js path revalidation is the active mechanism; tags stay namespaced and never client-exposed.
 */
export function publicProfileCacheTag(profileSlug: string): string | null {
  const slug = normalizePublicCacheSegment(profileSlug);
  return slug ? `public-profile-slug:${slug}` : null;
}

export function publicProjectCacheTag(profileSlug: string, projectId: string): string | null {
  const path = buildPublicProjectPath(profileSlug, projectId);
  return path ? `public-project-route:${path.slice(1).replace(/\//g, ':')}` : null;
}

export function publicResearchCacheTag(profileSlug: string, paperSlug: string): string | null {
  const path = buildPublicResearchPath(profileSlug, paperSlug);
  return path ? `public-research-route:${path.slice(1).replace(/\//g, ':')}` : null;
}

function revalidatePublicPath(path: string | null) {
  if (!path) return;
  try {
    revalidatePath(path);
    revalidatePath(buildPublicOgImagePath(path));
  } catch (error) {
    // Mutation already succeeded — time-based ISR remains the fallback.
    console.error('[public-cache] revalidation failed', {
      path,
      message: error instanceof Error ? error.message : 'unknown',
    });
  }
}

/** Invalidate a public profile page, lists on it, and its social image. */
export function revalidatePublicProfile(profileSlug: string) {
  revalidatePublicPath(buildPublicProfilePath(profileSlug));
}

/** Invalidate profile + project detail + social images. */
export function revalidatePublicProject(profileSlug: string, projectId: string) {
  const projectPath = buildPublicProjectPath(profileSlug, projectId);
  if (!projectPath) return;
  revalidatePublicProfile(profileSlug);
  revalidatePublicPath(projectPath);
}

/** Invalidate profile + research detail + social images. */
export function revalidatePublicResearch(profileSlug: string, paperSlug: string) {
  const researchPath = buildPublicResearchPath(profileSlug, paperSlug);
  if (!researchPath) return;
  revalidatePublicProfile(profileSlug);
  revalidatePublicPath(researchPath);
}

/**
 * Invalidate old and new profile routes after a trusted server-side slug change.
 * Does not accept client-supplied old paths as authoritative input beyond persisted values.
 */
export function revalidatePublicProfileSlugChange(input: {
  previousSlug?: string | null;
  nextSlug?: string | null;
}) {
  if (input.previousSlug) {
    revalidatePublicProfile(input.previousSlug);
  }
  if (input.nextSlug && input.nextSlug !== input.previousSlug) {
    revalidatePublicProfile(input.nextSlug);
  }
}

export function revalidatePublicResearchSlugChange(input: {
  profileSlug: string;
  previousSlug?: string | null;
  nextSlug?: string | null;
}) {
  revalidatePublicProfile(input.profileSlug);
  if (input.previousSlug) {
    revalidatePublicPath(buildPublicResearchPath(input.profileSlug, input.previousSlug));
  }
  if (input.nextSlug && input.nextSlug !== input.previousSlug) {
    revalidatePublicPath(buildPublicResearchPath(input.profileSlug, input.nextSlug));
  }
}

export function revalidatePublicProjectNavigation(input: {
  profileSlug: string;
  projectIds: string[];
}) {
  revalidatePublicProfile(input.profileSlug);
  for (const projectId of input.projectIds) {
    revalidatePublicPath(buildPublicProjectPath(input.profileSlug, projectId));
  }
}

import { LIVE_DEMO_ENTRY_HREF } from '@/lib/marketing/site-routes';

/** Signed-out workspace demo — full dashboard preview with sidebar (canonical live demo). */
export const LIVE_DEMO_WORKSPACE_HREF = LIVE_DEMO_ENTRY_HREF;

/**
 * Public profile demo — visitor-facing CodeCard page.
 * Project Back from workspace still routes to `/demo/projects` (see helpers below).
 */
export const LIVE_DEMO_PROFILE_HREF = '/demo/card';

/** Default live demo entry (workspace). */
export const LIVE_DEMO_HREF = LIVE_DEMO_WORKSPACE_HREF;

/** Compatible alias kept for redirects and embed links. */
export const LIVE_DEMO_PREVIEW_ALIAS_HREF = '/dashboard/preview';

/**
 * @deprecated Prefer LIVE_DEMO_PROFILE_HREF.
 */
export const LIVE_DEMO_PROFILE_LEGACY_HREF = LIVE_DEMO_PROFILE_HREF;

/** Public profile path for a slug (`/demo/card` for the demo persona). */
export function publicDemoProfileBasePath(profileSlug: string): string {
  return profileSlug === 'demo' ? LIVE_DEMO_PROFILE_HREF : `/${profileSlug}`;
}

/**
 * Back target from project detail.
 * Demo persona returns to the workspace projects list so workspace → project → Back
 * never dumps visitors on the public profile page unexpectedly.
 */
export function publicDemoProfileProjectsHref(profileSlug: string): string {
  if (profileSlug === 'demo') return `${LIVE_DEMO_WORKSPACE_HREF}/projects`;
  return `${publicDemoProfileBasePath(profileSlug)}#projects`;
}

/**
 * Back target from research detail.
 * Demo persona returns to the workspace research list.
 */
export function publicDemoProfileResearchSectionHref(profileSlug: string): string {
  if (profileSlug === 'demo') return `${LIVE_DEMO_WORKSPACE_HREF}/research`;
  return `${publicDemoProfileBasePath(profileSlug)}#research`;
}

/**
 * Demo project detail URLs stay under `/demo/card/projects/...` (existing detail
 * routes). Back navigation uses `publicDemoProfileProjectsHref` → `/demo/projects`.
 */
export function publicDemoProjectHref(profileSlug: string, projectId: string): string {
  if (profileSlug === 'demo') {
    return `/demo/card/projects/${encodeURIComponent(projectId)}`;
  }
  return `${publicDemoProfileBasePath(profileSlug)}/projects/${encodeURIComponent(projectId)}`;
}

export function publicDemoResearchHref(profileSlug: string, paperSlug: string): string {
  if (profileSlug === 'demo') {
    return `/demo/card/research/${encodeURIComponent(paperSlug)}`;
  }
  return `${publicDemoProfileBasePath(profileSlug)}/research/${encodeURIComponent(paperSlug)}`;
}

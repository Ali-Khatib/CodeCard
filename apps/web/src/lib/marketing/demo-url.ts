import { LIVE_DEMO_ENTRY_HREF } from '@/lib/marketing/site-routes';

/** Signed-out workspace demo — full dashboard preview with sidebar (canonical live demo). */
export const LIVE_DEMO_WORKSPACE_HREF = LIVE_DEMO_ENTRY_HREF;

/**
 * Former public-profile demo path. Kept as a constant so redirects and legacy links
 * resolve to the workspace instead of a separate Alex Chen marketing page.
 */
export const LIVE_DEMO_PROFILE_HREF = LIVE_DEMO_WORKSPACE_HREF;

/** Default live demo entry (workspace). */
export const LIVE_DEMO_HREF = LIVE_DEMO_WORKSPACE_HREF;

/** Compatible alias kept for redirects and embed links. */
export const LIVE_DEMO_PREVIEW_ALIAS_HREF = '/dashboard/preview';

/**
 * @deprecated Prefer LIVE_DEMO_PROFILE_HREF — same path as the workspace demo.
 */
export const LIVE_DEMO_PROFILE_LEGACY_HREF = '/demo/card';

/** Public profile path for a slug (`/demo` workspace for the demo persona). */
export function publicDemoProfileBasePath(profileSlug: string): string {
  return profileSlug === 'demo' ? LIVE_DEMO_WORKSPACE_HREF : `/${profileSlug}`;
}

/**
 * Back target from project detail.
 * Demo persona returns to the workspace projects list — never `/demo/card`.
 */
export function publicDemoProfileProjectsHref(profileSlug: string): string {
  if (profileSlug === 'demo') return `${LIVE_DEMO_WORKSPACE_HREF}/projects`;
  return `${publicDemoProfileBasePath(profileSlug)}#projects`;
}

/**
 * Back target from research detail.
 * Demo persona returns to the workspace research list — never `/demo/card`.
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

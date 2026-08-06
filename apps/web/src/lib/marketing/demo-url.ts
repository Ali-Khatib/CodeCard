import { LIVE_DEMO_ENTRY_HREF } from '@/lib/marketing/site-routes';

/** Signed-out workspace demo — full dashboard preview with sidebar (canonical live demo). */
export const LIVE_DEMO_WORKSPACE_HREF = LIVE_DEMO_ENTRY_HREF;

/** Public profile demo — visitor-facing Alex Chen CodeCard page. */
export const LIVE_DEMO_PROFILE_HREF = '/demo/card';

/** Default live demo entry (workspace). */
export const LIVE_DEMO_HREF = LIVE_DEMO_WORKSPACE_HREF;

/** Compatible alias kept for redirects and embed links. */
export const LIVE_DEMO_PREVIEW_ALIAS_HREF = '/dashboard/preview';

/**
 * @deprecated Prefer LIVE_DEMO_PROFILE_HREF — same path after workspace-first routing.
 */
export const LIVE_DEMO_PROFILE_LEGACY_HREF = LIVE_DEMO_PROFILE_HREF;

/** Public profile path for a slug (`/demo/card` for the Alex Chen demo). */
export function publicDemoProfileBasePath(profileSlug: string): string {
  return profileSlug === 'demo' ? LIVE_DEMO_PROFILE_HREF : `/${profileSlug}`;
}

/** Public profile → Featured work / projects section (back from project detail). */
export function publicDemoProfileProjectsHref(profileSlug: string): string {
  return `${publicDemoProfileBasePath(profileSlug)}#projects`;
}

/** Public profile → research section (back from research detail). */
export function publicDemoProfileResearchSectionHref(profileSlug: string): string {
  return `${publicDemoProfileBasePath(profileSlug)}#research`;
}

export function publicDemoProjectHref(profileSlug: string, projectId: string): string {
  return `${publicDemoProfileBasePath(profileSlug)}/projects/${encodeURIComponent(projectId)}`;
}

export function publicDemoResearchHref(profileSlug: string, paperSlug: string): string {
  return `${publicDemoProfileBasePath(profileSlug)}/research/${encodeURIComponent(paperSlug)}`;
}

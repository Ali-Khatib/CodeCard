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

/** Where a project/research detail was opened from — drives the Back target. */
export type PublicDetailFrom = 'preview' | 'projects' | 'research';

export function appendDetailFrom(href: string, from: PublicDetailFrom): string {
  const join = href.includes('?') ? '&' : '?';
  return `${href}${join}from=${from}`;
}

export function parseDetailFrom(value: string | null | undefined): PublicDetailFrom | null {
  if (value === 'preview' || value === 'projects' || value === 'research') return value;
  return null;
}

/**
 * Back target from project detail.
 * Demo persona returns to the workspace projects list so workspace → project → Back
 * never dumps visitors on the public profile page unexpectedly.
 * Authenticated owners editing from the dashboard should pass `backHref` explicitly
 * (e.g. `/dashboard/projects`).
 */
export function publicDemoProfileProjectsHref(profileSlug: string): string {
  if (profileSlug === 'demo') return `${LIVE_DEMO_WORKSPACE_HREF}/work#projects`;
  // Prefer the public profile projects section for visitor browsing.
  return `${publicDemoProfileBasePath(profileSlug)}#projects`;
}

/**
 * Back target from research detail.
 * Demo persona returns to the workspace research list.
 */
export function publicDemoProfileResearchSectionHref(profileSlug: string): string {
  if (profileSlug === 'demo') return `${LIVE_DEMO_WORKSPACE_HREF}/work#research`;
  return `${publicDemoProfileBasePath(profileSlug)}#research`;
}

/** Public CodeCard preview root (stacking projects / research on the card). */
export function publicDemoProfilePreviewHref(profileSlug: string, hash?: 'projects' | 'research'): string {
  const base = publicDemoProfileBasePath(profileSlug);
  return hash ? `${base}#${hash}` : base;
}

export function resolveProjectDetailBack(
  profileSlug: string,
  from?: string | null,
): { href: string; label: string } {
  const source = parseDetailFrom(from);
  if (source === 'preview') {
    return { href: publicDemoProfilePreviewHref(profileSlug, 'projects'), label: 'Preview' };
  }
  return { href: publicDemoProfileProjectsHref(profileSlug), label: 'Projects' };
}

export function resolveResearchDetailBack(
  profileSlug: string,
  from?: string | null,
): { href: string; label: string } {
  const source = parseDetailFrom(from);
  if (source === 'preview') {
    return { href: publicDemoProfilePreviewHref(profileSlug, 'research'), label: 'Preview' };
  }
  return { href: publicDemoProfileResearchSectionHref(profileSlug), label: 'Research' };
}

/**
 * Demo project detail URLs stay under `/demo/card/projects/...` (existing detail
 * routes). Pass `from` so Back returns to preview vs projects tab correctly.
 */
export function publicDemoProjectHref(
  profileSlug: string,
  projectId: string,
  from?: PublicDetailFrom,
): string {
  const path =
    profileSlug === 'demo'
      ? `/demo/card/projects/${encodeURIComponent(projectId)}`
      : `${publicDemoProfileBasePath(profileSlug)}/projects/${encodeURIComponent(projectId)}`;
  return from ? appendDetailFrom(path, from) : path;
}

export function publicDemoResearchHref(
  profileSlug: string,
  paperSlug: string,
  from?: PublicDetailFrom,
): string {
  const path =
    profileSlug === 'demo'
      ? `/demo/card/research/${encodeURIComponent(paperSlug)}`
      : `${publicDemoProfileBasePath(profileSlug)}/research/${encodeURIComponent(paperSlug)}`;
  return from ? appendDetailFrom(path, from) : path;
}

/** True for the signed-out `/demo` workspace (sample data, no mutations). */
export function isDemoWorkspacePath(basePath: string): boolean {
  return basePath === '/demo' || basePath.startsWith('/demo/');
}

function signInToDashboard(path: string): string {
  return `/sign-in?redirect=${encodeURIComponent(path)}`;
}

/** Create-project CTA: live dashboard route, or sign-in from the demo workspace. */
export function workspaceCreateProjectHref(basePath: string): string {
  if (isDemoWorkspacePath(basePath)) return signInToDashboard('/dashboard/projects/new');
  return `${basePath}/projects/new`;
}

/** Create-research CTA: live dashboard route, or sign-in from the demo workspace. */
export function workspaceCreateResearchHref(basePath: string): string {
  if (isDemoWorkspacePath(basePath)) return signInToDashboard('/dashboard/research/new');
  return `${basePath}/research/new`;
}

/** Profile section CTA — Home now hosts the editor. */
export function workspaceProfileHref(basePath: string, hash?: string): string {
  const root = isDemoWorkspacePath(basePath) ? LIVE_DEMO_WORKSPACE_HREF : basePath;
  return hash ? `${root}#${hash}` : `${root}#profile`;
}

/** Combined Projects + Research destination. */
export function workspaceWorkHref(basePath: string, hash?: 'projects' | 'research'): string {
  const root = isDemoWorkspacePath(basePath) ? LIVE_DEMO_WORKSPACE_HREF : basePath;
  const path = `${root}/work`;
  return hash ? `${path}#${hash}` : path;
}

/** Project edit CTA; demo has no edit routes. */
export function workspaceProjectEditHref(basePath: string, projectId: string): string {
  if (isDemoWorkspacePath(basePath)) {
    return signInToDashboard(`/dashboard/projects`);
  }
  return `${basePath}/projects/${projectId}/edit`;
}

/** Research edit CTA; demo has no edit routes. */
export function workspaceResearchEditHref(basePath: string, paperId: string): string {
  if (isDemoWorkspacePath(basePath)) {
    return signInToDashboard('/dashboard/research');
  }
  return `${basePath}/research/${paperId}/edit`;
}

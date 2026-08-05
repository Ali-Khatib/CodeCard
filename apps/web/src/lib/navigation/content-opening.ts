export type ContentOpeningKind = 'project' | 'research';

export type ContentOpeningState = {
  kind: ContentOpeningKind;
  title: string;
  href: string;
};

export const CONTENT_OPENING_MIN_MS = 400;
export const CONTENT_OPENING_FAILSAFE_MS = 8000;

export function contentOpeningHeadline(kind: ContentOpeningKind): string {
  return kind === 'project' ? 'Opening project' : 'Opening research';
}

export function contentOpeningTitle(
  kind: ContentOpeningKind,
  title?: string | null,
): string {
  const trimmed = title?.trim();
  if (trimmed) return trimmed;
  return kind === 'project' ? 'Your project' : 'Your research';
}

/** True for unmodified primary (left) clicks that should use in-app navigation. */
export function shouldInterceptContentOpeningClick(event: {
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  defaultPrevented?: boolean;
}): boolean {
  if (event.defaultPrevented) return false;
  if (event.button != null && event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  return true;
}

function stripOrigin(href: string): string | null {
  const value = href.trim();
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')) {
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(value, window.location.origin);
        if (url.origin !== window.location.origin) return null;
        return `${url.pathname}${url.search}`;
      }
      return null;
    } catch {
      return null;
    }
  }
  if (value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('#')) {
    return null;
  }
  return value.startsWith('/') ? value.split('#')[0] ?? value : null;
}

/**
 * Internal project/research detail or edit destinations — not list pages, /new, or externals.
 */
export function resolveContentOpeningKind(href: string): ContentOpeningKind | null {
  const path = stripOrigin(href);
  if (!path) return null;

  const project = path.match(
    /^\/(?:dashboard(?:\/preview)?|demo(?:\/card)?|[^/]+)\/projects\/(?!new(?:\/|$))[^/]+(?:\/edit)?\/?(?:\?.*)?$/i,
  );
  if (project) return 'project';

  const research = path.match(
    /^\/(?:dashboard(?:\/preview)?|demo(?:\/card)?|[^/]+)\/research\/(?!new(?:\/|$))[^/]+(?:\/edit)?\/?(?:\?.*)?$/i,
  );
  if (research) return 'research';

  return null;
}

export function normalizeContentOpeningHref(href: string): string {
  const path = stripOrigin(href);
  if (!path) return href;
  const bare = path.split('?')[0] ?? path;
  return bare.endsWith('/') && bare.length > 1 ? bare.slice(0, -1) : bare;
}

export function contentOpeningMatchesPath(
  openingHref: string,
  pathname: string,
): boolean {
  return normalizeContentOpeningHref(openingHref) === normalizeContentOpeningHref(pathname);
}

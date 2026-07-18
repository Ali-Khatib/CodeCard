import { isObviousAnalyticsBot } from '@/lib/analytics/bot-filter';
import {
  LIVE_DEMO_ENTRY_HREF,
  MARKETING_HOME_HREF,
} from '@/lib/marketing/site-routes';

export const VISITOR_CONVERSION_DELAY_MS = 8_000;
export const VISITOR_CONVERSION_SHOWN_KEY = 'codecard:visitor-conversion:shown';
export const VISITOR_CONVERSION_SHOWN_VALUE = 'true';

export const VISITOR_CONVERSION_CONTEXTS = ['landing', 'live_demo'] as const;

export type VisitorConversionContext = (typeof VISITOR_CONVERSION_CONTEXTS)[number];

/** Marker contexts on published pages. Markers no longer drive prompt eligibility. */
export const VISITOR_CONVERSION_MARKER_CONTEXTS = [
  'live_demo',
  'public_profile',
  'public_project',
  'public_research',
] as const;

export type VisitorConversionMarkerContext =
  (typeof VISITOR_CONVERSION_MARKER_CONTEXTS)[number];

export type VisitorConversionRoute = {
  context: VisitorConversionContext;
  referrer: string | null;
  profileId: string | null;
};

export type VisitorConversionMarkerData = {
  context?: string | null;
  referrer?: string | null;
  profileId?: string | null;
};

export type VisitorStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

/** Public landing page — marketing home (mvp: `/landing`). */
export const VISITOR_CONVERSION_LANDING_PATH = MARKETING_HOME_HREF;

/** Live demo entry page — signed-out workspace preview. Nested preview routes are excluded. */
export const VISITOR_CONVERSION_LIVE_DEMO_ENTRY_PATH = LIVE_DEMO_ENTRY_HREF;

const EXCLUDED_PATH_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/admin',
  '/legal',
  '/api',
  '/e2e-fixtures',
] as const;

const SIGNUP_SOURCE_BY_CONTEXT: Record<VisitorConversionContext, string> = {
  landing: 'marketing',
  live_demo: 'demo',
};

const REFERRER_RE = /^[A-Za-z0-9][A-Za-z0-9/_-]*$/;
const MAX_REFERRER_LENGTH = 120;
const MAX_INTERNAL_PATH_LENGTH = 512;

export function isVisitorConversionContext(
  value: unknown,
): value is VisitorConversionContext {
  return (
    typeof value === 'string' &&
    (VISITOR_CONVERSION_CONTEXTS as readonly string[]).includes(value)
  );
}

export function isExcludedVisitorConversionPath(pathname: string): boolean {
  if (!pathname.startsWith('/')) return true;
  if (
    pathname === '/dashboard' ||
    (pathname.startsWith('/dashboard/') &&
      pathname !== VISITOR_CONVERSION_LIVE_DEMO_ENTRY_PATH &&
      !pathname.startsWith(`${VISITOR_CONVERSION_LIVE_DEMO_ENTRY_PATH}/`))
  ) {
    return true;
  }
  return EXCLUDED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function sanitizeVisitorReferrer(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim().replace(/^\/+|\/+$/g, '');
  if (
    !value ||
    value.length > MAX_REFERRER_LENGTH ||
    !REFERRER_RE.test(value) ||
    value.includes('//')
  ) {
    return null;
  }
  return value;
}

export function sanitizeInternalNextPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > MAX_INTERNAL_PATH_LENGTH) return null;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return null;
  if (/[\u0000-\u001F\u007F]/.test(raw)) return null;

  let decoded = raw;
  for (let index = 0; index < 3; index += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      return null;
    }
  }

  if (
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded.includes('\\') ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/.test(decoded.replace(/^\/+/, ''))
  ) {
    return null;
  }
  return raw;
}

/**
 * Eligible only on the public landing page and the live-demo entry page.
 * Nested preview routes, marketing subpages, public profiles, and marker-backed
 * detail routes are intentionally excluded.
 */
export function resolveVisitorConversionRoute(input: {
  pathname: string;
  searchParams?: URLSearchParams | null;
  marker?: VisitorConversionMarkerData | null;
}): VisitorConversionRoute | null {
  const { pathname } = input;
  if (isExcludedVisitorConversionPath(pathname)) return null;

  if (pathname === VISITOR_CONVERSION_LANDING_PATH) {
    return { context: 'landing', referrer: 'landing', profileId: null };
  }

  if (pathname === VISITOR_CONVERSION_LIVE_DEMO_ENTRY_PATH) {
    return { context: 'live_demo', referrer: 'demo', profileId: null };
  }

  return null;
}

export function buildVisitorConversionCtaHrefs(input: {
  route: VisitorConversionRoute;
  pathname: string;
}): { signupHref: string; signinHref: string } {
  const source = SIGNUP_SOURCE_BY_CONTEXT[input.route.context];
  const signup = new URLSearchParams({ source });
  if (input.route.referrer) signup.set('referrer', input.route.referrer);

  const signin = new URLSearchParams({ source });
  const safeNext = sanitizeInternalNextPath(input.pathname);
  if (safeNext) signin.set('next', safeNext);

  return {
    signupHref: `/sign-up?${signup.toString()}`,
    signinHref: `/sign-in?${signin.toString()}`,
  };
}

export function readVisitorStorage(storage: VisitorStorage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function writeVisitorStorage(
  storage: VisitorStorage,
  key: string,
  value: string,
): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** True when this browser-tab session has already shown the prompt. */
export function hasVisitorConversionBeenShown(storage: VisitorStorage): boolean {
  return (
    readVisitorStorage(storage, VISITOR_CONVERSION_SHOWN_KEY) ===
    VISITOR_CONVERSION_SHOWN_VALUE
  );
}

/**
 * Mark the prompt as shown for this browser-tab session.
 * Call only when the box actually becomes visible — never when the timer starts.
 */
export function markVisitorConversionShown(storage: VisitorStorage): boolean {
  return writeVisitorStorage(
    storage,
    VISITOR_CONVERSION_SHOWN_KEY,
    VISITOR_CONVERSION_SHOWN_VALUE,
  );
}

export function isValidStoreUrl(raw: string | null | undefined): raw is string {
  if (!raw || raw === '#' || /placeholder/i.test(raw)) return false;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return false;
    if (
      parsed.hostname === 'example.com' ||
      parsed.hostname.endsWith('.example.com') ||
      parsed.hostname === 'localhost'
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function resolveStoreLinks(input: {
  ios?: string | null;
  android?: string | null;
}): { ios: string | null; android: string | null } {
  return {
    ios: isValidStoreUrl(input.ios) ? input.ios : null,
    android: isValidStoreUrl(input.android) ? input.android : null,
  };
}

export function detectVisitorPlatform(
  userAgent: string,
): 'ios' | 'android' | 'desktop' {
  if (/android/i.test(userAgent)) return 'android';
  if (/iPad|iPhone|iPod/i.test(userAgent)) return 'ios';
  return 'desktop';
}

export function selectStoreLinksForPlatform(
  links: { ios: string | null; android: string | null },
  platform: 'ios' | 'android' | 'desktop',
): Array<{ platform: 'ios' | 'android'; label: string; href: string }> {
  if (platform === 'ios' && links.ios) {
    return [{ platform: 'ios', label: 'Get the iOS app', href: links.ios }];
  }
  if (platform === 'android' && links.android) {
    return [{ platform: 'android', label: 'Get the Android app', href: links.android }];
  }
  return [
    ...(links.ios ? [{ platform: 'ios' as const, label: 'iOS app', href: links.ios }] : []),
    ...(links.android
      ? [{ platform: 'android' as const, label: 'Android app', href: links.android }]
      : []),
  ];
}

export function isAutomatedVisitor(input: {
  userAgent?: string | null;
  webdriver?: boolean;
  allowTestOverride?: boolean;
}): boolean {
  if (input.allowTestOverride) return false;
  if (input.webdriver) return true;
  return isObviousAnalyticsBot(input.userAgent);
}

type VisibleDocument = {
  visibilityState: DocumentVisibilityState;
  addEventListener(type: 'visibilitychange', listener: () => void): void;
  removeEventListener(type: 'visibilitychange', listener: () => void): void;
};

export function startVisibleDelay(input: {
  document: VisibleDocument;
  onElapsed: () => void;
  delayMs?: number;
  now?: () => number;
  setTimer?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
}): () => void {
  const delayMs = input.delayMs ?? VISITOR_CONVERSION_DELAY_MS;
  const now = input.now ?? Date.now;
  const setTimer = input.setTimer ?? setTimeout;
  const clearTimer = input.clearTimer ?? clearTimeout;
  let remaining = delayMs;
  let visibleSince: number | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const cancelTimer = () => {
    if (timer !== null) {
      clearTimer(timer);
      timer = null;
    }
  };

  const pause = () => {
    if (visibleSince !== null) {
      remaining = Math.max(0, remaining - (now() - visibleSince));
      visibleSince = null;
    }
    cancelTimer();
  };

  const schedule = () => {
    if (stopped || input.document.visibilityState !== 'visible') return;
    visibleSince = now();
    timer = setTimer(() => {
      timer = null;
      visibleSince = null;
      stopped = true;
      input.document.removeEventListener('visibilitychange', onVisibilityChange);
      input.onElapsed();
    }, remaining);
  };

  function onVisibilityChange() {
    if (input.document.visibilityState === 'visible') {
      schedule();
    } else {
      pause();
    }
  }

  input.document.addEventListener('visibilitychange', onVisibilityChange);
  schedule();

  return () => {
    stopped = true;
    pause();
    input.document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

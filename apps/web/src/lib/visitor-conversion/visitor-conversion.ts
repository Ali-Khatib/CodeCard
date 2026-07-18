import { isObviousAnalyticsBot } from '@/lib/analytics/bot-filter';

export const VISITOR_CONVERSION_DELAY_MS = 8_000;
export const VISITOR_CONVERSION_DISMISSAL_MS = 7 * 24 * 60 * 60 * 1_000;
export const VISITOR_CONVERSION_SHOWN_KEY = 'codecard:visitor-conversion:shown';
export const VISITOR_CONVERSION_DISMISSED_AT_KEY =
  'codecard:visitor-conversion:dismissed-at';

export const VISITOR_CONVERSION_CONTEXTS = [
  'landing',
  'pricing',
  'live_demo',
  'public_profile',
  'public_project',
  'public_research',
  'qr_profile',
] as const;

export type VisitorConversionContext = (typeof VISITOR_CONVERSION_CONTEXTS)[number];

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

const MARKETING_PATH_CONTEXTS = new Map<string, VisitorConversionContext>([
  ['/landing', 'landing'],
  ['/how-it-works', 'landing'],
  ['/profiles', 'landing'],
  ['/research', 'landing'],
  ['/research/references', 'landing'],
  ['/pricing', 'pricing'],
]);

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
  pricing: 'pricing',
  live_demo: 'demo',
  public_profile: 'public_profile',
  public_project: 'public_project',
  public_research: 'public_research',
  qr_profile: 'qr',
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
    (pathname.startsWith('/dashboard/') && !pathname.startsWith('/dashboard/preview'))
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

export function resolveVisitorConversionRoute(input: {
  pathname: string;
  searchParams?: URLSearchParams | null;
  marker?: VisitorConversionMarkerData | null;
}): VisitorConversionRoute | null {
  const { pathname, marker } = input;
  if (isExcludedVisitorConversionPath(pathname)) return null;

  if (pathname === '/dashboard/preview' || pathname.startsWith('/dashboard/preview/')) {
    return { context: 'live_demo', referrer: 'demo', profileId: null };
  }

  const marketingContext = MARKETING_PATH_CONTEXTS.get(pathname);
  if (marketingContext) {
    return {
      context: marketingContext,
      referrer: marketingContext === 'pricing' ? 'pricing' : 'landing',
      profileId: null,
    };
  }

  if (!marker || !isVisitorConversionContext(marker.context)) return null;
  const markerContext = marker.context;
  const isQrProfile =
    markerContext === 'public_profile' && input.searchParams?.get('source') === 'qr';

  return {
    context: isQrProfile ? 'qr_profile' : markerContext,
    referrer: sanitizeVisitorReferrer(marker.referrer),
    profileId:
      typeof marker.profileId === 'string' && marker.profileId.length <= 64
        ? marker.profileId
        : null,
  };
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

export function parseDismissedAt(raw: string | null, now = Date.now()): number | null {
  if (!raw || !/^\d{10,16}$/.test(raw)) return null;
  const timestamp = Number(raw);
  if (!Number.isFinite(timestamp) || timestamp <= 0 || timestamp > now) return null;
  return timestamp;
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

export function isVisitorConversionDismissed(
  raw: string | null,
  now = Date.now(),
): boolean {
  const dismissedAt = parseDismissedAt(raw, now);
  return dismissedAt !== null && now - dismissedAt < VISITOR_CONVERSION_DISMISSAL_MS;
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

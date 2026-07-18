import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  VISITOR_CONVERSION_DELAY_MS,
  VISITOR_CONVERSION_SHOWN_KEY,
  VISITOR_CONVERSION_SHOWN_VALUE,
  buildVisitorConversionCtaHrefs,
  hasVisitorConversionBeenShown,
  isAutomatedVisitor,
  isValidStoreUrl,
  markVisitorConversionShown,
  readVisitorStorage,
  resolveStoreLinks,
  resolveVisitorConversionRoute,
  sanitizeInternalNextPath,
  selectStoreLinksForPlatform,
  startVisibleDelay,
  writeVisitorStorage,
} from './visitor-conversion';

class FakeVisibleDocument {
  visibilityState: DocumentVisibilityState = 'visible';
  private listeners = new Set<() => void>();

  addEventListener(_type: 'visibilitychange', listener: () => void) {
    this.listeners.add(listener);
  }

  removeEventListener(_type: 'visibilitychange', listener: () => void) {
    this.listeners.delete(listener);
  }

  setVisibility(next: DocumentVisibilityState) {
    this.visibilityState = next;
    for (const listener of this.listeners) listener();
  }
}

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  clear() {
    this.data.clear();
  }
}

afterEach(() => {
  vi.useRealTimers();
});

describe('visitor conversion route eligibility', () => {
  it('allows only the public landing page and live-demo entry page', () => {
    expect(resolveVisitorConversionRoute({ pathname: '/landing' })?.context).toBe('landing');
    expect(resolveVisitorConversionRoute({ pathname: '/dashboard/preview' })?.context).toBe(
      'live_demo',
    );
  });

  it.each([
    '/how-it-works',
    '/profiles',
    '/research',
    '/research/references',
    '/pricing',
    '/dashboard/preview/projects',
    '/dashboard/preview/research',
    '/demo/card',
    '/alex',
    '/alex/projects/11111111-1111-4111-8111-111111111111',
    '/alex/research/paper',
  ])('never shows on non-entry route %s', (pathname) => {
    expect(resolveVisitorConversionRoute({ pathname })).toBeNull();
    expect(
      resolveVisitorConversionRoute({
        pathname,
        marker: { context: 'live_demo', referrer: 'demo' },
      }),
    ).toBeNull();
  });

  it.each([
    '/sign-in',
    '/sign-up',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
    '/dashboard',
    '/dashboard/projects',
    '/admin',
    '/legal/privacy',
    '/legal/dmca',
    '/e2e-fixtures/public-report',
  ])('excludes %s', (pathname) => {
    expect(resolveVisitorConversionRoute({ pathname })).toBeNull();
  });

  it('does not infer unpublished, not-found, or error content from a dynamic path', () => {
    expect(resolveVisitorConversionRoute({ pathname: '/missing-profile' })).toBeNull();
    expect(
      resolveVisitorConversionRoute({ pathname: '/missing-profile/projects/missing' }),
    ).toBeNull();
  });
});

describe('visitor conversion timing', () => {
  it('fires at eight seconds, not before', () => {
    vi.useFakeTimers();
    const document = new FakeVisibleDocument();
    const elapsed = vi.fn();
    const stop = startVisibleDelay({ document, onElapsed: elapsed });

    vi.advanceTimersByTime(VISITOR_CONVERSION_DELAY_MS - 1);
    expect(elapsed).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(elapsed).toHaveBeenCalledOnce();
    stop();
  });

  it('does not count hidden-tab time', () => {
    vi.useFakeTimers();
    const document = new FakeVisibleDocument();
    const elapsed = vi.fn();
    startVisibleDelay({ document, onElapsed: elapsed });

    vi.advanceTimersByTime(3_000);
    document.setVisibility('hidden');
    vi.advanceTimersByTime(20_000);
    expect(elapsed).not.toHaveBeenCalled();
    document.setVisibility('visible');
    vi.advanceTimersByTime(4_999);
    expect(elapsed).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(elapsed).toHaveBeenCalledOnce();
  });

  it('defers the full delay when starting hidden and cancels cleanly', () => {
    vi.useFakeTimers();
    const document = new FakeVisibleDocument();
    document.setVisibility('hidden');
    const elapsed = vi.fn();
    const stop = startVisibleDelay({ document, onElapsed: elapsed });
    vi.advanceTimersByTime(20_000);
    expect(elapsed).not.toHaveBeenCalled();
    document.setVisibility('visible');
    stop();
    vi.advanceTimersByTime(VISITOR_CONVERSION_DELAY_MS);
    expect(elapsed).not.toHaveBeenCalled();
  });
});

describe('visitor conversion sessionStorage once-per-tab-session', () => {
  it('uses exactly one shared sessionStorage key with value true', () => {
    expect(VISITOR_CONVERSION_SHOWN_KEY).toBe('codecard:visitor-conversion:shown');
    expect(VISITOR_CONVERSION_SHOWN_VALUE).toBe('true');
  });

  it('sets the key only when markVisitorConversionShown runs (visibility moment)', () => {
    const storage = new MemoryStorage();
    expect(hasVisitorConversionBeenShown(storage)).toBe(false);
    expect(storage.getItem(VISITOR_CONVERSION_SHOWN_KEY)).toBeNull();

    markVisitorConversionShown(storage);
    expect(hasVisitorConversionBeenShown(storage)).toBe(true);
    expect(storage.getItem(VISITOR_CONVERSION_SHOWN_KEY)).toBe('true');
  });

  it('landing and live demo share the same suppression key', () => {
    const storage = new MemoryStorage();
    markVisitorConversionShown(storage);
    // Same key suppresses both routes — route resolver remains eligible, storage blocks show.
    expect(resolveVisitorConversionRoute({ pathname: '/landing' })?.context).toBe('landing');
    expect(resolveVisitorConversionRoute({ pathname: '/dashboard/preview' })?.context).toBe(
      'live_demo',
    );
    expect(hasVisitorConversionBeenShown(storage)).toBe(true);
  });

  it('a fresh storage (new mocked tab session) is eligible again', () => {
    const firstTab = new MemoryStorage();
    markVisitorConversionShown(firstTab);
    expect(hasVisitorConversionBeenShown(firstTab)).toBe(true);

    const secondTab = new MemoryStorage();
    expect(hasVisitorConversionBeenShown(secondTab)).toBe(false);
  });

  it('does not treat other values as shown', () => {
    const storage = new MemoryStorage();
    storage.setItem(VISITOR_CONVERSION_SHOWN_KEY, '1');
    expect(hasVisitorConversionBeenShown(storage)).toBe(false);
  });
});

describe('visitor conversion CTA and safety', () => {
  it('rejects external, protocol-relative, encoded external, and malformed next paths', () => {
    expect(sanitizeInternalNextPath('/alex/projects/one')).toBe('/alex/projects/one');
    expect(sanitizeInternalNextPath('https://evil.test')).toBeNull();
    expect(sanitizeInternalNextPath('//evil.test')).toBeNull();
    expect(sanitizeInternalNextPath('/%2F%2Fevil.test')).toBeNull();
    expect(sanitizeInternalNextPath('/https%3A%2F%2Fevil.test')).toBeNull();
    expect(sanitizeInternalNextPath('/\\evil.test')).toBeNull();
  });

  it('builds allowlisted internal signup and sign-in destinations', () => {
    const hrefs = buildVisitorConversionCtaHrefs({
      route: {
        context: 'live_demo',
        referrer: 'demo',
        profileId: null,
      },
      pathname: '/dashboard/preview',
    });
    expect(hrefs.signupHref).toBe('/sign-up?source=demo&referrer=demo');
    expect(hrefs.signinHref).toBe('/sign-in?source=demo&next=%2Fdashboard%2Fpreview');
  });

  it('accepts only real HTTPS store links and hides missing links', () => {
    expect(isValidStoreUrl('https://apps.apple.com/app/codecard/id123')).toBe(true);
    expect(isValidStoreUrl('http://apps.apple.com/app/codecard')).toBe(false);
    expect(isValidStoreUrl('https://example.com/app')).toBe(false);
    expect(isValidStoreUrl('#')).toBe(false);
    expect(resolveStoreLinks({})).toEqual({ ios: null, android: null });
  });

  it('selects the matching mobile store and gives desktop a clear chooser', () => {
    const links = {
      ios: 'https://apps.apple.com/app/codecard/id123',
      android: 'https://play.google.com/store/apps/details?id=app.codecard',
    };
    expect(selectStoreLinksForPlatform(links, 'ios')).toEqual([
      { platform: 'ios', label: 'Get the iOS app', href: links.ios },
    ]);
    expect(selectStoreLinksForPlatform(links, 'android')).toEqual([
      { platform: 'android', label: 'Get the Android app', href: links.android },
    ]);
    expect(selectStoreLinksForPlatform(links, 'desktop')).toHaveLength(2);
    expect(
      selectStoreLinksForPlatform({ ios: links.ios, android: null }, 'android'),
    ).toEqual([{ platform: 'ios', label: 'iOS app', href: links.ios }]);
  });

  it('excludes automated traffic unless the test override is explicit', () => {
    expect(isAutomatedVisitor({ webdriver: true })).toBe(true);
    expect(isAutomatedVisitor({ userAgent: 'Googlebot/2.1' })).toBe(true);
    expect(isAutomatedVisitor({ webdriver: true, allowTestOverride: true })).toBe(false);
  });

  it('remains usable when browser storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readVisitorStorage(blocked, 'key')).toBeNull();
    expect(writeVisitorStorage(blocked, 'key', 'value')).toBe(false);
    expect(hasVisitorConversionBeenShown(blocked)).toBe(false);
    expect(markVisitorConversionShown(blocked)).toBe(false);
  });
});

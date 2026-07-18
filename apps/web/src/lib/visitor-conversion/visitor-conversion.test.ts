import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  VISITOR_CONVERSION_DELAY_MS,
  VISITOR_CONVERSION_DISMISSAL_MS,
  buildVisitorConversionCtaHrefs,
  isAutomatedVisitor,
  isValidStoreUrl,
  isVisitorConversionDismissed,
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

afterEach(() => {
  vi.useRealTimers();
});

describe('visitor conversion route eligibility', () => {
  it.each([
    ['/', 'landing'],
    ['/landing', 'landing'],
    ['/how-it-works', 'landing'],
    ['/profiles', 'landing'],
    ['/research', 'landing'],
    ['/pricing', 'pricing'],
    ['/dashboard/preview', 'live_demo'],
    ['/dashboard/preview/projects', 'live_demo'],
  ])('allows public exploration route %s', (pathname, context) => {
    expect(resolveVisitorConversionRoute({ pathname })?.context).toBe(context);
  });

  it.each([
    ['/alex', 'public_profile'],
    ['/alex/projects/11111111-1111-4111-8111-111111111111', 'public_project'],
    ['/alex/research/paper', 'public_research'],
    ['/demo/card', 'live_demo'],
  ])('requires a successful public marker for %s', (pathname, context) => {
    expect(resolveVisitorConversionRoute({ pathname })).toBeNull();
    expect(
      resolveVisitorConversionRoute({
        pathname,
        marker: { context, referrer: pathname.slice(1) },
      })?.context,
    ).toBe(context);
  });

  it('recognizes only the fixed QR source on a public profile', () => {
    const marker = { context: 'public_profile', referrer: 'alex' };
    expect(
      resolveVisitorConversionRoute({
        pathname: '/alex',
        marker,
        searchParams: new URLSearchParams('source=qr'),
      })?.context,
    ).toBe('qr_profile');
    expect(
      resolveVisitorConversionRoute({
        pathname: '/alex',
        marker,
        searchParams: new URLSearchParams('source=anything'),
      })?.context,
    ).toBe('public_profile');
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

describe('visitor conversion suppression and safety', () => {
  it('suppresses for seven days and returns at the boundary', () => {
    const now = 2_000_000_000_000;
    expect(isVisitorConversionDismissed(String(now - 1), now)).toBe(true);
    expect(
      isVisitorConversionDismissed(
        String(now - VISITOR_CONVERSION_DISMISSAL_MS + 1),
        now,
      ),
    ).toBe(true);
    expect(
      isVisitorConversionDismissed(String(now - VISITOR_CONVERSION_DISMISSAL_MS), now),
    ).toBe(false);
  });

  it.each(['', 'nope', '-1', 'NaN', '9999999999999999'])(
    'fails open for malformed dismissal value %s',
    (value) => {
      expect(isVisitorConversionDismissed(value, 2_000_000_000_000)).toBe(false);
    },
  );

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
        context: 'public_project',
        referrer: 'alex/projects/project-one',
        profileId: null,
      },
      pathname: '/alex/projects/project-one',
    });
    expect(hrefs.signupHref).toBe(
      '/sign-up?source=public_project&referrer=alex%2Fprojects%2Fproject-one',
    );
    expect(hrefs.signinHref).toBe(
      '/sign-in?source=public_project&next=%2Falex%2Fprojects%2Fproject-one',
    );
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
    expect(
      isAutomatedVisitor({ webdriver: true, allowTestOverride: true }),
    ).toBe(false);
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
  });
});

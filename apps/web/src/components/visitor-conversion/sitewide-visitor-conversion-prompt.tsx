'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { HiOutlineArrowUpRight } from 'react-icons/hi2';
import { createClient } from '@/lib/supabase/client';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { trackVisitorConversionEvent } from '@/lib/analytics/visitor-conversion';
import {
  buildVisitorConversionCtaHrefs,
  detectVisitorPlatform,
  hasVisitorConversionBeenShown,
  isAutomatedVisitor,
  markVisitorConversionShown,
  resolveStoreLinks,
  resolveVisitorConversionRoute,
  selectStoreLinksForPlatform,
  startVisibleDelay,
  type VisitorConversionRoute,
} from '@/lib/visitor-conversion/visitor-conversion';

declare global {
  interface Window {
    __CODECARD_E2E_ALLOW_VISITOR_PROMPT__?: boolean;
  }
}

/** Runtime guard against Strict Mode / duplicate mounts within one JS realm. */
let shownDuringRuntime = false;

function markerFromDocument(): {
  context: string | null;
  referrer: string | null;
  profileId: string | null;
} | null {
  const marker = document.querySelector<HTMLElement>('[data-visitor-conversion-context]');
  if (!marker) return null;
  return {
    context: marker.dataset.visitorConversionContext ?? null,
    referrer: marker.dataset.visitorConversionReferrer ?? null,
    profileId: marker.dataset.visitorConversionProfileId ?? null,
  };
}

function intersects(first: DOMRect, second: DOMRect): boolean {
  return !(
    first.right <= second.left ||
    first.left >= second.right ||
    first.bottom <= second.top ||
    first.top >= second.bottom
  );
}

function StoreActions({
  iosUrl,
  androidUrl,
  route,
  onTrack,
}: {
  iosUrl: string | null;
  androidUrl: string | null;
  route: VisitorConversionRoute;
  onTrack: (platform: 'ios' | 'android') => void;
}) {
  const platform = detectVisitorPlatform(navigator.userAgent);
  const links = selectStoreLinksForPlatform(
    { ios: iosUrl, android: androidUrl },
    platform,
  );

  if (links.length === 0) return null;

  return (
    <div className="cc-visitor-prompt__stores" aria-label="CodeCard mobile apps">
      {links.map((link) => (
        <a
          key={link.platform}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="cc-visitor-prompt__store-link"
          onClick={() => onTrack(link.platform)}
          data-route-context={route.context}
        >
          {link.label}
          <HiOutlineArrowUpRight aria-hidden />
        </a>
      ))}
    </div>
  );
}

export const VISITOR_CONVERSION_REFUSAL_LABEL = 'No, I’ll keep my work scattered';
export const VISITOR_CONVERSION_REFUSAL_SUPPORT =
  'I’d rather keep sending people five different links and explaining everything manually.';

export function SitewideVisitorConversionPrompt({
  iosAppUrl,
  androidAppUrl,
}: {
  iosAppUrl?: string | null;
  androidAppUrl?: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const reducedMotion = useReducedMotion();
  const headingId = useId();
  const descriptionId = useId();
  const refusalSupportId = useId();
  const cardRef = useRef<HTMLElement | null>(null);
  const trackedActions = useRef(new Set<string>());
  const [route, setRoute] = useState<VisitorConversionRoute | null>(null);
  const [avoidFocusedElement, setAvoidFocusedElement] = useState(false);
  const storeLinks = useMemo(
    () => resolveStoreLinks({ ios: iosAppUrl, android: androidAppUrl }),
    [iosAppUrl, androidAppUrl],
  );

  useEffect(() => {
    let cancelled = false;
    let stopDelay: (() => void) | null = null;
    let unsubscribeAuth: (() => void) | null = null;
    setRoute(null);
    setAvoidFocusedElement(false);

    const resolvedRoute = resolveVisitorConversionRoute({
      pathname,
      searchParams: new URLSearchParams(search),
      marker: markerFromDocument(),
    });
    if (!resolvedRoute) return;

    if (
      isAutomatedVisitor({
        userAgent: navigator.userAgent,
        webdriver: navigator.webdriver,
        allowTestOverride: window.__CODECARD_E2E_ALLOW_VISITOR_PROMPT__ === true,
      })
    ) {
      return;
    }

    if (shownDuringRuntime || hasVisitorConversionBeenShown(window.sessionStorage)) {
      return;
    }

    const primaryContent = document.querySelector('main');
    if (!primaryContent || primaryContent.getAttribute('aria-busy') === 'true') return;
    const contentBounds = primaryContent.getBoundingClientRect();
    if (contentBounds.width <= 0 || contentBounds.height <= 0) return;

    const resolveAnonymousViewer = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (cancelled || sessionError) return;

        if (session) {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
          if (cancelled || userError || user) return;
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (nextSession) {
            stopDelay?.();
            setRoute(null);
          }
        });
        unsubscribeAuth = () => subscription.unsubscribe();

        window.requestAnimationFrame(() => {
          if (cancelled) return;
          document.documentElement.dataset.visitorConversionTimer = 'ready';
          document.documentElement.dataset.visitorConversionStartedAt = String(Date.now());
          stopDelay = startVisibleDelay({
            document,
            onElapsed: () => {
              if (cancelled || shownDuringRuntime) return;
              if (hasVisitorConversionBeenShown(window.sessionStorage)) return;
              shownDuringRuntime = true;
              document.documentElement.dataset.visitorConversionTimer = 'shown';
              // Set the shared once-per-tab-session key only when the box becomes visible.
              markVisitorConversionShown(window.sessionStorage);
              setRoute(resolvedRoute);
              trackVisitorConversionEvent({
                event: 'visitor_prompt_viewed',
                context: resolvedRoute.context,
                profileId: resolvedRoute.profileId,
              });
            },
          });
        });
      } catch {
        // Fail closed: if auth cannot be resolved, do not show an anonymous prompt.
      }
    };

    void resolveAnonymousViewer();

    return () => {
      cancelled = true;
      stopDelay?.();
      unsubscribeAuth?.();
      delete document.documentElement.dataset.visitorConversionTimer;
      delete document.documentElement.dataset.visitorConversionStartedAt;
    };
  }, [pathname, search]);

  useEffect(() => {
    if (!route) return;
    const frame = window.requestAnimationFrame(() => {
      const card = cardRef.current?.getBoundingClientRect();
      const active =
        document.activeElement instanceof HTMLElement
          ? document.activeElement.getBoundingClientRect()
          : null;
      if (card && active && active.width > 0 && active.height > 0 && intersects(card, active)) {
        setAvoidFocusedElement(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [route]);

  useEffect(() => {
    if (!route) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      // Session shown key is already set when the box became visible — preserve it.
      if (!trackedActions.current.has('dismiss')) {
        trackedActions.current.add('dismiss');
        trackVisitorConversionEvent({
          event: 'visitor_prompt_dismissed',
          context: route.context,
          profileId: route.profileId,
        });
      }
      setRoute(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [route]);

  if (!route) return null;

  const isDemo = route.context === 'live_demo';
  const { signupHref, signinHref } = buildVisitorConversionCtaHrefs({ route, pathname });

  const trackActionOnce = (
    key: string,
    event:
      | 'visitor_prompt_dismissed'
      | 'visitor_prompt_signup_clicked'
      | 'visitor_prompt_signin_clicked'
      | 'visitor_prompt_ios_app_clicked'
      | 'visitor_prompt_android_app_clicked',
  ) => {
    if (trackedActions.current.has(key)) return;
    trackedActions.current.add(key);
    trackVisitorConversionEvent({
      event,
      context: route.context,
      profileId: route.profileId,
    });
  };

  const dismiss = () => {
    // Session shown key is already set when the box became visible — preserve it.
    trackActionOnce('dismiss', 'visitor_prompt_dismissed');
    setRoute(null);
  };

  return (
    <aside
      ref={cardRef}
      role="region"
      aria-labelledby={headingId}
      aria-describedby={`${descriptionId} ${refusalSupportId}`}
      className="cc-visitor-prompt"
      data-avoid-focus={avoidFocusedElement || undefined}
      data-reduced-motion={reducedMotion || undefined}
      data-testid="sitewide-visitor-conversion-prompt"
    >
      <div className="cc-visitor-prompt__glow" aria-hidden />

      <p className="cc-visitor-prompt__eyebrow">{isDemo ? 'CodeCard Demo' : 'CodeCard'}</p>
      <h2 id={headingId} className="cc-visitor-prompt__heading">
        {isDemo ? 'Like what you’re exploring?' : 'Build your own CodeCard'}
      </h2>
      <p id={descriptionId} className="cc-visitor-prompt__body">
        {isDemo
          ? 'Build your own CodeCard and give people one place to explore your projects, research, and technical work.'
          : 'Give people one place to explore your projects, research, and technical work through a link or QR code.'}
      </p>

      <div className="cc-visitor-prompt__actions">
        <Link
          href={signupHref}
          className="cc-visitor-prompt__primary"
          onClick={() => trackActionOnce('signup', 'visitor_prompt_signup_clicked')}
        >
          Create your CodeCard
        </Link>
        <Link
          href={signinHref}
          className="cc-visitor-prompt__secondary"
          onClick={() => trackActionOnce('signin', 'visitor_prompt_signin_clicked')}
        >
          Sign in
        </Link>
      </div>

      <StoreActions
        iosUrl={storeLinks.ios}
        androidUrl={storeLinks.android}
        route={route}
        onTrack={(platform) =>
          trackActionOnce(
            `app:${platform}`,
            platform === 'ios'
              ? 'visitor_prompt_ios_app_clicked'
              : 'visitor_prompt_android_app_clicked',
          )
        }
      />

      <div className="cc-visitor-prompt__refusal">
        <button
          type="button"
          className="cc-visitor-prompt__dismiss"
          onClick={dismiss}
          aria-describedby={refusalSupportId}
        >
          {VISITOR_CONVERSION_REFUSAL_LABEL}
        </button>
        <p id={refusalSupportId} className="cc-visitor-prompt__refusal-support">
          {VISITOR_CONVERSION_REFUSAL_SUPPORT}
        </p>
      </div>
    </aside>
  );
}

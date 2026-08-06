'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';

const PUBLIC_DESTINATIONS = new Set([
  '/demo',
  '/demo/card',
  '/sign-up',
  '/sign-in',
]);

function isModifiedClick(event: MouseEvent) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

function normalizePath(href: string) {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return url.pathname.replace(/\/$/, '') || '/';
  } catch {
    return null;
  }
}

/**
 * Short CodeCard-branded wipe for marketing → major public routes.
 * Does not run on dashboard navigation or ContentOpening flows.
 */
export function PublicRouteTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const { prefersReducedMotion } = useMotionPreferences();
  const [active, setActive] = useState(false);
  const [, startTransition] = useTransition();
  const timerRef = useRef<number | null>(null);
  const navigatingRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    setActive(false);
    navigatingRef.current = false;
    clearTimer();
  }, [pathname]);

  useEffect(() => () => clearTimer(), []);

  const navigateWithTransition = useCallback(
    (href: string) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;
      setActive(true);

      const delay = prefersReducedMotion ? 120 : 280;
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        startTransition(() => {
          router.push(href);
        });
        timerRef.current = window.setTimeout(() => {
          setActive(false);
          navigatingRef.current = false;
        }, prefersReducedMotion ? 200 : 520);
      }, delay);
    },
    [prefersReducedMotion, router],
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isModifiedClick(event)) return;
      if (event.defaultPrevented) return;

      const target = event.target as Element | null;
      if (!target) return;

      // ContentOpening / project overlays own their own feedback.
      if (target.closest('[data-content-opening], [data-project-open]')) return;

      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const path = normalizePath(anchor.href);
      if (!path) return;
      if (!PUBLIC_DESTINATIONS.has(path)) return;
      if (path === (pathname?.replace(/\/$/, '') || '/')) return;

      // Only intercept from marketing home context.
      const onMarketingHome =
        pathname === '/' || pathname === '' || pathname?.startsWith('/how-it-works');
      if (!onMarketingHome) return;

      event.preventDefault();
      navigateWithTransition(anchor.href);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [navigateWithTransition, pathname]);

  return (
    <div
      className="cc-public-route-transition"
      data-active={active ? 'true' : undefined}
      data-testid="public-route-transition"
      aria-hidden
    />
  );
}

'use client';

import { useEffect, useState } from 'react';

/** Shared media-query string for prefers-reduced-motion. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Sync-safe scroll behavior for JS scroll helpers. */
export function scrollBehaviorForPreference(
  prefersReduce?: boolean,
): ScrollBehavior {
  if (typeof prefersReduce === 'boolean') {
    return prefersReduce ? 'auto' : 'smooth';
  }
  if (typeof window === 'undefined') return 'auto';
  return window.matchMedia(REDUCED_MOTION_QUERY).matches ? 'auto' : 'smooth';
}

/**
 * Client hook for reduced-motion preference.
 * Defaults to `false` on the server and first paint to avoid hydration mismatch;
 * CSS `@media (prefers-reduced-motion: reduce)` still disables decorative motion immediately.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

export function navigateWithTransition(url: string) {
  if (typeof window === 'undefined') return;
  const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;
  if (
    !reduced &&
    typeof document !== 'undefined' &&
    'startViewTransition' in document
  ) {
    (
      document as Document & { startViewTransition: (cb: () => void) => void }
    ).startViewTransition(() => {
      window.location.href = url;
    });
    return;
  }
  window.location.href = url;
}

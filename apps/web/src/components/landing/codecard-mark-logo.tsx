'use client';

import { useCallback } from 'react';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';

function scrollToTop(durationMs = 1400) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement as HTMLElement & {
    lenis?: {
      scrollTo: (
        v: number,
        opts?: { duration?: number; easing?: (t: number) => number },
      ) => void;
    };
  };
  const lenis =
    root.lenis ??
    (window as unknown as { lenis?: NonNullable<typeof root.lenis> }).lenis;
  if (lenis?.scrollTo) {
    lenis.scrollTo(0, {
      duration: durationMs / 1000,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
    });
    return;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Top-left mark — overlapping CC expands into CodeCard on hover. */
export function CodeCardMarkLogo() {
  const { canEnhanceMotion } = useMotionPreferences();

  const handleClick = useCallback(() => {
    scrollToTop(canEnhanceMotion ? 1400 : 0);
  }, [canEnhanceMotion]);

  return (
    <button
      type="button"
      className="cc-ed-mark-logo cc-instant-press"
      aria-label="CodeCard home — scroll to top"
      onClick={handleClick}
    >
      <span className="cc-ed-mark-logo__inner" aria-hidden>
        <span className="cc-ed-mark-logo__c cc-ed-mark-logo__c--first">C</span>
        <span className="cc-ed-mark-logo__fill cc-ed-mark-logo__fill--left">
          ode
        </span>
        <span className="cc-ed-mark-logo__c cc-ed-mark-logo__c--second">C</span>
        <span className="cc-ed-mark-logo__fill cc-ed-mark-logo__fill--right">
          ard
        </span>
      </span>
    </button>
  );
}

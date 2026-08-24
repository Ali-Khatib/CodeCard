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

/** Top-left line-art mark — interlocking Cs reveal CodeCard on hover. */
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
      <span className="cc-ed-mark-logo__glyph" aria-hidden>
        <svg
          className="cc-ed-mark-logo__svg"
          viewBox="0 0 52 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="cc-ed-mark-logo__c cc-ed-mark-logo__c--left"
            d="M22 6C12.06 6 5 11.58 5 18.5S12.06 31 22 31"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinecap="round"
          />
          <path
            className="cc-ed-mark-logo__c cc-ed-mark-logo__c--right"
            d="M30 6C39.94 6 47 11.58 47 18.5S39.94 31 30 31"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinecap="round"
          />
        </svg>
        <span className="cc-ed-mark-logo__word">
          <span className="cc-ed-mark-logo__tail cc-ed-mark-logo__tail--left">
            ode
          </span>
          <span className="cc-ed-mark-logo__tail cc-ed-mark-logo__tail--right">
            ard
          </span>
        </span>
      </span>
    </button>
  );
}

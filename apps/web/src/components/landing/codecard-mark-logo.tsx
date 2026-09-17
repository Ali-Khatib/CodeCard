'use client';

import { useCallback } from 'react';
import { CodeCardMark } from '@/components/brand/codecard-mark';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import '@/styles/codecard-mark.css';

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

/** Top-left CodeCard brand mark — scroll home. */
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
        <CodeCardMark />
      </span>
    </button>
  );
}

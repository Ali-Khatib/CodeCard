'use client';

import { useCallback } from 'react';
import { CodeCardExpandingMark } from '@/components/brand/codecard-mark';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { scrollMarketingToTop } from '@/lib/marketing/scroll-to-top';
import '@/styles/codecard-mark.css';

/** Top-left CodeCard brand mark. Scrolls to the top of the current page. */
export function CodeCardMarkLogo() {
  const { canEnhanceMotion } = useMotionPreferences();

  const handleClick = useCallback(() => {
    scrollMarketingToTop(canEnhanceMotion ? 1400 : 0);
  }, [canEnhanceMotion]);

  return (
    <button
      type="button"
      className="cc-ed-mark-logo cc-instant-press"
      aria-label="Top of page"
      onClick={handleClick}
    >
      <CodeCardExpandingMark />
    </button>
  );
}

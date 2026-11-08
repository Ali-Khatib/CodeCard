'use client';

import { useEffect, type RefObject } from 'react';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';

/**
 * A single rise-and-fade as a block arrives, once.
 *
 * Hiding only happens while the root carries `data-reveal-root`, which this
 * hook sets, so content is never invisible when the script has not run. A
 * sweep shortly after mount shows anything the observer missed.
 */
export function useLsReveal(root: RefObject<HTMLElement | null>) {
  const { canEnhanceMotion } = useMotionPreferences();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-ls-reveal]'));
    if (!canEnhanceMotion) {
      targets.forEach((t) => t.setAttribute('data-in', 'true'));
      return;
    }
    el.dataset.revealRoot = 'on';

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-in', 'true');
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    targets.forEach((t) => io.observe(t));

    const sweep = window.setTimeout(() => {
      for (const t of targets) {
        if (t.getAttribute('data-in') === 'true') continue;
        if (t.getBoundingClientRect().top < window.innerHeight * 1.5) {
          t.setAttribute('data-in', 'true');
          io.unobserve(t);
        }
      }
    }, 1200);

    return () => {
      window.clearTimeout(sweep);
      io.disconnect();
    };
  }, [canEnhanceMotion, root]);
}

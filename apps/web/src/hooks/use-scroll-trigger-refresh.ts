'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { refreshScrollTrigger } from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';

/**
 * Refresh ScrollTrigger after route changes, font load, and image decode.
 * No-ops when enhanced motion is disabled.
 */
export function useScrollTriggerRefresh(options?: {
  /** Extra dependency that should force a refresh when it changes. */
  contentKey?: string | number | boolean | null;
}) {
  const pathname = usePathname();
  const { canEnhanceMotion } = useMotionPreferences();
  const contentKey = options?.contentKey;

  useEffect(() => {
    if (!canEnhanceMotion) return;

    let cancelled = false;
    const run = () => {
      if (!cancelled) refreshScrollTrigger({ safe: true });
    };

    run();
    const raf = window.requestAnimationFrame(run);

    const fontsReady =
      typeof document !== 'undefined' && 'fonts' in document
        ? document.fonts.ready.then(run).catch(() => undefined)
        : Promise.resolve();

    const images = Array.from(document.images).filter((img) => !img.complete);
    let pending = images.length;
    const onImage = () => {
      pending -= 1;
      if (pending <= 0) run();
    };
    images.forEach((img) => {
      img.addEventListener('load', onImage, { once: true });
      img.addEventListener('error', onImage, { once: true });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      images.forEach((img) => {
        img.removeEventListener('load', onImage);
        img.removeEventListener('error', onImage);
      });
      void fontsReady;
    };
  }, [canEnhanceMotion, pathname, contentKey]);
}

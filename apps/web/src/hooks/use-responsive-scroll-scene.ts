'use client';

import { useEffect, useState } from 'react';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';

export type ScrollSceneMode = 'desktop' | 'tablet' | 'mobile' | 'reduced';

const DESKTOP_MQ = '(min-width: 1024px)';
const TABLET_MQ = '(min-width: 768px) and (max-width: 1023px)';

/**
 * Resolves cinematic presentation mode for landing ScrollTrigger scenes.
 * Reduced motion always wins. SSR defaults to `reduced` (static markup readable).
 */
export function useResponsiveScrollScene(): {
  mode: ScrollSceneMode;
  ready: boolean;
  canPin: boolean;
} {
  const { canEnhanceMotion, hydrated, prefersReducedMotion } = useMotionPreferences();
  const [mode, setMode] = useState<ScrollSceneMode>('desktop');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    const resolve = () => {
      if (prefersReducedMotion || !canEnhanceMotion) {
        setMode('reduced');
        setReady(true);
        return;
      }
      if (window.matchMedia(DESKTOP_MQ).matches) {
        setMode('desktop');
      } else if (window.matchMedia(TABLET_MQ).matches) {
        setMode('tablet');
      } else {
        setMode('mobile');
      }
      setReady(true);
    };

    resolve();
    const desktop = window.matchMedia(DESKTOP_MQ);
    const tablet = window.matchMedia(TABLET_MQ);
    desktop.addEventListener('change', resolve);
    tablet.addEventListener('change', resolve);
    return () => {
      desktop.removeEventListener('change', resolve);
      tablet.removeEventListener('change', resolve);
    };
  }, [canEnhanceMotion, hydrated, prefersReducedMotion]);

  return {
    mode,
    ready,
    canPin: ready && (mode === 'desktop' || mode === 'tablet'),
  };
}

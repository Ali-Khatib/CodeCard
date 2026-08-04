'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { REDUCED_MOTION_QUERY } from '@/hooks/use-reduced-motion';

type MotionPreferences = {
  /** True when prefers-reduced-motion: reduce is active (hydrated). */
  prefersReducedMotion: boolean;
  /** True only after client hydration when enhanced motion is allowed. */
  canEnhanceMotion: boolean;
  /** True after first client preference read (avoids treating SSR false as final). */
  hydrated: boolean;
};

const MotionPreferencesContext = createContext<MotionPreferences>({
  prefersReducedMotion: false,
  canEnhanceMotion: false,
  hydrated: false,
});

export function MotionPreferencesProvider({ children }: { children: ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => {
      setPrefersReducedMotion(mq.matches);
      setHydrated(true);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const value = useMemo<MotionPreferences>(
    () => ({
      prefersReducedMotion,
      canEnhanceMotion: hydrated && !prefersReducedMotion,
      hydrated,
    }),
    [prefersReducedMotion, hydrated],
  );

  return (
    <MotionPreferencesContext.Provider value={value}>
      {children}
    </MotionPreferencesContext.Provider>
  );
}

export function useMotionPreferences(): MotionPreferences {
  return useContext(MotionPreferencesContext);
}

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Cc2Mark } from './mark';

/**
 * Opening sequence, modelled on the product itself: a tap, a short black
 * beat, then the profile opens.
 *
 *   boot    server HTML. Ink overlay, nothing else.
 *   run     mark draws in, three tap rings, signal floods the screen.
 *   reveal  overlay lifts, the page below starts its entrance.
 *   done    overlay unmounted.
 *
 * It plays once per browser session. Reduced motion, and repeat visits, get
 * a 250ms fade instead. Click, tap or Escape skips it.
 */
export type IntroPhase = 'boot' | 'run' | 'reveal' | 'done';

type IntroState = { phase: IntroPhase; ready: boolean };

const IntroContext = createContext<IntroState>({ phase: 'done', ready: true });

export function useIntro(): IntroState {
  return useContext(IntroContext);
}

const SEEN_KEY = 'cc2.intro.seen';
const LOCK_CLASS = 'cc2-lock';

export function IntroProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<IntroPhase>(enabled ? 'boot' : 'done');
  const [quick, setQuick] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const at = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const skip = useCallback(() => {
    clearTimers();
    setQuick(true);
    setPhase((p) => (p === 'done' ? p : 'reveal'));
    at(380, () => setPhase('done'));
  }, [at, clearTimers]);

  useEffect(() => {
    if (!enabled) {
      setPhase('done');
      return;
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      /* storage can be blocked */
    }
    const forced = new URLSearchParams(window.location.search).has('intro');

    document.documentElement.classList.add(LOCK_CLASS);

    if ((reduce || seen) && !forced) {
      setQuick(true);
      setPhase('reveal');
      at(300, () => setPhase('done'));
    } else {
      setPhase('run');
      at(1900, () => setPhase('reveal'));
      at(2900, () => setPhase('done'));
      try {
        window.sessionStorage.setItem(SEEN_KEY, '1');
      } catch {
        /* ignore */
      }
    }

    // A failed effect must never leave the page locked.
    at(6000, () => setPhase('done'));

    return () => {
      clearTimers();
      document.documentElement.classList.remove(LOCK_CLASS);
    };
  }, [enabled, at, clearTimers]);

  useEffect(() => {
    if (phase === 'reveal' || phase === 'done') {
      document.documentElement.classList.remove(LOCK_CLASS);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'done' || phase === 'reveal') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip();
    };
    const stop = (e: Event) => e.preventDefault();
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', stop, { passive: false });
    window.addEventListener('touchmove', stop, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchmove', stop);
    };
  }, [phase, skip]);

  const value = useMemo<IntroState>(
    () => ({ phase, ready: phase === 'reveal' || phase === 'done' }),
    [phase],
  );

  return (
    <IntroContext.Provider value={value}>
      {children}
      {enabled && phase !== 'done' ? (
        <div
          className="cc2-intro"
          data-phase={phase}
          data-quick={quick ? 'true' : 'false'}
          aria-hidden
          onPointerDown={skip}
        >
          <div className="cc2-intro__flood" />
          <div className="cc2-intro__centre">
            <span className="cc2-intro__ring" style={{ ['--i' as string]: 0 }} />
            <span className="cc2-intro__ring" style={{ ['--i' as string]: 1 }} />
            <span className="cc2-intro__ring" style={{ ['--i' as string]: 2 }} />
            <Cc2Mark className="cc2-intro__mark" />
          </div>
          <p className="cc2-intro__word">CodeCard</p>
        </div>
      ) : null}
    </IntroContext.Provider>
  );
}

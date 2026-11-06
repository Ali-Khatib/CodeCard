'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSmoothScroll } from '@/components/motion/smooth-scroll-provider';

const SEEN_KEY = 'cc.open.seen';
const COUNT_MS = 2600;
const EXIT_MS = 1100;
const WORDS = ['Share', 'your', 'work.'] as const;

type Phase = 'run' | 'exit' | 'done';

/**
 * First-visit opening: a percent counter on black, the tagline stacking in by
 * progress, then the whole sheet lifts away to reveal the shader hero.
 * Plays once per session, skips for reduced motion, click or Escape skips it.
 * The matching inline script in EditorialLanding hides it before first paint
 * when it should not play, so repeat visits never flash.
 */
export function OpeningCurtain() {
  const [phase, setPhase] = useState<Phase>('run');
  const [pct, setPct] = useState(0);
  const phaseRef = useRef<Phase>('run');
  const { pause, release } = useSmoothScroll();

  const finish = useCallback(() => {
    if (phaseRef.current !== 'run') return;
    phaseRef.current = 'exit';
    setPct(100);
    setPhase('exit');
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* storage unavailable */
    }
    window.setTimeout(() => {
      phaseRef.current = 'done';
      setPhase('done');
      document.documentElement.style.removeProperty('overflow');
      release();
    }, EXIT_MS);
  }, [release]);

  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains('cc-intro-seen')) {
      phaseRef.current = 'done';
      setPhase('done');
      return;
    }
    root.style.overflow = 'hidden';
    pause();
    window.scrollTo(0, 0);

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS);
      // fast start, long settle, so the last digits feel earned
      const eased = 1 - Math.pow(1 - t, 2.6);
      setPct(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    const safety = window.setTimeout(finish, 6000);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
      window.removeEventListener('keydown', onKey);
      root.style.removeProperty('overflow');
    };
  }, [finish, pause]);

  if (phase === 'done') return null;

  const lit = pct >= 66 ? 3 : pct >= 33 ? 2 : pct >= 8 ? 1 : 0;

  return (
    <div
      className="cc-open"
      data-phase={phase}
      role="presentation"
      onClick={finish}
      aria-hidden="true"
    >
      <div className="cc-open__bar" style={{ transform: `scaleX(${pct / 100})` }} />
      <div className="cc-open__top">
        <span>CodeCard</span>
        <span className="cc-open__skip">Click to skip</span>
      </div>
      <p className="cc-open__words">
        {WORDS.map((w, i) => (
          <span key={w} className="cc-open__word" data-on={i < lit ? 'true' : 'false'}>
            <span>{w}</span>
          </span>
        ))}
      </p>
      <div className="cc-open__count">
        <span className="cc-open__num">{String(pct).padStart(2, '0')}</span>
        <span className="cc-open__pct">%</span>
      </div>
    </div>
  );
}

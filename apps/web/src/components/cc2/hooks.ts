'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/** True once the element has been at least `amount` visible. Never flips back. */
export function useInViewOnce<T extends HTMLElement>(
  amount = 0.25,
  rootMargin = '0px 0px -8% 0px',
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: amount, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [amount, rootMargin, seen]);

  return [ref, seen];
}

/** Subscribes to a media query. Returns `fallback` on the server and first paint. */
export function useMedia(query: string, fallback = false): boolean {
  const [match, setMatch] = useState(fallback);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatch(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [query]);
  return match;
}

export const FINE_POINTER = '(hover: hover) and (pointer: fine)';
export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
export const DESKTOP = '(min-width: 1024px)';

export function useReducedMotionPref(): boolean {
  return useMedia(REDUCED_MOTION, false);
}

export const clamp = (n: number, lo = 0, hi = 1) => (n < lo ? lo : n > hi ? hi : n);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

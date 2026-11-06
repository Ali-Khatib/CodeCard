'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * One scroll listener and one rAF for the whole page.
 *
 * Subscribers read geometry that was measured once (on resize), never during
 * the frame, so scrolling never forces layout. Callbacks write transforms and
 * opacity straight to elements; nothing here goes through React state.
 */
type Frame = (scrollY: number, viewportH: number) => void;

const subs = new Set<Frame>();
let raf = 0;
let bound = false;

function tick() {
  raf = 0;
  const y = window.scrollY;
  const h = window.innerHeight;
  subs.forEach((fn) => fn(y, h));
}

function schedule() {
  if (!raf) raf = requestAnimationFrame(tick);
}

function bind() {
  if (bound) return;
  bound = true;
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
}

function unbind() {
  if (!bound || subs.size) return;
  bound = false;
  window.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', schedule);
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

export function subscribeScroll(fn: Frame): () => void {
  subs.add(fn);
  bind();
  schedule();
  return () => {
    subs.delete(fn);
    unbind();
  };
}

export type Track = {
  /** 0 → 1 while the element crosses the viewport (enter to exit). */
  cross: number;
  /** 0 → 1 while a tall section is pinned (only meaningful for sticky stages). */
  pin: number;
  /** Signed distance of the element centre from the viewport centre, in viewport heights. */
  centre: number;
  top: number;
  height: number;
  viewportH: number;
};

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Track an element against the scroll position.
 * The callback runs once per animation frame while the page scrolls.
 */
export function useScrollTrack(
  ref: RefObject<HTMLElement | null>,
  onFrame: (t: Track) => void,
  enabled = true,
) {
  const cb = useRef(onFrame);
  cb.current = onFrame;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let top = 0;
    let height = 0;

    const measure = () => {
      const r = el.getBoundingClientRect();
      top = r.top + window.scrollY;
      height = r.height;
      schedule();
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(document.documentElement);
    window.addEventListener('load', measure);
    void document.fonts?.ready.then(measure);

    const unsub = subscribeScroll((y, vh) => {
      const cross = clamp01((y + vh - top) / (height + vh));
      const pinRange = Math.max(1, height - vh);
      const pin = clamp01((y - top) / pinRange);
      const centre = (top + height / 2 - (y + vh / 2)) / vh;
      cb.current({ cross, pin, centre, top, height, viewportH: vh });
    });

    return () => {
      unsub();
      ro.disconnect();
      window.removeEventListener('load', measure);
    };
  }, [ref, enabled]);
}

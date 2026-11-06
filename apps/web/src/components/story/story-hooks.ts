'use client';

import { useEffect, type RefObject } from 'react';
import { applyLandingChromeInk } from '@/components/landing/editorial/landing-chrome-tone';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';

/** Opacity and a short rise, once, when a block arrives. Nothing loops. */
export function useReveal(root: RefObject<HTMLElement | null>) {
  const { canEnhanceMotion } = useMotionPreferences();
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!canEnhanceMotion) {
      targets.forEach((t) => t.setAttribute('data-in', 'true'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-in', 'true');
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [canEnhanceMotion, root]);
}

/**
 * Product shots render at a real screen width and are scaled down to their
 * frame, so each panel reads as a screenshot instead of a squeezed app.
 */
export function useFitShots(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const shots = Array.from(el.querySelectorAll<HTMLElement>('.pl-shot'));
    if (!shots.length) return;
    const fit = () => {
      for (const shot of shots) {
        const box = shot.parentElement;
        if (!box) continue;
        const design = Number(shot.dataset.w ?? 1180);
        shot.style.width = `${design}px`;
        shot.style.transform = 'none';
        /* contain, so the whole screen reads rather than a slice of it */
        const natural = shot.scrollHeight || design * 0.72;
        const k = Math.min(box.clientWidth / design, box.clientHeight / natural);
        const left = (box.clientWidth - design * k) / 2;
        const top = (box.clientHeight - natural * k) / 2;
        shot.style.transform = `translate(${left}px, ${top}px) scale(${k})`;
      }
    };
    fit();
    const t = window.setTimeout(fit, 400);
    const ro = new ResizeObserver(fit);
    shots.forEach((s) => s.parentElement && ro.observe(s.parentElement));
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, [root]);
}

/** The bar reads whichever band sits under it and flips its ink to match. */
export function useChromeTone(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const bands = Array.from(el.querySelectorAll<HTMLElement>('[data-band]'));
    const bar = el.querySelector<HTMLElement>('.pl-nav');
    let last = '';
    let ticking = false;

    const sync = () => {
      ticking = false;
      let hit: HTMLElement | undefined;
      for (const b of bands) {
        const r = b.getBoundingClientRect();
        if (r.top <= 58 && r.bottom > 58) hit = b;
      }
      const band = hit ?? bands[0];
      /* A contained hero still shows paper behind the bar, so it reads light. */
      const dark = band?.dataset.band === 'dark' && band.dataset.open !== 'false';
      const tone = dark ? 'light' : 'dark';
      if (tone === last) return;
      last = tone;
      applyLandingChromeInk(tone);
      if (bar) bar.dataset.tone = tone;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('pl:tone', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pl:tone', onScroll);
    };
  }, [root]);
}

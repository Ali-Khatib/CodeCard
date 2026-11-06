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
    const showAll = () => targets.forEach((t) => t.setAttribute('data-in', 'true'));
    if (!canEnhanceMotion) {
      showAll();
      return;
    }
    /* Hiding only happens while this is on, so content is never invisible
       when the script is absent or the observer misses something. */
    el.dataset.revealRoot = 'on';
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
    /* Safety net: anything still hidden after a moment is shown anyway. */
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

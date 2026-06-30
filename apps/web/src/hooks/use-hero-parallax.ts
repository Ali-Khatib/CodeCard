'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

let registered = false;

export function useHeroParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    if (!registered) {
      gsap.registerPlugin(ScrollTrigger);
      registered = true;
    }

    const sub = el.querySelector('[data-hero-sub]');
    const cta = el.querySelector('[data-hero-cta]');

    const ctx = gsap.context(() => {
      if (sub) {
        gsap.fromTo(
          sub,
          { y: 0 },
          {
            y: -40,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 0.8 },
          },
        );
      }
      if (cta) {
        gsap.fromTo(
          cta,
          { y: 0 },
          {
            y: -20,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 1 },
          },
        );
      }
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return ref;
}

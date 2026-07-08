'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

let registered = false;

function ensureGsap() {
  if (!registered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
}

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  scale?: number;
  parallax?: boolean;
};

/** Scroll entrance — always visible; animates translate only so content never stays hidden. */
export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  y = 32,
  scale = 1,
  parallax = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    ensureGsap();
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y, scale: scale === 1 ? 1 : scale * 0.98 },
        {
          y: 0,
          scale: 1,
          duration: 0.75,
          delay,
          ease: 'power3.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        },
      );

      if (parallax) {
        gsap.to(el, {
          y: -24,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5,
          },
        });
      }
    }, el);

    return () => ctx.revert();
  }, [reduced, delay, y, scale, parallax]);

  return (
    <div ref={ref} className={`cc-scroll-reveal ${className}`.trim()}>
      {children}
    </div>
  );
}

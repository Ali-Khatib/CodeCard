'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { MOTION_DURATION, MOTION_LIMITS, MOTION_SCROLL } from '@/components/motion/motion-tokens';

type SoftSectionEnterProps = {
  children: ReactNode;
  className?: string;
  staggerChildren?: boolean;
};

/**
 * Soft section entrance — translate only (never opacity 0 on content).
 * Dynamically loads GSAP + ScrollTrigger after mount when motion is allowed.
 */
export function SoftSectionEnter({
  children,
  className = '',
  staggerChildren = false,
}: SoftSectionEnterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();

  useEffect(() => {
    if (!canEnhanceMotion) return;
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    let ctx: { revert: () => void } | null = null;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const targets = staggerChildren
          ? el.querySelectorAll<HTMLElement>('[data-enter-item]')
          : [el];
        if (!targets.length) return;

        gsap.fromTo(
          targets,
          { y: MOTION_LIMITS.revealY },
          {
            y: 0,
            duration: MOTION_DURATION.section,
            stagger: staggerChildren ? 0.08 : 0,
            ease: 'power3.out',
            immediateRender: false,
            scrollTrigger: {
              trigger: el,
              start: MOTION_SCROLL.revealStart,
              once: true,
            },
          },
        );
      }, el);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [canEnhanceMotion, staggerChildren]);

  return (
    <div
      ref={ref}
      className={`cc-soft-section-enter ${className}`.trim()}
      data-motion-pattern="section-enter"
    >
      {children}
    </div>
  );
}

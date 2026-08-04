'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import {
  ensureGsapPlugins,
  gsap,
  gsapMarkersEnabled,
} from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { MOTION_DURATION, MOTION_EASE, MOTION_LIMITS, MOTION_SCROLL } from '@/components/motion/motion-tokens';
import { useScrollTriggerRefresh } from '@/hooks/use-scroll-trigger-refresh';

type MotionSectionRevealProofProps = {
  children: ReactNode;
  className?: string;
  /** Optional test id for Playwright / contract checks. */
  'data-testid'?: string;
};

/**
 * Phase 0 integration proof — transform only (no pin/parallax).
 * Content stays visible without JS (no zero-opacity initial paint).
 */
export function MotionSectionRevealProof({
  children,
  className = '',
  'data-testid': testId = 'motion-section-reveal-proof',
}: MotionSectionRevealProofProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();
  useScrollTriggerRefresh();

  useGSAP(
    () => {
      if (!canEnhanceMotion) return;
      ensureGsapPlugins();
      const el = ref.current;
      if (!el) return;

      gsap.fromTo(
        el,
        { y: MOTION_LIMITS.revealY },
        {
          y: 0,
          duration: MOTION_DURATION.section,
          ease: MOTION_EASE.out,
          immediateRender: false,
          scrollTrigger: {
            trigger: el,
            start: MOTION_SCROLL.revealStart,
            once: true,
            markers: gsapMarkersEnabled(),
          },
        },
      );
    },
    { scope: ref, dependencies: [canEnhanceMotion], revertOnUpdate: true },
  );

  return (
    <div
      ref={ref}
      className={className}
      data-testid={testId}
      data-motion-pattern="reveal-soft"
      data-motion-owner="gsap"
    >
      {children}
    </div>
  );
}

'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ensureGsapPlugins } from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { HERO_FIELD } from '@/components/ui/hero';

/**
 * Multi-color stroke around the marketing pill. Starts once the hero
 * cinema leaves, and completes when the footer is fully in view.
 */
export function EditorialNavProgress() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { canEnhanceMotion, hydrated } = useMotionPreferences();

  useGSAP(
    () => {
      const svg = svgRef.current;
      const page = document.querySelector('.cc-ed');
      const hero =
        document.querySelector<HTMLElement>('.cc-ed-hero-scene') ??
        document.querySelector<HTMLElement>('[data-chapter-section="hero"]');
      const footer = document.querySelector<HTMLElement>('.cc-site-footer');
      if (!svg || !page || !hero || !footer) return;

      const apply = (progress: number) => {
        const next = Math.min(1, Math.max(0, progress));
        svg.style.setProperty('--cc-nav-progress', String(next));
        svg.dataset.active = next > 0.01 ? 'true' : 'false';
      };

      apply(0);

      if (!hydrated) return;

      ensureGsapPlugins();

      const trigger = ScrollTrigger.create({
        id: 'editorial-nav-progress',
        trigger: hero,
        start: 'bottom top',
        endTrigger: footer,
        end: 'bottom bottom',
        scrub: canEnhanceMotion ? 0.35 : true,
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
      });

      apply(trigger.progress);
    },
    {
      dependencies: [canEnhanceMotion, hydrated],
      revertOnUpdate: true,
    },
  );

  return (
    <svg
      ref={svgRef}
      className="cc-nav-progress"
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      aria-hidden
      data-active="false"
    >
      <defs>
        <linearGradient
          id="cc-nav-progress-grad"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor={HERO_FIELD.moss} />
          <stop offset="22%" stopColor={HERO_FIELD.orange} />
          <stop offset="48%" stopColor={HERO_FIELD.chlorophyll} />
          <stop offset="72%" stopColor={HERO_FIELD.copper} />
          <stop offset="100%" stopColor={HERO_FIELD.bone} />
        </linearGradient>
      </defs>
      <rect
        className="cc-nav-progress__track"
        x="1.4"
        y="1.4"
        width="97.2"
        height="37.2"
        rx="18.6"
        pathLength="100"
      />
      <rect
        className="cc-nav-progress__fill"
        x="1.4"
        y="1.4"
        width="97.2"
        height="37.2"
        rx="18.6"
        pathLength="100"
      />
    </svg>
  );
}

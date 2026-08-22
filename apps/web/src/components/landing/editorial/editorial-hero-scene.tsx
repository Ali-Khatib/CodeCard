'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import {
  ensureGsapPlugins,
  gsap,
  gsapMarkersEnabled,
} from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { MOTION_EASE } from '@/components/motion/motion-tokens';
import { useScrollTriggerRefresh } from '@/hooks/use-scroll-trigger-refresh';

type EditorialHeroSceneProps = {
  hero: ReactNode;
  statement: ReactNode;
};

/**
 * Continuous hero → statement scene transition (scroll-scrubbed, not a hard cut).
 */
export function EditorialHeroScene({ hero, statement }: EditorialHeroSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();
  useScrollTriggerRefresh();

  useGSAP(
    () => {
      if (!canEnhanceMotion) return;
      ensureGsapPlugins();

      const track = trackRef.current;
      const stage = stageRef.current;
      const scene = rootRef.current;
      const heroContent = heroContentRef.current;
      const statementEl = statementRef.current;
      if (!track || !stage || !scene || !heroContent || !statementEl) return;

      const media = stage.querySelector<HTMLElement>('.cc-ed-hero__media');
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      const scrollDistance = mobile ? '115%' : '140%';

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: track,
          start: 'top top',
          end: `+=${scrollDistance}`,
          scrub: 0.5,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          markers: gsapMarkersEnabled(),
        },
      });

      tl.to(
        scene,
        {
          paddingTop: 0,
          paddingRight: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          backgroundColor: 'transparent',
          ease: MOTION_EASE.inOut,
        },
        0,
      );

      tl.to(
        stage,
        {
          borderRadius: 0,
          boxShadow: '0 0 0 rgba(35, 35, 36, 0)',
          ease: MOTION_EASE.inOut,
        },
        0,
      );

      if (media) {
        tl.to(
          media,
          {
            scale: mobile ? 1.06 : 1.1,
            ease: MOTION_EASE.inOut,
          },
          0,
        );
      }

      tl.to(
        heroContent,
        {
          y: mobile ? '-10%' : '-16%',
          opacity: 0,
          ease: MOTION_EASE.inOut,
        },
        0,
      ).fromTo(
        statementEl,
        {
          y: mobile ? '10%' : '14%',
          opacity: 0,
        },
        {
          y: '0%',
          opacity: 1,
          ease: MOTION_EASE.inOut,
        },
        0.12,
      );
    },
    { scope: rootRef, dependencies: [canEnhanceMotion], revertOnUpdate: true },
  );

  return (
    <div
      ref={rootRef}
      className={
        canEnhanceMotion
          ? 'cc-ed-hero-scene cc-ed-hero-scene--enhanced'
          : 'cc-ed-hero-scene'
      }
      data-testid="editorial-hero-scene"
      data-motion-pattern="section-enter"
      data-motion-owner="gsap"
    >
      <div ref={trackRef} className="cc-ed-hero-scene__track">
        <div ref={stageRef} className="cc-ed-hero-scene__stage">
          <div className="cc-ed-hero-scene__hero">
            <div ref={heroContentRef} className="cc-ed-hero-scene__hero-inner">
              {hero}
            </div>
          </div>
          <div ref={statementRef} className="cc-ed-hero-scene__statement">
            {statement}
          </div>
        </div>
      </div>
    </div>
  );
}

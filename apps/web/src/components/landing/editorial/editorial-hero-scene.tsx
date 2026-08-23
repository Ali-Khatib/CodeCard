'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import {
  ensureGsapPlugins,
  gsap,
  gsapMarkersEnabled,
} from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { useScrollTriggerRefresh } from '@/hooks/use-scroll-trigger-refresh';

type EditorialHeroSceneProps = {
  hero: ReactNode;
  statement: ReactNode;
};

const BEAT_COUNT = 3;

/** Modest framed inset — still owns the first viewport. */
function cardClip(mobile: boolean) {
  const y = mobile ? 10 : 18;
  const x = mobile ? 12 : 22;
  const r = mobile ? 22 : 28;
  return `inset(${y}px ${x}px ${y}px ${x}px round ${r}px)`;
}

function beatIndexFromProgress(progress: number) {
  if (progress >= 0.78) return 2;
  if (progress >= 0.55) return 1;
  return 0;
}

/**
 * Inset shader panel → full-bleed, then the three statement beats.
 * Short pin + light scrub so scroll stays quick.
 */
export function EditorialHeroScene({ hero, statement }: EditorialHeroSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();
  useScrollTriggerRefresh();

  useGSAP(
    () => {
      if (!canEnhanceMotion) return;
      ensureGsapPlugins();

      const track = trackRef.current;
      const stage = stageRef.current;
      const statementEl = statementRef.current;
      if (!track || !stage || !statementEl) return;

      const heroCopy = stage.querySelector<HTMLElement>('.cc-ed-hero__content');
      const chrome = statementEl.querySelector<HTMLElement>(
        '.cc-ed-statement__chrome',
      );
      const beats = Array.from(
        statementEl.querySelectorAll<HTMLElement>('[data-statement-beat]'),
      );
      const indexEl = statementEl.querySelector<HTMLElement>(
        '[data-statement-index]',
      );
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      const openClip = 'inset(0px 0px 0px 0px round 0px)';
      const closedClip = cardClip(mobile);

      gsap.set(stage, { clipPath: closedClip });
      gsap.set(statementEl, { autoAlpha: 0 });
      if (chrome) gsap.set(chrome, { autoAlpha: 0, y: 12 });
      beats.forEach((beat) => {
        gsap.set(beat, {
          autoAlpha: 0,
          y: 24,
          clipPath: 'inset(0% 0% 100% 0%)',
        });
      });

      const syncPager = (progress: number) => {
        const idx = beatIndexFromProgress(progress);
        if (indexEl) {
          indexEl.textContent = String(idx + 1).padStart(2, '0');
        }
        beats.forEach((beat, i) => {
          if (i === idx) beat.removeAttribute('aria-hidden');
          else beat.setAttribute('aria-hidden', 'true');
        });
      };

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: track,
          start: 'top top',
          end: mobile ? '+=95%' : '+=115%',
          scrub: 0.2,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          markers: gsapMarkersEnabled(),
          onUpdate: (self) => syncPager(self.progress),
        },
      });

      tl.fromTo(
        stage,
        { clipPath: closedClip },
        { clipPath: openClip, duration: 0.42 },
        0,
      );

      if (heroCopy) {
        tl.to(
          heroCopy,
          { yPercent: mobile ? -6 : -8, autoAlpha: 0, duration: 0.14 },
          0.28,
        );
      }

      tl.to(statementEl, { autoAlpha: 1, duration: 0.1 }, 0.38);

      if (chrome) {
        tl.to(chrome, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.4);
      }

      beats.forEach((beat, i) => {
        const start = 0.4 + i * 0.18;
        tl.fromTo(
          beat,
          { autoAlpha: 0, y: 20, clipPath: 'inset(0% 0% 100% 0%)' },
          {
            autoAlpha: 1,
            y: 0,
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.1,
          },
          start,
        );
        if (i < BEAT_COUNT - 1) {
          tl.to(beat, { autoAlpha: 0, y: -12, duration: 0.08 }, start + 0.12);
        }
      });

      syncPager(0);
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
            <div className="cc-ed-hero-scene__hero-inner">{hero}</div>
          </div>
          <div ref={statementRef} className="cc-ed-hero-scene__statement">
            {statement}
          </div>
        </div>
      </div>
    </div>
  );
}

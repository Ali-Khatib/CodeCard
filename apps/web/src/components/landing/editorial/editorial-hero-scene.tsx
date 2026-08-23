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
};

const INTRO_DURATION = 1.2;
const INTRO_DELAY = 0.05;
/** Matches cubic-bezier(0.16, 1, 0.3, 1) — premium ease-out, no overshoot. */
const INTRO_EASE = 'power3.out';

function stageRadius(mobile: boolean) {
  return mobile ? 22 : 32;
}

function scrollClipClosed(mobile: boolean) {
  const r = stageRadius(mobile);
  return `inset(0px 0px 0px 0px round ${r}px)`;
}

/**
 * Load: small inset hero on cream matting expands in place (geometry, not scale).
 * Scroll: rounded hero → full-bleed. Statement cinema lives elsewhere.
 */
export function EditorialHeroScene({ hero }: EditorialHeroSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();
  useScrollTriggerRefresh();

  useGSAP(
    () => {
      if (!canEnhanceMotion) return;
      ensureGsapPlugins();

      const root = rootRef.current;
      const track = trackRef.current;
      const stage = stageRef.current;
      if (!root || !track || !stage) return;

      const mobile = window.matchMedia('(max-width: 767px)').matches;
      const openClip = 'inset(0px 0px 0px 0px round 0px)';
      const closedClip = scrollClipClosed(mobile);
      const finalRadius = stageRadius(mobile);

      const heroCopy = stage.querySelector<HTMLElement>('.cc-ed-hero__content');
      const media = stage.querySelector<HTMLElement>('.cc-ed-hero__media');
      const eyebrow = stage.querySelector<HTMLElement>('.cc-ed-hero .cc-ed__eyebrow');
      const headline = stage.querySelector<HTMLElement>('.cc-ed-hero .cc-ed__display');
      const lede = stage.querySelector<HTMLElement>('.cc-ed-hero .cc-ed__lede');
      const actions = stage.querySelector<HTMLElement>('.cc-ed-hero .cc-ed__actions');

      const contentBits = [eyebrow, headline, lede, actions].filter(
        (el): el is HTMLElement => Boolean(el),
      );

      const trackHeight = () => track.offsetHeight;

      const snapFinalGeometry = () => {
        stage.style.animation = 'none';
        gsap.set(stage, {
          width: '100%',
          height: trackHeight(),
          minHeight: trackHeight(),
          marginTop: 0,
          marginLeft: 0,
          marginRight: 0,
          borderRadius: finalRadius,
          clipPath: closedClip,
        });
      };

      const buildScrollCinema = () => {
        snapFinalGeometry();
        root.dataset.heroIntro = 'done';
        document.body.style.overflow = '';

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: track,
            start: 'top top',
            end: mobile ? '+=85%' : '+=100%',
            scrub: 0.25,
            pin: stage,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
          },
        });

        tl.fromTo(
          stage,
          { clipPath: closedClip },
          { clipPath: openClip, duration: 0.7 },
          0,
        );

        if (heroCopy) {
          tl.to(
            heroCopy,
            { yPercent: mobile ? -4 : -6, autoAlpha: 0.15, duration: 0.3 },
            0.45,
          );
        }
      };

      const skipIntro = window.scrollY > 8;

      if (skipIntro) {
        snapFinalGeometry();
        gsap.set(contentBits, { clearProps: 'opacity,visibility,transform' });
        if (media) gsap.set(media, { clearProps: 'opacity,visibility,transform' });
        buildScrollCinema();
        return;
      }

      root.dataset.heroIntro = 'running';
      document.body.style.overflow = 'hidden';

      // Geometry expansion — hero box grows through intentional cream matting (no scale).
      stage.style.animation = 'none';
      if (media) gsap.set(media, { autoAlpha: 0.72 });
      if (contentBits.length) {
        gsap.set(contentBits, { autoAlpha: 0, y: 12 });
      }

      const intro = gsap.timeline({
        delay: INTRO_DELAY,
        onComplete: buildScrollCinema,
      });

      intro.to(
        stage,
        {
          width: '100%',
          height: trackHeight,
          minHeight: trackHeight,
          marginTop: 0,
          marginLeft: 0,
          marginRight: 0,
          borderRadius: finalRadius,
          duration: INTRO_DURATION,
          ease: INTRO_EASE,
        },
        0,
      );

      if (media) {
        intro.to(
          media,
          { autoAlpha: 1, duration: INTRO_DURATION * 0.85, ease: INTRO_EASE },
          0.15,
        );
      }

      if (eyebrow) {
        intro.to(
          eyebrow,
          { autoAlpha: 1, y: 0, duration: 0.45, ease: INTRO_EASE },
          0.25,
        );
      }
      if (headline) {
        intro.to(
          headline,
          { autoAlpha: 1, y: 0, duration: 0.5, ease: INTRO_EASE },
          0.35,
        );
      }
      if (lede) {
        intro.to(
          lede,
          { autoAlpha: 1, y: 0, duration: 0.45, ease: INTRO_EASE },
          0.5,
        );
      }
      if (actions) {
        intro.to(
          actions,
          { autoAlpha: 1, y: 0, duration: 0.45, ease: INTRO_EASE },
          0.65,
        );
      }

      let skipArmed = false;
      const armSkip = window.setTimeout(() => {
        skipArmed = true;
      }, 480);

      const finishIntro = () => {
        if (!skipArmed) return;
        if (intro.isActive() || intro.progress() < 1) intro.progress(1);
      };

      window.addEventListener('wheel', finishIntro, { passive: true });
      window.addEventListener('touchmove', finishIntro, { passive: true });
      window.addEventListener('keydown', finishIntro, { passive: true });

      return () => {
        window.clearTimeout(armSkip);
        window.removeEventListener('wheel', finishIntro);
        window.removeEventListener('touchmove', finishIntro);
        window.removeEventListener('keydown', finishIntro);
        document.body.style.overflow = '';
        delete root.dataset.heroIntro;
      };
    },
    { scope: rootRef, dependencies: [canEnhanceMotion], revertOnUpdate: true },
  );

  return (
    <div
      ref={rootRef}
      className="cc-ed-hero-scene cc-ed-hero-scene--enhanced"
      data-testid="editorial-hero-scene"
      data-motion-pattern="section-enter"
      data-motion-owner="gsap"
      data-hero-intro={canEnhanceMotion ? undefined : 'done'}
    >
      <div ref={trackRef} className="cc-ed-hero-scene__track">
        <div ref={stageRef} className="cc-ed-hero-scene__stage">
          <div className="cc-ed-hero-scene__hero">
            <div className="cc-ed-hero-scene__hero-inner">{hero}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

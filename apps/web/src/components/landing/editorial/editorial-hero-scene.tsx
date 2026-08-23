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

type HeroInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  radius: number;
};

/** Settled inset hero before scroll cinema opens to full-bleed. */
function settledInsets(mobile: boolean): HeroInsets {
  return {
    top: mobile ? 10 : 14,
    right: mobile ? 10 : 16,
    bottom: mobile ? 10 : 14,
    left: mobile ? 10 : 16,
    radius: mobile ? 22 : 28,
  };
}

function clipFrom(i: HeroInsets) {
  return `inset(${i.top}px ${i.right}px ${i.bottom}px ${i.left}px round ${i.radius}px)`;
}

const INTRO_DURATION = 1.25;
const INTRO_DELAY = 0.05;
/** Matches cubic-bezier(0.16, 1, 0.3, 1) — premium ease-out, no overshoot. */
const INTRO_EASE = 'power3.out';

/**
 * Load: CSS expands the framed panel on first paint; GSAP staggers copy/nav.
 * Scroll: settled inset → full-bleed. Statement cinema lives elsewhere.
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
      const closedClip = clipFrom(settledInsets(mobile));

      const heroCopy = stage.querySelector<HTMLElement>('.cc-ed-hero__content');
      const media = stage.querySelector<HTMLElement>('.cc-ed-hero__media');
      const eyebrow = stage.querySelector<HTMLElement>('.cc-ed-hero .cc-ed__eyebrow');
      const headline = stage.querySelector<HTMLElement>('.cc-ed-hero .cc-ed__display');
      const lede = stage.querySelector<HTMLElement>('.cc-ed-hero .cc-ed__lede');
      const actions = stage.querySelector<HTMLElement>('.cc-ed-hero .cc-ed__actions');
      const navPill = document.querySelector<HTMLElement>(
        '.cc-marketing-shell .cc-marketing-nav-shell .cc-nav-veil',
      );

      const contentBits = [eyebrow, headline, lede, actions].filter(
        (el): el is HTMLElement => Boolean(el),
      );

      const settleStageClip = () => {
        // Hand off from CSS @keyframes to GSAP-owned clip-path for scroll cinema.
        stage.style.animation = 'none';
        gsap.set(stage, { clipPath: closedClip });
      };

      const buildScrollCinema = () => {
        settleStageClip();
        root.dataset.heroIntro = 'done';

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
        settleStageClip();
        gsap.set(contentBits, { clearProps: 'opacity,visibility,transform' });
        if (media) gsap.set(media, { clearProps: 'opacity,visibility,transform' });
        if (navPill) gsap.set(navPill, { clearProps: 'opacity,visibility,transform' });
        buildScrollCinema();
        return;
      }

      root.dataset.heroIntro = 'running';

      // Container expand is CSS-driven (visible before GSAP hydrates).
      // GSAP only owns content/nav stagger + the later scroll cinema.
      if (media) gsap.set(media, { autoAlpha: 0.75, scale: 1.015 });
      if (contentBits.length) {
        gsap.set(contentBits, { autoAlpha: 0, y: 14 });
      }
      if (navPill) gsap.set(navPill, { autoAlpha: 0, y: -8 });

      const intro = gsap.timeline({
        delay: INTRO_DELAY,
        onComplete: buildScrollCinema,
      });

      // Keep timeline length aligned with CSS expand even though clip is CSS-owned.
      intro.to({}, { duration: INTRO_DURATION }, 0);

      if (media) {
        intro.to(
          media,
          {
            autoAlpha: 1,
            scale: 1,
            duration: INTRO_DURATION * 0.85,
            ease: INTRO_EASE,
          },
          0.12,
        );
      }

      if (navPill) {
        intro.to(
          navPill,
          { autoAlpha: 1, y: 0, duration: 0.55, ease: INTRO_EASE },
          0.25,
        );
      }

      if (eyebrow) {
        intro.to(
          eyebrow,
          { autoAlpha: 1, y: 0, duration: 0.5, ease: INTRO_EASE },
          0.32,
        );
      }
      if (headline) {
        intro.to(
          headline,
          { autoAlpha: 1, y: 0, duration: 0.55, ease: INTRO_EASE },
          0.4,
        );
      }
      if (lede) {
        intro.to(
          lede,
          { autoAlpha: 1, y: 0, duration: 0.5, ease: INTRO_EASE },
          0.55,
        );
      }
      if (actions) {
        intro.to(
          actions,
          { autoAlpha: 1, y: 0, duration: 0.5, ease: INTRO_EASE },
          0.7,
        );
      }

      // Soft skip after expand has started — load-noise wheel events won't cancel it.
      let skipArmed = false;
      const armSkip = window.setTimeout(() => {
        skipArmed = true;
      }, 420);

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
        if (navPill) {
          gsap.set(navPill, { clearProps: 'opacity,visibility,transform' });
        }
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

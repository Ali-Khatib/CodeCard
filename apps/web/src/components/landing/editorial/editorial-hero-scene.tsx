'use client';

import { useRef, useState, type ReactNode } from 'react';
import { ShaderHeroBackdrop } from '@/components/ui/shader-hero';
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

function cardClip(mobile: boolean) {
  const y = mobile ? 10 : 16;
  const x = mobile ? 12 : 18;
  const r = mobile ? 26 : 40;
  return `inset(${y}px ${x}px ${y}px ${x}px round ${r}px)`;
}

function beatIndexFromProgress(progress: number) {
  if (progress >= 0.7) return 2;
  if (progress >= 0.44) return 1;
  return 0;
}

/**
 * Hero card grows into the photo, then three beats load over it
 * (IntegratedBio blend + growth — clip-path + long scrub, no cream wipe).
 */
export function EditorialHeroScene({ hero, statement }: EditorialHeroSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();
  const [shaderLive, setShaderLive] = useState(false);
  const shaderStarted = useRef(false);
  useScrollTriggerRefresh();

  useGSAP(
    () => {
      if (!canEnhanceMotion) return;
      ensureGsapPlugins();

      const track = trackRef.current;
      const stage = stageRef.current;
      const statementEl = statementRef.current;
      if (!track || !stage || !statementEl) return;

      const media = stage.querySelector<HTMLElement>('.cc-ed-hero__media');
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
      if (chrome) gsap.set(chrome, { autoAlpha: 0, y: 18 });
      beats.forEach((beat) => {
        gsap.set(beat, {
          autoAlpha: 0,
          y: 36,
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
          end: mobile ? '+=310%' : '+=400%',
          scrub: 0.75,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          markers: gsapMarkersEnabled(),
          onUpdate: (self) => {
            const shouldShow = self.progress > 0.02;
            if (shouldShow !== shaderStarted.current) {
              shaderStarted.current = shouldShow;
              setShaderLive(shouldShow);
            }
            syncPager(self.progress);
          },
        },
      });

      tl.fromTo(
        stage,
        { clipPath: closedClip },
        { clipPath: openClip, duration: 0.34 },
        0,
      );

      if (media) {
        tl.fromTo(
          media,
          { scale: 1.04 },
          { scale: mobile ? 1.1 : 1.16, duration: 1 },
          0,
        );
        tl.to(media, { autoAlpha: 0, duration: 0.12 }, 0.02);
      }

      if (heroCopy) {
        tl.to(
          heroCopy,
          { yPercent: mobile ? -8 : -12, autoAlpha: 0, duration: 0.2 },
          0.08,
        );
      }

      tl.to(statementEl, { autoAlpha: 1, duration: 0.12 }, 0.22);

      if (chrome) {
        tl.to(chrome, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.24);
      }

      beats.forEach((beat, i) => {
        const start = 0.22 + i * 0.26;
        tl.fromTo(
          beat,
          { autoAlpha: 0, y: 28, clipPath: 'inset(0% 0% 100% 0%)' },
          {
            autoAlpha: 1,
            y: 0,
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.12,
          },
          start,
        );
        if (i < BEAT_COUNT - 1) {
          tl.to(
            beat,
            { autoAlpha: 0, y: -16, duration: 0.1 },
            start + 0.18,
          );
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
          {canEnhanceMotion ? (
            <div
              className={
                shaderLive
                  ? 'cc-ed-hero-scene__shader is-live'
                  : 'cc-ed-hero-scene__shader'
              }
              data-hero-shader
              aria-hidden
            >
              {shaderLive ? <ShaderHeroBackdrop /> : null}
            </div>
          ) : null}
          <div ref={statementRef} className="cc-ed-hero-scene__statement">
            {statement}
          </div>
        </div>
      </div>
    </div>
  );
}

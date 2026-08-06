'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import {
  ensureGsapPlugins,
  gsap,
  gsapMarkersEnabled,
} from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { MOTION_EASE } from '@/components/motion/motion-tokens';
import { useResponsiveScrollScene } from '@/hooks/use-responsive-scroll-scene';
import { useScrollTriggerRefresh } from '@/hooks/use-scroll-trigger-refresh';
import { IdentityProductCard, type IdentityProductState } from './identity-product-card';

const PIN_VH = { desktop: 175, tablet: 135 } as const;
const PIN_START = 'top 88px';
const STAGE_ENTER_SLACK = 0.02;
const STAGE_EXIT_SLACK = 0.03;

const STAGES: { id: IdentityProductState; title: string; body: string }[] = [
  {
    id: 'profile',
    title: 'Profile',
    body: 'Everything important, immediately visible.',
  },
  {
    id: 'projects',
    title: 'Projects',
    body: 'Show what you built—not merely where you worked.',
  },
  {
    id: 'research',
    title: 'Research',
    body: 'Give papers, methods and results a proper home.',
  },
  {
    id: 'analytics',
    title: 'Impact',
    body: 'Know what people viewed, opened and shared.',
  },
];

/**
 * Chapter 3 — Inspect four CodeCard states through one persistent product frame.
 */
export function IdentityInspect() {
  const rootRef = useRef<HTMLElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();
  const { mode, canPin } = useResponsiveScrollScene();
  useScrollTriggerRefresh({ contentKey: mode });

  useGSAP(
    () => {
      if (!canEnhanceMotion || mode === 'reduced') return;
      const root = rootRef.current;
      if (!root) return;

      ensureGsapPlugins();
      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px)', () => {
        const pinShell = root.querySelector<HTMLElement>('[data-inspect-pin]');
        const track = root.querySelector<HTMLElement>('[data-inspect-track]');
        const steps = gsap.utils.toArray<HTMLElement>('[data-inspect-step]', root);
        const frame = root.querySelector<HTMLElement>('[data-inspect-frame]');
        if (!pinShell || !track || !frame) return;

        const stageCount = STAGES.length;
        const pinVh = window.matchMedia('(min-width: 1024px)').matches
          ? PIN_VH.desktop
          : PIN_VH.tablet;

        gsap.set(track, { yPercent: 0 });

        let activeStage = -1;

        const setActive = (index: number) => {
          const i = Math.max(0, Math.min(stageCount - 1, index));
          if (i === activeStage) return;
          activeStage = i;
          steps.forEach((step, idx) => {
            step.dataset.active = idx === i ? 'true' : undefined;
          });
          frame.dataset.stage = STAGES[i]?.id ?? 'profile';
          root.dataset.activeStage = String(i);
        };

        setActive(0);

        const resolveStage = (progress: number) => {
          const span = 1 / stageCount;
          const ideal = Math.min(
            stageCount - 1,
            Math.floor(Math.min(progress, 0.999) / span),
          );
          if (ideal === activeStage) return activeStage;
          if (ideal > activeStage) {
            const enterAt = (activeStage + 1) * span + STAGE_ENTER_SLACK * span;
            return progress >= enterAt ? ideal : activeStage;
          }
          const exitAt = activeStage * span - STAGE_EXIT_SLACK * span;
          return progress <= exitAt ? ideal : activeStage;
        };

        const tl = gsap.timeline({
          defaults: { ease: MOTION_EASE.inOut },
          scrollTrigger: {
            id: 'identity-inspect-pin',
            trigger: pinShell,
            start: PIN_START,
            end: `+=${pinVh}%`,
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
            onUpdate: (self) => {
              setActive(resolveStage(self.progress));
            },
          },
        });

        for (let i = 0; i < stageCount; i += 1) {
          tl.to(
            track,
            {
              yPercent: -((100 / stageCount) * i),
              duration: 1,
            },
            i,
          );
        }
        tl.to({}, { duration: 0.35 });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    {
      scope: rootRef,
      dependencies: [canEnhanceMotion, mode, canPin],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      ref={rootRef}
      id="inspect"
      className="cc-id-inspect scroll-mt-28"
      data-testid="identity-inspect"
      data-scene-mode={mode}
      data-active-stage="0"
      data-motion-owner="gsap"
    >
      <div className="cc-container">
        <header>
          <p className="cc-id__eyebrow">The inspection</p>
          <h2 className="cc-id__heading">Inspect the product.</h2>
          <p className="cc-id__body max-w-[42ch]">
            One persistent CodeCard frame. Four states. Scroll to shift focus.
          </p>
        </header>
      </div>

      <div className="cc-id-inspect__pin cc-container" data-inspect-pin data-testid="identity-inspect-pin">
        <div className="cc-id-inspect__grid">
          <ol className="cc-id-inspect__steps" aria-label="CodeCard states">
            {STAGES.map((stage, index) => (
              <li
                key={stage.id}
                className="cc-id-inspect__step"
                data-inspect-step
                data-active={index === 0 ? 'true' : undefined}
              >
                <h3>{stage.title}</h3>
                <p>{stage.body}</p>
              </li>
            ))}
          </ol>

          <div
            className="cc-id-inspect__frame"
            data-inspect-frame
            data-stage="profile"
            data-testid="identity-inspect-frame"
          >
            <div className="cc-id-inspect__frame-viewport">
              <div className="cc-id-inspect__frame-track" data-inspect-track>
                {STAGES.map((stage) => (
                  <div key={stage.id} className="cc-id-inspect__frame-panel">
                    <IdentityProductCard state={stage.id} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cc-container cc-id-inspect__mobile" data-testid="identity-inspect-mobile">
        {STAGES.map((stage) => (
          <article
            key={stage.id}
            className="cc-id-inspect__mobile-block"
            data-inspect-mobile-block
            data-stage={stage.id}
          >
            <h3>{stage.title}</h3>
            <p>{stage.body}</p>
            <IdentityProductCard state={stage.id} />
          </article>
        ))}
      </div>
    </section>
  );
}

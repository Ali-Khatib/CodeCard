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
import { CinematicProgress } from './cinematic-progress';
import { PRODUCT_SHOWCASE_STAGES } from './cinematic-previews';

const STAGE_COPY = [
  {
    title: 'Profile',
    body: 'A clear professional identity — role, location, and the story behind the work.',
  },
  {
    title: 'Projects',
    body: 'Featured builds with outcomes first: demos, repos, and the stack that shipped.',
  },
  {
    title: 'Research',
    body: 'Papers, abstracts, and citations live beside the systems they prove.',
  },
  {
    title: 'Sharing',
    body: 'One link and QR — recruiters and collaborators open the same living card.',
  },
  {
    title: 'Analytics',
    body: 'See what resonates: views, saves, and engagement without a separate dashboard tour.',
  },
] as const;

function ProductFramePanels() {
  return (
    <div className="cc-cinematic-frame__viewport" data-cinematic-frame-viewport>
      <div className="cc-cinematic-frame__track" data-cinematic-frame-track>
        <article className="cc-cinematic-panel" data-stage="0" data-testid="cinematic-panel-profile">
          <div className="cc-cinematic-panel__avatar" aria-hidden />
          <h3>Jordan Lee</h3>
          <p>Staff Engineer · Platform · Remote</p>
          <p className="cc-cinematic-panel__muted">
            One identity for projects, research, and proof.
          </p>
        </article>
        <article className="cc-cinematic-panel" data-stage="1" data-testid="cinematic-panel-projects">
          <p className="cc-cinematic-panel__kicker">Featured work</p>
          <h3>DevFlow</h3>
          <p>CI/CD pipelines that actually make sense.</p>
          <ul>
            <li>Live demo</li>
            <li>GitHub</li>
            <li>Case study</li>
          </ul>
        </article>
        <article className="cc-cinematic-panel" data-stage="2" data-testid="cinematic-panel-research">
          <p className="cc-cinematic-panel__kicker">Research</p>
          <h3>Attention under load</h3>
          <p>Abstract, PDF, citations — next to the system that implements it.</p>
        </article>
        <article className="cc-cinematic-panel" data-stage="3" data-testid="cinematic-panel-sharing">
          <p className="cc-cinematic-panel__kicker">Share</p>
          <h3>Link + QR</h3>
          <div className="cc-cinematic-panel__qr" aria-hidden>
            <span className="cc-cinematic-panel__qr-scan" />
          </div>
          <p>One destination for every intro.</p>
        </article>
        <article className="cc-cinematic-panel" data-stage="4" data-testid="cinematic-panel-analytics">
          <p className="cc-cinematic-panel__kicker">Analytics</p>
          <h3>What people open</h3>
          <svg
            className="cc-cinematic-panel__chart"
            viewBox="0 0 160 64"
            aria-hidden
            data-cinematic-chart
          >
            <path
              d="M4 52 C 28 48, 36 20, 56 28 S 96 8, 120 18 S 148 40, 156 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              pathLength="1"
              data-cinematic-chart-path
            />
          </svg>
          <p className="cc-cinematic-panel__stats">
            <strong data-cinematic-metric>1.2k</strong> views ·{' '}
            <strong data-cinematic-metric>86</strong> saves
          </p>
        </article>
      </div>
    </div>
  );
}

/**
 * Scene Two — Sticky product showcase across five feature stages.
 * Desktop/tablet: one pinned frame + scrubbed panel track.
 * Mobile / reduced: vertical independent feature blocks.
 */
export function ProductShowcaseScene() {
  const rootRef = useRef<HTMLElement>(null);
  const progressLabelRef = useRef<HTMLSpanElement>(null);
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
        const pinShell = root.querySelector<HTMLElement>('[data-cinematic-showcase-pin]');
        const track = root.querySelector<HTMLElement>('[data-cinematic-frame-track]');
        const steps = gsap.utils.toArray<HTMLElement>('[data-cinematic-step]', root);
        const dots = gsap.utils.toArray<HTMLElement>('[data-cinematic-dot]', root);
        const frame = root.querySelector<HTMLElement>('[data-cinematic-frame]');
        const chartPath = root.querySelector<SVGPathElement>('[data-cinematic-chart-path]');
        if (!pinShell || !track || !frame) return;

        const stageCount = PRODUCT_SHOWCASE_STAGES.length;
        const pinVh = window.matchMedia('(min-width: 1024px)').matches ? 220 : 160;

        gsap.set(track, { yPercent: 0 });
        if (chartPath) gsap.set(chartPath, { strokeDasharray: 1, strokeDashoffset: 1 });

        const setActive = (index: number) => {
          const i = Math.max(0, Math.min(stageCount - 1, index));
          steps.forEach((step, idx) => {
            step.dataset.active = idx === i ? 'true' : undefined;
          });
          dots.forEach((dot, idx) => {
            dot.dataset.active = idx === i ? 'true' : undefined;
            dot.dataset.done = idx < i ? 'true' : undefined;
          });
          frame.dataset.stage = String(i);
          if (progressLabelRef.current) {
            progressLabelRef.current.textContent = PRODUCT_SHOWCASE_STAGES[i] ?? '';
          }
          root.dataset.activeStage = String(i);
        };

        setActive(0);

        const tl = gsap.timeline({
          defaults: { ease: MOTION_EASE.inOut },
          scrollTrigger: {
            id: 'cinematic-showcase-pin',
            trigger: pinShell,
            start: 'top top',
            end: `+=${pinVh}%`,
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
            onUpdate: (self) => {
              const idx = Math.min(
                stageCount - 1,
                Math.floor(self.progress * stageCount * 0.999),
              );
              setActive(idx);
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
          if (i === stageCount - 1 && chartPath) {
            tl.to(chartPath, { strokeDashoffset: 0, duration: 0.8 }, i + 0.15);
          }
        }
        // Settle on final stage before unpin
        tl.to({}, { duration: 0.4 });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      mm.add('(max-width: 767px)', () => {
        const blocks = gsap.utils.toArray<HTMLElement>('[data-cinematic-mobile-block]', root);
        blocks.forEach((block) => {
          gsap.fromTo(
            block,
            { y: 20, opacity: 0.55 },
            {
              y: 0,
              opacity: 1,
              ease: MOTION_EASE.out,
              scrollTrigger: {
                id: `cinematic-showcase-mobile-${block.dataset.stage ?? 'x'}`,
                trigger: block,
                start: 'top 85%',
                end: 'top 55%',
                scrub: 0.4,
                invalidateOnRefresh: true,
              },
            },
          );
        });
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
      id="product-showcase"
      className="cc-cinematic-showcase scroll-mt-28"
      data-testid="cinematic-showcase-scene"
      data-scene-mode={mode}
      data-active-stage="0"
      data-motion-owner="gsap"
      data-cinematic-runtime="landing"
    >
      <div className="cc-container">
        <header className="cc-cinematic-showcase__header">
          <p className="cc-cinematic-eyebrow">The product</p>
          <h2 className="cc-cinematic-heading">One living CodeCard for every intro.</h2>
          <p className="cc-cinematic-body">
            Profile, projects, research, sharing, and analytics — the same frame, updated as you
            scroll.
          </p>
        </header>
      </div>

      {/* Desktop / tablet sticky pin shell */}
      <div
        className="cc-cinematic-showcase__pin cc-container"
        data-cinematic-showcase-pin
        data-testid="cinematic-showcase-pin"
      >
        <div className="cc-cinematic-showcase__grid">
          <ol className="cc-cinematic-showcase__steps" aria-label="Product features">
            {STAGE_COPY.map((stage, index) => (
              <li
                key={stage.title}
                className="cc-cinematic-showcase__step"
                data-cinematic-step
                data-active={index === 0 ? 'true' : undefined}
              >
                <span className="cc-cinematic-showcase__step-index" aria-hidden>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3>{stage.title}</h3>
                  <p>{stage.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="cc-cinematic-showcase__frame-col">
            <div
              className="cc-cinematic-frame"
              data-cinematic-frame
              data-stage="0"
              data-testid="cinematic-product-frame"
            >
              <ProductFramePanels />
            </div>
            <div className="cc-cinematic-progress" data-testid="cinematic-progress">
              {PRODUCT_SHOWCASE_STAGES.map((label, index) => (
                <span
                  key={label}
                  className="cc-cinematic-progress__dot"
                  data-cinematic-dot
                  data-active={index === 0 ? 'true' : undefined}
                  title={label}
                  aria-hidden
                />
              ))}
              <span className="cc-cinematic-progress__label" ref={progressLabelRef} aria-hidden>
                {PRODUCT_SHOWCASE_STAGES[0]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / reduced: independent vertical states */}
      <div
        className="cc-container cc-cinematic-showcase__mobile"
        data-testid="cinematic-showcase-mobile"
      >
        {STAGE_COPY.map((stage, index) => (
          <article
            key={stage.title}
            className="cc-cinematic-showcase__mobile-block"
            data-cinematic-mobile-block
            data-stage={String(index)}
          >
            <h3>{stage.title}</h3>
            <p>{stage.body}</p>
            <div
              className="cc-cinematic-frame cc-cinematic-frame--static"
              data-stage={String(index)}
              data-testid={`cinematic-mobile-frame-${index}`}
            >
              <div className="cc-cinematic-panel" style={{ padding: '24px' }}>
                <p className="cc-cinematic-panel__kicker">{stage.title}</p>
                <h3>{stage.title}</h3>
                <p>{stage.body}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Keep CinematicProgress import used for contract + optional SSR hint */}
      <span className="sr-only">
        <CinematicProgress stages={PRODUCT_SHOWCASE_STAGES} activeIndex={0} />
      </span>
    </section>
  );
}

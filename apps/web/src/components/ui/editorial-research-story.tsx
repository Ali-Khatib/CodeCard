'use client';

import { useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import {
  ensureGsapPlugins,
  gsap,
  gsapMarkersEnabled,
  ScrollTrigger,
} from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { MOTION_EASE } from '@/components/motion/motion-tokens';
import { useScrollTriggerRefresh } from '@/hooks/use-scroll-trigger-refresh';

export type EditorialResearchBeat = {
  id: string;
  index: string;
  marker: string;
  /** Full phrase for screen readers */
  problemTitle: string;
  problemLead: string;
  problemSub: string;
  researchBody: string;
  solutionBody: string;
};

type StoryPhase = 'problem' | 'research' | 'solution';

type StoryStep = {
  id: string;
  beat: EditorialResearchBeat;
  phase: StoryPhase;
  eyebrow: string;
  headline: string;
  body: string;
};

const PHASE_LABEL: Record<StoryPhase, string> = {
  problem: 'The problem',
  research: 'The research',
  solution: 'The solution',
};

function buildSteps(beats: EditorialResearchBeat[]): StoryStep[] {
  return beats.flatMap((beat) => [
    {
      id: `${beat.id}-problem`,
      beat,
      phase: 'problem' as const,
      eyebrow: PHASE_LABEL.problem,
      headline: beat.problemTitle,
      body: beat.problemTitle,
    },
    {
      id: `${beat.id}-research`,
      beat,
      phase: 'research' as const,
      eyebrow: PHASE_LABEL.research,
      headline: beat.marker,
      body: beat.researchBody,
    },
    {
      id: `${beat.id}-solution`,
      beat,
      phase: 'solution' as const,
      eyebrow: PHASE_LABEL.solution,
      headline: 'CodeCard',
      body: beat.solutionBody,
    },
  ]);
}

function CodeCardSolutionCopy({ text }: { text: string }) {
  const parts = text.split(/(CodeCard)/g);
  return (
    <p className="cc-ed-research-story__body" data-research-reveal>
      {parts.map((part, i) =>
        part === 'CodeCard' ? (
          <span key={i} className="cc-ed-research-story__brand">
            CodeCard
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

function StorySlide({ step }: { step: StoryStep }) {
  const isSolution = step.phase === 'solution';

  return (
    <article
      className={
        isSolution
          ? 'cc-ed-research-story__slide cc-ed-research-story__slide--solution'
          : 'cc-ed-research-story__slide'
      }
      data-testid={`editorial-proof-box-${step.beat.id}-${step.phase}`}
      aria-label={`${step.eyebrow}: ${step.beat.marker}`}
    >
      <div className="cc-ed-research-story__panel">
        <p className="cc-ed-research-story__eyebrow" data-research-reveal>
          {step.eyebrow}
        </p>
        <p className="cc-ed-research-story__marker" data-research-reveal>
          {step.beat.index} · {step.beat.marker}
        </p>

        {step.phase === 'problem' ? (
          <h3
            className="cc-ed-research-story__headline-stack"
            data-research-reveal
            aria-label={step.beat.problemTitle}
          >
            <span className="cc-ed-research-story__headline-line">
              {step.beat.problemLead}
            </span>
            <span className="cc-ed-research-story__headline-line cc-ed-research-story__headline-line--accent">
              {step.beat.problemSub}
            </span>
          </h3>
        ) : null}

        {step.phase === 'research' ? (
          <>
            <h3
              className="cc-ed-research-story__headline cc-ed-research-story__headline--research"
              data-research-reveal
            >
              {step.beat.marker}
            </h3>
            <p className="cc-ed-research-story__body" data-research-reveal>
              {step.body}
            </p>
          </>
        ) : null}

        {step.phase === 'solution' ? (
          <>
            <p className="cc-ed-research-story__solution-kicker" data-research-reveal>
              The answer
            </p>
            <CodeCardSolutionCopy text={step.body} />
          </>
        ) : null}
      </div>
    </article>
  );
}

export function EditorialResearchStory({ beats }: { beats: EditorialResearchBeat[] }) {
  const steps = useMemo(() => buildSteps(beats), [beats]);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLSpanElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();
  useScrollTriggerRefresh();
  const [activeStep, setActiveStep] = useState(0);

  useGSAP(
    () => {
      if (!canEnhanceMotion) return;
      ensureGsapPlugins();

      const pin = pinRef.current;
      const track = trackRef.current;
      const progressBar = progressRef.current;
      const indexLabel = indexRef.current;
      if (!pin || !track) return;

      const slides = gsap.utils.toArray<HTMLElement>(
        track.querySelectorAll('.cc-ed-research-story__slide'),
      );
      if (slides.length === 0) return;

      const setStepVisuals = (rawIndex: number) => {
        const index = Math.max(0, Math.min(slides.length - 1, Math.round(rawIndex)));

        slides.forEach((slide, i) => {
          const distance = Math.abs(i - rawIndex);
          const opacity = Math.max(0, 1 - distance * 0.85);
          const y = (i - rawIndex) * 28;
          gsap.set(slide, {
            opacity,
            x: 0,
            y,
            scale: 1,
            pointerEvents: distance < 0.35 ? 'auto' : 'none',
          });
        });

        if (progressBar) {
          gsap.set(progressBar, {
            scaleX: (index + 1) / slides.length,
          });
        }
        if (indexLabel) {
          indexLabel.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
        }

        return index;
      };

      let lastStep = 0;
      setActiveStep(0);
      setStepVisuals(0);

      const st = ScrollTrigger.create({
        trigger: pin,
        start: 'top top',
        end: () => `+=${Math.max(window.innerHeight * slides.length * 0.82, slides.length * 580)}`,
        pin: true,
        scrub: 0.55,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        markers: gsapMarkersEnabled(),
        onUpdate(self) {
          const raw = self.progress * (slides.length - 1);
          const index = setStepVisuals(raw);
          if (index !== lastStep) {
            lastStep = index;
            setActiveStep(index);
          }
        },
      });

      return () => {
        st.kill();
      };
    },
    { scope: pinRef, dependencies: [canEnhanceMotion, steps.length], revertOnUpdate: true },
  );

  if (!canEnhanceMotion) {
    return (
      <div className="cc-ed-research-story cc-ed-research-story--static">
        <div className="cc-ed-research-story__static-grid">
          {steps.map((step) => (
            <StorySlide key={step.id} step={step} />
          ))}
        </div>
      </div>
    );
  }

  const bgIndex = steps[activeStep]?.beat.index ?? '01';

  return (
    <div className="cc-ed-research-story" data-testid="editorial-research-story">
      <div ref={pinRef} className="cc-ed-research-story__pin">
        <div className="cc-ed-research-story__bg-index" aria-hidden>
          {bgIndex}
        </div>

        <div className="cc-ed-research-story__viewport">
          <div ref={trackRef} className="cc-ed-research-story__track">
            {steps.map((step) => (
              <StorySlide key={step.id} step={step} />
            ))}
          </div>
        </div>

        <div className="cc-ed-research-story__progress" aria-hidden>
          <div className="cc-ed-research-story__progress-meta">
            <span ref={indexRef}>
              {String(activeStep + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
            </span>
            <span>Keep scrolling</span>
          </div>
          <div className="cc-ed-research-story__progress-track">
            <div ref={progressRef} className="cc-ed-research-story__progress-bar" />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE } from '@/lib/projects/demo-data';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { TYPE } from '@/lib/design/tokens';
import { SectionCounter } from './section-counter';
import { ScrollReveal } from './scroll-reveal';
import { AuroraDivider } from './aurora-divider';

const STEPS = [
  { title: 'Tap or scan', detail: 'NFC badge or shareable link. No app install required.' },
  { title: 'Profile opens', detail: 'Identity, role, and availability load in under a second.' },
  { title: 'Featured work surfaces', detail: 'Projects appear as large cards with media, stack, and outcomes.' },
  { title: 'Filter by domain', detail: 'Visitors narrow featured work by domain or focus area.' },
  { title: 'Project expands', detail: 'Tap a card for screenshots, video, and proof in one view.' },
  { title: 'Save the connection', detail: 'Visitors bookmark profiles after conferences or intros.' },
  { title: 'Add private context', detail: 'Where you met and private notes stay visible only to you.' },
] as const;

/** Viewport heights of scroll runway per step */
const STEP_SCROLL_VH = 72;

export function HowItWorksSection() {
  const reducedMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const runwayRef = useRef<HTMLDivElement>(null);
  const project = DEMO_FEATURED_PROJECTS[0];

  useEffect(() => {
    if (reducedMotion) return;

    const onScroll = () => {
      const runway = runwayRef.current;
      if (!runway) return;

      const rect = runway.getBoundingClientRect();
      const stepPx = window.innerHeight * (STEP_SCROLL_VH / 100);
      const scrolled = Math.max(0, -rect.top);
      const index = Math.min(STEPS.length - 1, Math.max(0, Math.floor(scrolled / stepPx)));
      setActiveStep(index);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [reducedMotion]);

  const step = STEPS[activeStep];
  const progressPct = (activeStep / Math.max(STEPS.length - 1, 1)) * 100;

  return (
    <div id="how-it-works" className="scroll-mt-28 py-[100px] md:py-[120px]">
      <section className="cc-container pb-12">
        <ScrollReveal>
          <SectionCounter index="04" label="How it works" />
          <h2 className={`mt-6 ${TYPE.sectionHeading} text-phosphor`}>
            Tap → profile → <span className="cc-text-reactor">project.</span>
          </h2>
          <p className="mt-6 max-w-[640px] text-[18px] text-lichen">
            Seven steps from first tap to saved connection, designed for conferences, intros, and async sharing.
          </p>
        </ScrollReveal>
      </section>

      <AuroraDivider className="cc-container mb-12" />

      <section className="cc-container">
        <div
          ref={runwayRef}
          className="grid gap-12 md:grid-cols-[minmax(280px,340px)_1fr] md:gap-16"
          style={{ minHeight: `${STEPS.length * STEP_SCROLL_VH}vh` }}
        >
          <ScrollReveal className="md:sticky md:top-28 md:self-start" scale={0.96}>
            <motion.div
              className="cc-surface-card overflow-hidden p-3"
              animate={{
                rotateZ: reducedMotion ? 0 : activeStep % 2 === 0 ? -1.5 : 1.5,
                scale: reducedMotion ? 1 : 1 + activeStep * 0.008,
              }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <PhoneMock step={activeStep} projectTitle={project.title} />
            </motion.div>
            <p className="mt-4 text-center text-[14px] text-fog">
              Step {activeStep + 1} of {STEPS.length}
            </p>
          </ScrollReveal>

          <div className="relative">
            <div className="absolute bottom-0 left-[11px] top-0 w-px bg-border/60" aria-hidden />
            <div
              className="absolute left-[11px] top-0 w-px bg-reactor transition-[height] duration-500 ease-out"
              style={{
                height: `${progressPct}%`,
                boxShadow: '0 0 12px rgba(147, 130, 255, 0.5)',
              }}
              aria-hidden
            />

            <div className="sticky top-28 pl-10">
              <span
                className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-reactor bg-reactor/20 text-[12px] font-medium text-phosphor"
                aria-hidden
              >
                {activeStep + 1}
              </span>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeStep}
                  initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-[13px] font-medium text-fog">Step {activeStep + 1}</p>
                  <p className="mt-1 font-display text-[22px] font-medium text-lilac-white md:text-[26px]">
                    {step.title}
                  </p>
                  <p className="mt-2 max-w-[480px] text-[16px] text-ash">{step.detail}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function HowItWorksPage() {
  return (
    <div className="pb-16 pt-[96px]">
      <HowItWorksSection />
    </div>
  );
}

function PhoneMock({ step, projectTitle }: { step: number; projectTitle: string }) {
  const labels = ['Tap NFC', 'Profile', 'Featured', 'Filters', 'Expanded', 'Saved', 'Notes'];

  return (
    <div className="overflow-hidden rounded-[12px] border border-border/40 bg-void-canvas">
      <div className="border-b border-border/40 px-3 py-2 text-[13px] text-fog">codecard.app</div>
      <div className="aspect-[9/16] p-3">
        <div className="flex h-full flex-col rounded-[10px] border border-border/30 bg-midnight p-3 shadow-rim">
          <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-reactor">{labels[step] ?? 'Live'}</p>
          <p className="mt-2 font-display text-[17px] font-medium text-lilac-white">{DEMO_PROFILE.display_name}</p>
          <p className="mt-1 text-[13px] text-ash">{DEMO_PROFILE.headline}</p>
          {step >= 2 && (
            <div className="mt-3 flex-1 rounded-link border border-reactor/25 bg-fern/60 p-3">
              <p className="text-[11px] uppercase tracking-wide text-fog">Featured</p>
              <p className="mt-2 text-[14px] font-medium text-lilac-white">{projectTitle}</p>
              {step >= 4 && (
                <div className="mt-3 space-y-2">
                  <div className="h-2 w-full rounded bg-reactor/20" />
                  <div className="h-2 w-4/5 rounded bg-reactor/15" />
                  <div className="h-2 w-3/5 rounded bg-reactor/10" />
                </div>
              )}
            </div>
          )}
          {step >= 6 && (
            <p className="mt-2 rounded-[8px] border border-dashed border-border/50 p-2 text-[12px] text-fog">
              Met at DevConf · private note
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

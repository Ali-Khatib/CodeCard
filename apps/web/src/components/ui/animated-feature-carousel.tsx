'use client';

import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { cn } from '@/lib/cn';

export type FeatureCarouselStep = {
  id: string;
  name: string;
  title: string;
  description: string;
  /** One or two image URLs for this beat. */
  images: string[];
};

function useNumberCycler(totalSteps: number, interval: number, enabled: boolean) {
  const [currentNumber, setCurrentNumber] = useState(0);

  useEffect(() => {
    setCurrentNumber((prev) => (totalSteps === 0 ? 0 : prev % totalSteps));
  }, [totalSteps]);

  useEffect(() => {
    if (!enabled || totalSteps <= 1) return;
    const timerId = window.setTimeout(() => {
      setCurrentNumber((prev) => (prev + 1) % totalSteps);
    }, interval);
    return () => window.clearTimeout(timerId);
  }, [currentNumber, totalSteps, interval, enabled]);

  const setStep = useCallback(
    (stepIndex: number) => {
      if (totalSteps <= 0) return;
      setCurrentNumber(((stepIndex % totalSteps) + totalSteps) % totalSteps);
    },
    [totalSteps],
  );

  return { currentNumber, setStep };
}

function IconCheck({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      className={cn('h-4 w-4', className)}
      aria-hidden
      {...props}
    >
      <path d="m229.66 77.66-128 128a8 8 0 0 1-11.32 0l-56-56a8 8 0 0 1 11.32-11.32L96 188.69 218.34 66.34a8 8 0 0 1 11.32 11.32Z" />
    </svg>
  );
}

const stepVariants: Variants = {
  inactive: { opacity: 0.55 },
  active: { opacity: 1 },
};

function StepsNav({
  steps: stepItems,
  current,
  onChange,
}: {
  steps: readonly FeatureCarouselStep[];
  current: number;
  onChange: (index: number) => void;
}) {
  return (
    <nav aria-label="Showcase sections" className="flex justify-center px-1">
      <ol
        className="flex w-full flex-wrap items-center justify-center gap-2"
        role="tablist"
        aria-label="Project showcase sections"
      >
        {stepItems.map((step, stepIdx) => {
          const isCompleted = current > stepIdx;
          const isCurrent = current === stepIdx;
          return (
            <motion.li
              key={step.id}
              initial="inactive"
              animate={isCurrent ? 'active' : 'inactive'}
              variants={stepVariants}
              transition={{ duration: 0.22 }}
              className="relative"
            >
              <button
                type="button"
                role="tab"
                id={`case-study-tab-${step.id}`}
                aria-selected={isCurrent}
                aria-controls={`case-study-panel-${step.id}`}
                tabIndex={isCurrent ? 0 : -1}
                className={cn(
                  'group flex min-h-11 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-300',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--iris,#c094e4)] focus-visible:ring-offset-2',
                  isCurrent
                    ? 'bg-[color:var(--ink)] text-[color:var(--paper)]'
                    : 'border border-[color:var(--line-soft)] bg-transparent text-[color:var(--smoke)] hover:border-[color:color-mix(in_srgb,var(--ink)_25%,transparent)] hover:text-[color:var(--ink)]',
                )}
                onClick={() => onChange(stepIdx)}
                onFocus={() => onChange(stepIdx)}
                onKeyDown={(event) => {
                  if (
                    event.key !== 'ArrowRight' &&
                    event.key !== 'ArrowLeft' &&
                    event.key !== 'ArrowDown' &&
                    event.key !== 'ArrowUp'
                  ) {
                    return;
                  }
                  event.preventDefault();
                  const delta =
                    event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
                  const next = (stepIdx + delta + stepItems.length) % stepItems.length;
                  onChange(next);
                  window.requestAnimationFrame(() => {
                    document.getElementById(`case-study-tab-${stepItems[next]?.id}`)?.focus();
                  });
                }}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] transition-all duration-300',
                    isCurrent
                      ? 'bg-white/20 text-[color:var(--paper)]'
                      : isCompleted
                        ? 'bg-[color:var(--ink)] text-[color:var(--paper)]'
                        : 'bg-[color:var(--line-soft)] text-[color:var(--smoke)]',
                  )}
                >
                  {isCompleted ? <IconCheck className="h-3.5 w-3.5" /> : <span>{stepIdx + 1}</span>}
                </span>
                <span className="hidden max-w-[12ch] truncate sm:inline-block">{step.title}</span>
              </button>
            </motion.li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepMedia({
  images,
  title,
  reducedMotion,
}: {
  images: string[];
  title: string;
  reducedMotion?: boolean;
}) {
  const imgs = images.filter(Boolean);
  if (imgs.length === 0) {
    return (
      <div
        className="aspect-[4/3] w-full min-w-0 rounded-2xl bg-[linear-gradient(145deg,color-mix(in_srgb,var(--iris,#c094e4)_12%,var(--paper)),var(--paper))]"
        aria-hidden
      />
    );
  }

  if (imgs.length === 1 || imgs[0] === imgs[1]) {
    return (
      <motion.div
        className="relative aspect-[4/3] w-full min-w-0 overflow-hidden rounded-2xl bg-[color:var(--charcoal,#ece7df)]"
        initial={reducedMotion ? false : { opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducedMotion ? 0.12 : 0.45 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgs[0]!}
          alt=""
          className="h-full w-full max-w-full object-cover"
          draggable={false}
        />
      </motion.div>
    );
  }

  return (
    <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:gap-4">
      {imgs.slice(0, 2).map((src, index) => (
        <motion.div
          key={`${src}-${index}`}
          className={cn(
            'relative min-w-0 overflow-hidden rounded-2xl bg-[color:var(--charcoal,#ece7df)]',
            index === 0 ? 'aspect-[3/4]' : 'aspect-[3/4] mt-4 sm:mt-10',
          )}
          initial={reducedMotion ? false : { opacity: 0.55 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0.12 : 0.45, delay: reducedMotion ? 0 : index * 0.06 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-full w-full max-w-full object-cover" draggable={false} />
        </motion.div>
      ))}
      <span className="sr-only">{title} visuals</span>
    </div>
  );
}

export function FeatureCarousel({
  steps,
  interval = 5500,
  autoPlay = true,
  reducedMotion = false,
  onStepChange,
  className,
}: {
  steps: readonly FeatureCarouselStep[];
  interval?: number;
  autoPlay?: boolean;
  reducedMotion?: boolean;
  onStepChange?: (step: FeatureCarouselStep, index: number) => void;
  className?: string;
}) {
  const { currentNumber: step, setStep } = useNumberCycler(
    steps.length,
    interval,
    autoPlay && !reducedMotion && steps.length > 1,
  );

  useEffect(() => {
    const active = steps[step];
    if (active) onStepChange?.(active, step);
  }, [step, steps, onStepChange]);

  if (steps.length === 0) return null;

  const active = steps[step]!;

  return (
    <div className={cn('mx-auto flex w-full max-w-5xl min-w-0 flex-col gap-7 overflow-x-clip sm:gap-9', className)}>
      <div className="w-full min-w-0 overflow-hidden rounded-[28px] border border-[color:var(--line-soft)] bg-[color:var(--paper)] shadow-[0_20px_50px_rgba(35,35,36,0.08)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            id={`case-study-panel-${active.id}`}
            role="tabpanel"
            aria-labelledby={`case-study-tab-${active.id}`}
            className="grid min-w-0 gap-0 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.12 : 0.35 }}
          >
            {/* Copy — always on solid paper, never over photos */}
            <div className="relative z-[1] flex min-w-0 flex-col justify-center gap-4 bg-[color:var(--paper)] px-5 py-7 sm:px-8 sm:py-10 md:px-10 md:py-12">
              <p className="font-eyebrow text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--smoke)]">
                {active.name}
              </p>
              <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.03em] break-words text-[color:var(--ink)]">
                {active.title}
              </h2>
              <p className="max-w-[36ch] break-words text-[15px] leading-[1.65] text-[color:var(--smoke)] sm:text-[16px]">
                {active.description}
              </p>
            </div>

            {/* Media — separate column, no overlap with text */}
            <div className="min-w-0 border-t border-[color:var(--line-soft)] bg-[color:var(--page,#f7f1ea)] px-4 py-5 sm:px-7 sm:py-8 md:border-l md:border-t-0 md:px-8 md:py-10 dark:bg-[color:color-mix(in_srgb,var(--paper)_88%,#000)]">
              <StepMedia
                images={active.images}
                title={active.title}
                reducedMotion={reducedMotion}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <StepsNav current={step} onChange={setStep} steps={steps} />
    </div>
  );
}

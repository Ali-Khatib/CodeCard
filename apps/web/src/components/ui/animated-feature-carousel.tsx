'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useState,
  type ComponentProps,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  type MotionStyle,
  type MotionValue,
  type Variants,
} from 'motion/react';
import { cn } from '@/lib/cn';

type WrapperStyle = MotionStyle & {
  '--x': MotionValue<string>;
  '--y': MotionValue<string>;
};

export type FeatureCarouselStep = {
  id: string;
  name: string;
  title: string;
  description: string;
  /** One or two image URLs for this beat. */
  images: string[];
};

type StepImageProps = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
};

const ANIMATION_PRESETS = {
  fadeInScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { type: 'spring' as const, stiffness: 300, damping: 25, mass: 0.5 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { type: 'spring' as const, stiffness: 300, damping: 25, mass: 0.5 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { type: 'spring' as const, stiffness: 300, damping: 25, mass: 0.5 },
  },
} as const;

type AnimationPreset = keyof typeof ANIMATION_PRESETS;

const IMAGE_FRAME =
  'rounded-xl border border-[color:var(--line-soft)] shadow-[0_24px_60px_rgba(35,35,36,0.14)] object-cover';

const DUAL_LAYOUT = {
  primary: 'w-[52%] left-0 top-[12%]',
  secondary: 'w-[58%] left-[38%] top-[34%]',
} as const;

const SINGLE_LAYOUT = 'w-[90%] left-[5%] top-[18%]';

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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  return isMobile;
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
  inactive: { scale: 0.96, opacity: 0.72 },
  active: { scale: 1, opacity: 1 },
};

const StepImage = forwardRef<HTMLImageElement, StepImageProps>(
  ({ src, alt, className, style, ...props }, ref) => (
    // Decorative showcase frames — alt provided by caller for the beat.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      alt={alt}
      className={className}
      src={src}
      style={{ position: 'absolute', userSelect: 'none', maxWidth: 'unset', ...style }}
      {...props}
    />
  ),
);
StepImage.displayName = 'StepImage';

const MotionStepImage = motion.create(StepImage);

function AnimatedStepImage({
  preset = 'fadeInScale',
  delay = 0,
  reducedMotion,
  ...props
}: StepImageProps & { preset?: AnimationPreset; delay?: number; reducedMotion?: boolean }) {
  if (reducedMotion) {
    return <StepImage {...props} />;
  }
  const presetConfig = ANIMATION_PRESETS[preset];
  return (
    <MotionStepImage
      {...props}
      initial={presetConfig.initial}
      animate={presetConfig.animate}
      exit={presetConfig.exit}
      transition={{ ...presetConfig.transition, delay }}
    />
  );
}

function FeatureCard({
  children,
  step,
  steps,
  reducedMotion,
}: {
  children: ReactNode;
  step: number;
  steps: readonly FeatureCarouselStep[];
  reducedMotion?: boolean;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlightX = useMotionTemplate`${mouseX}px`;
  const spotlightY = useMotionTemplate`${mouseY}px`;
  const isMobile = useIsMobile();
  const active = steps[step];

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    if (isMobile) return;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  if (!active) return null;

  return (
    <motion.div
      className="animated-cards group relative w-full rounded-2xl"
      onMouseMove={handleMouseMove}
      style={{ '--x': spotlightX, '--y': spotlightY } as WrapperStyle}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-[28px] border border-[color:var(--line-soft)] bg-paper',
          'shadow-[0_24px_70px_rgba(35,35,36,0.12)]',
          'before:pointer-events-none before:absolute before:inset-0 before:z-[1] before:opacity-0 before:transition-opacity before:duration-300',
          'before:bg-[radial-gradient(420px_circle_at_var(--x)_var(--y),rgba(192,148,228,0.18),transparent_55%)]',
          'group-hover:before:opacity-100',
        )}
      >
        <div className="relative m-6 min-h-[420px] w-auto sm:m-8 md:m-10 md:min-h-[450px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              className="relative z-[2] flex w-full flex-col gap-3 md:w-[52%] md:gap-4"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: reducedMotion ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="font-eyebrow text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--iris,#c094e4)]">
                {active.name}
              </p>
              <h2 className="text-[clamp(1.65rem,3.2vw,2.15rem)] font-semibold tracking-[-0.04em] text-ink md:text-[1.95rem]">
                {active.title}
              </h2>
              <p className="max-w-[38ch] text-[15px] leading-relaxed text-smoke md:text-[16px]">
                {active.description}
              </p>
            </motion.div>
          </AnimatePresence>
          {children}
        </div>
      </div>
    </motion.div>
  );
}

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
              transition={{ duration: 0.28 }}
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
                    ? 'bg-[color:var(--iris,#c094e4)] text-white shadow-[0_10px_26px_rgba(192,148,228,0.35)]'
                    : 'border border-[color:var(--line-soft)] bg-paper text-smoke hover:border-[color:var(--iris,#c094e4)] hover:text-ink',
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
                      ? 'bg-white/30 text-white'
                      : isCompleted
                        ? 'bg-[color:var(--iris,#c094e4)] text-white'
                        : 'bg-[color:var(--hume-lavender-mist,#ebe6f4)] text-smoke group-hover:bg-[color:var(--iris,#c094e4)]/25 group-hover:text-ink',
                  )}
                >
                  {isCompleted ? <IconCheck className="h-3.5 w-3.5" /> : <span>{stepIdx + 1}</span>}
                </span>
                <span className="hidden sm:inline-block">{step.title}</span>
              </button>
            </motion.li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepVisuals({
  step,
  reducedMotion,
}: {
  step: FeatureCarouselStep;
  reducedMotion?: boolean;
}) {
  const imgs = step.images.filter(Boolean);
  if (imgs.length === 0) {
    return (
      <div
        className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(circle_at_72%_40%,rgba(192,148,228,0.2),transparent_52%),linear-gradient(150deg,var(--paper),var(--hume-lavender-mist)_58%,var(--hume-cream))]"
        aria-hidden
      />
    );
  }

  if (imgs.length === 1) {
    return (
      <div className="pointer-events-none absolute inset-0">
        <AnimatedStepImage
          alt=""
          className={cn(IMAGE_FRAME, SINGLE_LAYOUT, 'h-[70%]')}
          src={imgs[0]!}
          preset="fadeInScale"
          reducedMotion={reducedMotion}
        />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0">
      <AnimatedStepImage
        alt=""
        className={cn(IMAGE_FRAME, DUAL_LAYOUT.primary, 'h-[58%]')}
        src={imgs[0]!}
        preset="slideInLeft"
        reducedMotion={reducedMotion}
      />
      <AnimatedStepImage
        alt=""
        className={cn(IMAGE_FRAME, DUAL_LAYOUT.secondary, 'h-[52%]')}
        src={imgs[1]!}
        preset="slideInRight"
        delay={0.1}
        reducedMotion={reducedMotion}
      />
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
    <div className={cn('mx-auto flex w-full max-w-4xl flex-col gap-8 p-1 sm:gap-10', className)}>
      <FeatureCard step={step} steps={steps} reducedMotion={reducedMotion}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            className="absolute inset-0"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.35 }}
          >
            <div
              id={`case-study-panel-${active.id}`}
              role="tabpanel"
              aria-labelledby={`case-study-tab-${active.id}`}
              className="absolute inset-0"
            >
              <StepVisuals step={active} reducedMotion={reducedMotion} />
            </div>
          </motion.div>
        </AnimatePresence>
      </FeatureCard>
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reducedMotion ? 0 : 0.2 }}
      >
        <StepsNav current={step} onChange={setStep} steps={steps} />
      </motion.div>
    </div>
  );
}

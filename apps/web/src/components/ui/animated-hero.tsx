'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MoveRight, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

const DEFAULT_WORDS = ['DESTINATION', 'STORY', 'PRESENCE', 'IDENTITY'] as const;

type HeroRotatingWordProps = {
  words?: readonly string[];
  intervalMs?: number;
  className?: string;
  wordClassName?: string;
  /** Static label when motion is reduced (defaults to last word). */
  reducedMotionLabel?: string;
};

/** Editorial rotating headline word — spring swap between words. */
export function HeroRotatingWord({
  words = DEFAULT_WORDS,
  intervalMs = 2400,
  className,
  wordClassName,
  reducedMotionLabel,
}: HeroRotatingWordProps) {
  const reduced = useReducedMotion();
  const [titleNumber, setTitleNumber] = useState(0);
  const labels = useMemo(() => [...words], [words]);
  const longestLabel = useMemo(
    () => labels.reduce((longest, word) => (word.length > longest.length ? word : longest), ''),
    [labels],
  );

  useEffect(() => {
    if (reduced || labels.length <= 1) return;
    const timeoutId = window.setTimeout(() => {
      setTitleNumber((current) => (current + 1) % labels.length);
    }, intervalMs);
    return () => window.clearTimeout(timeoutId);
  }, [titleNumber, labels.length, intervalMs, reduced]);

  if (reduced) {
    return (
      <span className={cn('cc-ed-hero__rotating-word cc-ed-hero__rotating-word--static', className)}>
        {reducedMotionLabel ?? labels[labels.length - 1]}
      </span>
    );
  }

  return (
    <span
      className={cn('cc-ed-hero__rotating-slot', className)}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="cc-ed-hero__rotating-measure" aria-hidden="true">
        {longestLabel}
      </span>
      {labels.map((title, index) => (
        <motion.span
          key={title}
          className={cn('cc-ed-hero__rotating-word', wordClassName)}
          initial={{ opacity: 0, y: '-100%' }}
          transition={{ type: 'spring', stiffness: 50, damping: 18 }}
          animate={
            titleNumber === index
              ? { y: 0, opacity: 1 }
              : { y: titleNumber > index ? '-150%' : '150%', opacity: 0 }
          }
        >
          {title}
        </motion.span>
      ))}
    </span>
  );
}

type AnimatedHeroProps = {
  prefix?: string;
  words?: readonly string[];
};

/**
 * Standalone animated hero block (shadcn-style demo layout).
 * Marketing landing uses `HeroRotatingWord` inside `EditorialHero` instead.
 */
export function AnimatedHero({
  prefix = 'ONE',
  words = DEFAULT_WORDS,
}: AnimatedHeroProps) {
  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-center gap-8 py-20 lg:py-40">
          <div>
            <Button variant="secondary" size="sm" className="gap-4">
              Read our launch article <MoveRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="max-w-2xl text-center font-display text-5xl font-normal tracking-tighter md:text-7xl">
              <span className="text-foreground/90">YOUR WORK.</span>
              <span className="relative mt-2 flex w-full flex-wrap items-baseline justify-center gap-x-[0.2em] overflow-hidden text-center md:pb-4 md:pt-1">
                <span>{prefix}</span>
                <HeroRotatingWord words={words} className="min-w-[9ch] md:min-w-[11ch]" />
              </span>
            </h1>
            <p className="max-w-2xl text-center text-lg leading-relaxed tracking-tight text-muted-foreground md:text-xl">
              Projects, research, Circle, and connections — one living technical
              profile you can carry, share, and show on the spot.
            </p>
          </div>
          <div className="flex flex-row gap-3">
            <Button size="lg" className="gap-4" variant="outline">
              Jump on a call <PhoneCall className="h-4 w-4" />
            </Button>
            <Button size="lg" className="gap-4">
              Sign up here <MoveRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { AnimatedHero as Hero };

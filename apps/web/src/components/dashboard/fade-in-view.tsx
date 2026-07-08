'use client';

import { useRef, type ElementType, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;

type FadeInViewProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
  id?: string;
};

export function FadeInView({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  id,
}: FadeInViewProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });
  const reduced = useReducedMotion();
  const MotionTag = motion.create(Tag);

  return (
    <MotionTag
      ref={ref}
      id={id}
      className={className}
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={inView || reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

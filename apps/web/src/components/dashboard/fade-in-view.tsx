'use client';

import { type ElementType, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;

type FadeInViewProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
  id?: string;
};

/**
 * Soft entrance that never hides copy. Home / Projects / Connections / Settings
 * were painting as a blank cream panel while opacity sat at 0 waiting on IO.
 */
export function FadeInView({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  id,
}: FadeInViewProps) {
  const reduced = useReducedMotion();
  const MotionTag = motion.create(Tag);

  return (
    <MotionTag
      id={id}
      className={className}
      initial={reduced ? false : { y: 10 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

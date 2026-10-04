'use client';

import { type ComponentType, type ElementType, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;

type FadeMotionProps = {
  id?: string;
  className?: string;
  children?: ReactNode;
  initial?: false | { y: number };
  animate?: { y: number };
  transition?: {
    duration: number;
    delay: number;
    ease: readonly [number, number, number, number];
  };
};

const motionByTag = new Map<ElementType, ComponentType<FadeMotionProps>>();

/** motion.create() returns a new component type each call — must cache per tag or children remount every render. */
function motionForTag(Tag: ElementType): ComponentType<FadeMotionProps> {
  let cached = motionByTag.get(Tag);
  if (!cached) {
    // ElementType is wider than motion.create's default props, which drop id/className.
    cached = motion.create(Tag) as ComponentType<FadeMotionProps>;
    motionByTag.set(Tag, cached);
  }
  return cached;
}

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
  const MotionTag = motionForTag(Tag);

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

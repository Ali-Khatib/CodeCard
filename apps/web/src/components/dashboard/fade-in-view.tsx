'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;

type FadeInViewProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
  id?: string;
};

/**
 * Scroll-reveal that never leaves content invisible in short iframes / embeds.
 */
export function FadeInView({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  id,
}: FadeInViewProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.01, margin: '0px' });
  const reduced = useReducedMotion();
  const [forceVisible, setForceVisible] = useState(false);
  const MotionTag = motion.create(Tag);

  useEffect(() => {
    // Failsafe: embeds / odd viewports can miss IntersectionObserver.
    const id = window.setTimeout(() => setForceVisible(true), 600);
    return () => window.clearTimeout(id);
  }, []);

  const show = Boolean(reduced || inView || forceVisible);

  return (
    <MotionTag
      ref={ref}
      id={id}
      className={className}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.45, delay: show ? delay : 0, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { HUME_EASE, HUME_MOTION } from '@/lib/motion/hume-motion';

type AppRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
};

export function AppReveal({
  children,
  className = '',
  delay = 0,
  y = 12,
  duration = HUME_MOTION.cardReveal,
}: AppRevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration, delay, ease: HUME_EASE }}
    >
      {children}
    </motion.div>
  );
}

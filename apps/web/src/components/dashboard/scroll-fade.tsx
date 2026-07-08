'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import type { ReactNode } from 'react';

/** Fades children as the user scrolls down the page (profile header on Projects). */
export function ScrollFade({
  children,
  className = '',
  fadeStart = 48,
  fadeEnd = 180,
}: {
  children: ReactNode;
  className?: string;
  fadeStart?: number;
  fadeEnd?: number;
}) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();

  const opacity = useTransform(scrollY, [fadeStart, fadeEnd], [1, 0]);
  const y = useTransform(scrollY, [fadeStart, fadeEnd], [0, -18]);
  const pointerEvents = useTransform(scrollY, (v) => (v > fadeEnd ? 'none' : 'auto'));

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div style={{ opacity, y, pointerEvents }} className={className}>
      {children}
    </motion.div>
  );
}

'use client';

import { CodeCardMarkLink } from '@/components/brand/codecard-mark-link';
import { motion, useReducedMotion } from 'motion/react';

/** Auth brand mark — overlapping CC (same as landing), links home. */
export function AuthWordmark({ delay = 0 }: { delay?: number }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0.01 : 0.2, delay: reduced ? 0 : delay }}
    >
      <CodeCardMarkLink href="/" className="cc-auth-wordmark" testId="auth-wordmark" />
    </motion.div>
  );
}

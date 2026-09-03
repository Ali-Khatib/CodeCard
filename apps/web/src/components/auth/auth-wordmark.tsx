'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import '@/styles/codecard-mark.css';

/** Auth brand mark — overlapping CC (same as landing), links home. */
export function AuthWordmark({ delay = 0 }: { delay?: number }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0.01 : 0.2, delay: reduced ? 0 : delay }}
    >
      <Link
        href="/"
        className="cc-ed-mark-logo cc-auth-mark cc-instant-press"
        aria-label="CodeCard home"
        data-testid="auth-wordmark"
      >
        <span className="cc-ed-mark-logo__inner" aria-hidden>
          <span className="cc-ed-mark-logo__c cc-ed-mark-logo__c--first">C</span>
          <span className="cc-ed-mark-logo__fill cc-ed-mark-logo__fill--left">ode</span>
          <span className="cc-ed-mark-logo__c cc-ed-mark-logo__c--second">C</span>
          <span className="cc-ed-mark-logo__fill cc-ed-mark-logo__fill--right">ard</span>
        </span>
      </Link>
    </motion.div>
  );
}

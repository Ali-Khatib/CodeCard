'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';

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
        className="inline-block text-[21px] font-semibold tracking-[-0.04em] text-[#17171a] outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.45)] focus-visible:ring-offset-2"
        aria-label="CodeCard home"
      >
        CodeCard
      </Link>
    </motion.div>
  );
}

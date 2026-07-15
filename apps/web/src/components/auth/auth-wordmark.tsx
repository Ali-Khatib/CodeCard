'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';

export function AuthWordmark({ delay = 0 }: { delay?: number }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="relative inline-block"
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0.01 : 0.22, delay: reduced ? 0 : delay }}
    >
      <Link
        href="/"
        className="group relative inline-block text-[22px] font-medium tracking-[-0.03em] text-ink outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.55)] focus-visible:ring-offset-2"
        aria-label="CodeCard home"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 translate-x-[1.5px] translate-y-[1.5px] text-[var(--iris)] opacity-55 transition-transform duration-200 ease-out group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:opacity-75 motion-reduce:transition-none"
          style={{ transitionDelay: reduced ? '0ms' : '80ms' }}
        >
          CodeCard
        </span>
        <span className="relative">CodeCard</span>
      </Link>
    </motion.div>
  );
}

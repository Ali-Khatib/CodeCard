'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';

export function AuthWordmark({
  delay = 0,
  variant = 'default',
}: {
  delay?: number;
  variant?: 'default' | 'hero';
}) {
  const reduced = useReducedMotion();
  const isHero = variant === 'hero';

  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: isHero ? 8 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.01 : 0.28, delay: reduced ? 0 : delay, ease: 'easeOut' }}
    >
      <Link
        href="/"
        aria-label="CodeCard home"
        data-testid="auth-wordmark"
        className={
          isHero
            ? 'group relative inline-flex items-center rounded-[18px] border border-white/70 bg-[rgba(255,252,248,0.88)] px-6 py-3.5 shadow-[0_16px_40px_rgba(35,35,36,0.14)] outline-none backdrop-blur-md transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_20px_48px_rgba(35,35,36,0.18)] focus-visible:ring-2 focus-visible:ring-[rgba(233,90,11,0.45)] focus-visible:ring-offset-2'
            : 'inline-block text-[21px] font-semibold tracking-[-0.04em] text-[#17171a] outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.45)] focus-visible:ring-offset-2'
        }
      >
        {isHero ? (
          <span className="relative block text-[34px] font-semibold leading-none tracking-[-0.05em] sm:text-[40px]">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 translate-x-[-2px] translate-y-[-2px] select-none text-[#e95a0b]/65"
            >
              CodeCard
            </span>
            <span className="relative text-[#17171a] transition-colors group-hover:text-[#111111]">
              Code<span className="text-[#e95a0b]">Card</span>
            </span>
          </span>
        ) : (
          'CodeCard'
        )}
      </Link>
    </motion.div>
  );
}

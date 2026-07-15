'use client';

import type { CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Braces,
  Cloud,
  Code2,
  Cpu,
  Database,
  GitBranch,
  Globe,
  Layers,
  Terminal,
  Workflow,
  Zap,
} from 'lucide-react';
import { AuthWordmark } from '@/components/auth/auth-wordmark';
import { CODECARD_TAGLINE } from '@/lib/marketing/positioning';

/** Same float constellation as the landing product hero. */
const FLOAT_ICONS = [
  { Icon: Code2, x: '12%', y: '22%', size: 30, delay: 0, duration: 9 },
  { Icon: GitBranch, x: '86%', y: '18%', size: 32, delay: 0.6, duration: 10 },
  { Icon: Terminal, x: '18%', y: '48%', size: 28, delay: 1.2, duration: 8.5 },
  { Icon: Database, x: '82%', y: '55%', size: 31, delay: 0.3, duration: 11 },
  { Icon: Cpu, x: '72%', y: '30%', size: 25, delay: 1.8, duration: 9.5 },
  { Icon: Layers, x: '28%', y: '32%', size: 24, delay: 0.9, duration: 10.5 },
  { Icon: Globe, x: '62%', y: '62%', size: 27, delay: 1.5, duration: 8 },
  { Icon: Zap, x: '48%', y: '14%', size: 22, delay: 2.1, duration: 7.5 },
  { Icon: Braces, x: '38%', y: '68%', size: 27, delay: 0.45, duration: 9.8 },
  { Icon: Cloud, x: '90%', y: '42%', size: 30, delay: 1.05, duration: 10.8 },
  { Icon: Workflow, x: '8%', y: '38%', size: 28, delay: 1.65, duration: 9.2 },
] as const;

/** Left auth stage: centered landing-style statement + floating tech icons. */
export function AuthShowcaseStage() {
  const reduced = useReducedMotion();

  return (
    <div
      className="relative flex h-full min-h-[420px] w-full flex-col overflow-hidden px-6 py-8 sm:px-10 lg:min-h-screen lg:px-12 lg:py-10"
      data-testid="auth-collage"
    >
      <div className="relative z-[3]">
        <AuthWordmark />
      </div>

      <div className="relative z-[2] flex flex-1 flex-col items-center justify-center py-10">
        {!reduced ? (
          <div className="cc-hume-hero__float-icons pointer-events-none" aria-hidden>
            {FLOAT_ICONS.map(({ Icon, x, y, size, delay, duration }, i) => (
              <span
                key={i}
                className="cc-hume-hero__float-icon"
                data-auth-tech-icon
                style={
                  {
                    left: x,
                    top: y,
                    '--float-size': `${size}px`,
                    '--float-delay': `${delay}s`,
                    '--float-duration': `${duration}s`,
                  } as CSSProperties
                }
              >
                <span className="cc-hume-hero__float-icon-inner">
                  <Icon size={size} strokeWidth={1.55} />
                </span>
              </span>
            ))}
          </div>
        ) : null}

        <motion.div
          className="relative z-[1] mx-auto flex w-full max-w-[520px] flex-col items-center text-center"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.55, ease: 'easeOut' }}
        >
          <h2 className="font-display text-balance text-[clamp(2.35rem,4.6vw,3.65rem)] font-normal leading-[1.05] tracking-[-0.03em] text-[#17171a]">
            Your best work. Ready to{' '}
            <span className="cc-hume-gradient-text">share in seconds.</span>
          </h2>
          <p className="mt-5 max-w-[34ch] text-balance text-[17px] leading-relaxed text-[#5c5956] sm:text-[18px]">
            {CODECARD_TAGLINE}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/** @deprecated Legacy export names kept for existing imports/tests. */
export function AuthDemoBackground() {
  return null;
}

export function AuthFeatureCopy() {
  return null;
}

export function AuthCollage() {
  return <AuthShowcaseStage />;
}

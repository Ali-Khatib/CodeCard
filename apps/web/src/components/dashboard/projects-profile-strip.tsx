'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import type { PortfolioCreator } from '@/lib/dashboard/portfolio';

const EASE = [0.22, 1, 0.36, 1] as const;

export function ProjectsProfileStrip({ creator }: { creator: PortfolioCreator }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { margin: '-8% 0px -35% 0px', amount: 0.45 });
  const reduced = useReducedMotion();
  const roleLine = [creator.role, creator.company].filter(Boolean).join(' · ');

  return (
    <motion.header
      ref={ref}
      className="cc-projects-profile-strip"
      initial={reduced ? false : { opacity: 0, x: -28 }}
      animate={
        reduced
          ? { opacity: 1, x: 0 }
          : { opacity: inView ? 1 : 0, x: inView ? 0 : -20 }
      }
      transition={{ duration: 0.55, ease: EASE }}
    >
      <span className="cc-projects-profile-strip__glow" aria-hidden />
      <div className="cc-projects-profile-strip__avatar-wrap">
        <div className="cc-projects-profile-strip__avatar">
          {creator.avatarUrl ? (
            <Image src={creator.avatarUrl} alt="" fill className="object-cover" sizes="88px" priority />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-medium">
              {creator.displayName?.[0] ?? '?'}
            </span>
          )}
        </div>
      </div>

      <div className="cc-projects-profile-strip__copy">
        <h1 className="cc-projects-profile-strip__name">{creator.displayName}</h1>
        {roleLine && <p className="cc-projects-profile-strip__role">{roleLine}</p>}
      </div>
    </motion.header>
  );
}

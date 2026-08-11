'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import type { FeaturedProject } from '@/lib/projects/featured';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { PublicProjectCard } from './public-project-card';

type PublicProjectStackingProps = {
  projects: FeaturedProject[];
  displayName: string;
  profileId?: string;
  profileSlug?: string;
  demoViews?: Record<string, { views: number; saves: number }>;
};

function StackingCard({
  i,
  project,
  displayName,
  profileId,
  profileSlug,
  views,
  saves,
  progress,
  range,
  targetScale,
  step,
}: {
  i: number;
  project: FeaturedProject;
  displayName: string;
  profileId?: string;
  profileSlug?: string;
  views: number;
  saves: number;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
  step: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress: enterProgress } = useScroll({
    target: container,
    offset: ['start end', 'start start'],
  });

  const scale = useTransform(progress, range, [1, targetScale]);
  // Fade in as the card arrives, hold, then fade out as the next card takes over.
  const enterOpacity = useTransform(enterProgress, [0, 0.35, 1], [0.15, 1, 1]);
  const exitOpacity = useTransform(
    progress,
    [range[0], range[0] + step * 0.55, Math.min(1, range[0] + step * 0.95), 1],
    [1, 1, 0.35, 0.12],
  );
  const opacity = useTransform([enterOpacity, exitOpacity], ([enter, exit]) =>
    Math.min(Number(enter), Number(exit)),
  );

  return (
    <div
      ref={container}
      className="cc-stacking-card sticky top-0 flex h-[100dvh] items-center justify-center px-1 sm:px-0"
    >
      <motion.div
        style={{
          scale,
          opacity,
          top: `calc(-4vh + ${i * 22}px)`,
        }}
        className="cc-stacking-card__panel relative w-[min(100%,860px)] origin-top"
      >
        <PublicProjectCard
          project={project}
          displayName={displayName}
          profileId={profileId}
          profileSlug={profileSlug}
          views={views}
          saves={saves}
          className="cc-stacking-card__project cc-glass-card"
          mediaClassName="overflow-hidden"
        />
      </motion.div>
    </div>
  );
}

/**
 * Sticky stacking project cards (native scroll — no Lenis on public profiles).
 * Falls back to a simple vertical list when reduced motion is preferred.
 */
export function PublicProjectStacking({
  projects,
  displayName,
  profileId,
  profileSlug = 'demo',
  demoViews,
}: PublicProjectStackingProps) {
  const reduceMotion = useReducedMotion();
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  if (reduceMotion) {
    return (
      <div className="flex flex-col gap-8">
        {projects.map((project, index) => (
          <PublicProjectCard
            key={project.id}
            project={project}
            displayName={displayName}
            profileId={profileId}
            profileSlug={profileSlug}
            views={demoViews?.[project.id]?.views ?? 280 + index * 40}
            saves={demoViews?.[project.id]?.saves ?? 24 + index * 8}
            className="cc-glass-card"
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={container} className="cc-stacking-projects relative">
      {projects.map((project, i) => {
        const targetScale = 1 - (projects.length - i) * 0.05;
        const step = projects.length > 1 ? 1 / projects.length : 1;
        return (
          <StackingCard
            key={project.id}
            i={i}
            project={project}
            displayName={displayName}
            profileId={profileId}
            profileSlug={profileSlug}
            views={demoViews?.[project.id]?.views ?? 280 + i * 40}
            saves={demoViews?.[project.id]?.saves ?? 24 + i * 8}
            progress={scrollYProgress}
            range={[i * step, 1]}
            targetScale={targetScale}
            step={step}
          />
        );
      })}
    </div>
  );
}

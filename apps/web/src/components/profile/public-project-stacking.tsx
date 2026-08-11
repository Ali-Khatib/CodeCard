'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import type { FeaturedProject } from '@/lib/projects/featured';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { PublicProjectCard } from './public-project-card';
import { cn } from '@/lib/utils';

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
}) {
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div className="cc-stacking-card sticky top-0 flex h-[100dvh] items-center justify-center px-1 sm:px-0">
      <motion.div
        style={{
          scale,
          top: `calc(-4vh + ${i * 22}px)`,
        }}
        className={cn(
          'cc-stacking-card__panel relative w-[min(100%,920px)] origin-top',
          'max-h-[min(88dvh,780px)] overflow-y-auto overscroll-contain',
          'rounded-[var(--app-radius-large)]',
        )}
      >
        <PublicProjectCard
          project={project}
          displayName={displayName}
          profileId={profileId}
          profileSlug={profileSlug}
          views={views}
          saves={saves}
          className="cc-stacking-card__project shadow-[0_24px_80px_-32px_rgba(34,34,34,0.45)]"
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
          />
        );
      })}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import type { FeaturedProject } from '@/lib/projects/featured';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { PublicProjectCard } from './public-project-card';

const PHONE_SCROLL_QUERY = '(max-width: 1023px), (pointer: coarse)';

function useNativePhoneScroll() {
  const [native, setNative] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(PHONE_SCROLL_QUERY);
    const sync = () => setNative(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return native;
}

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
  isLast,
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
  isLast: boolean;
}) {
  const section = useRef<HTMLDivElement>(null);
  // Local runway: stick fully opaque, then a long scroll-driven fade out (~1s of scrolling).
  const { scrollYProgress: cardProgress } = useScroll({
    target: section,
    offset: ['start start', 'end start'],
  });

  const scale = useTransform(progress, range, [1, targetScale]);
  // No fade-in — cards arrive solid. Only the outgoing card fades away.
  const opacity = useTransform(
    cardProgress,
    isLast ? [0, 1] : [0, 0.42, 0.88, 1],
    isLast ? [1, 1] : [1, 1, 0, 0],
  );

  return (
    <div ref={section} className="cc-stacking-card relative h-[175dvh]">
      <div className="sticky top-0 z-0 flex h-[100dvh] w-full max-w-full items-center justify-center px-2 sm:px-3">
        <motion.div
          style={{
            scale,
            opacity,
            top: `calc(-3vh + ${i * 18}px)`,
          }}
          className="cc-stacking-card__panel relative w-full max-w-[min(100%,1100px)] origin-top"
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
    </div>
  );
}

function FlatProjectList({
  projects,
  displayName,
  profileId,
  profileSlug,
  demoViews,
}: PublicProjectStackingProps) {
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

function StackedProjectList(props: PublicProjectStackingProps) {
  const { projects, displayName, profileId, profileSlug = 'demo', demoViews } = props;
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  return (
    <div ref={container} className="cc-stacking-projects relative">
      {projects.map((project, i) => {
        const targetScale = 1 - (projects.length - i) * 0.04;
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
            isLast={i === projects.length - 1}
          />
        );
      })}
    </div>
  );
}

/**
 * Sticky stacking project cards on fine-pointer desktops.
 * Phones use a normal list so native scrolling isn't fighting 175dvh sticky runways.
 */
export function PublicProjectStacking(props: PublicProjectStackingProps) {
  const reduceMotion = useReducedMotion();
  const nativePhoneScroll = useNativePhoneScroll();

  if (reduceMotion || nativePhoneScroll) {
    return <FlatProjectList {...props} />;
  }

  return <StackedProjectList {...props} />;
}

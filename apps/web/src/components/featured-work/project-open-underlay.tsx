'use client';

import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import type { FeaturedProject } from '@/lib/projects/featured';
import { ProjectMedia } from '@/components/profile/project-media';
import { ProjectDetailView } from './project-detail-view';
import type { ProjectOpenMeta } from './project-open-overlay';

const EASE = [0.22, 1, 0.36, 1] as const;
const EXPAND_MS = 520;
const CROSSFADE_MS = 320;

interface OpenBounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

function ProjectOpenOverlay({
  project,
  bounds,
  phase,
  onExpandComplete,
  onRevealComplete,
}: {
  project: FeaturedProject;
  bounds: OpenBounds;
  phase: 'expanding' | 'revealing';
  onExpandComplete: () => void;
  onRevealComplete: () => void;
}) {
  const phaseRef = useRef(phase);
  const expandDoneRef = useRef(false);
  const revealDoneRef = useRef(false);
  phaseRef.current = phase;

  const target = {
    top: 0,
    left: 0,
    width: typeof window !== 'undefined' ? window.innerWidth : bounds.width,
    height: typeof window !== 'undefined' ? window.innerHeight : bounds.height,
  };

  const isRevealing = phase === 'revealing';

  return createPortal(
    <>
      <motion.div
        className="fixed inset-0 z-[201] bg-void-canvas/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: isRevealing ? 0 : 1 }}
        transition={{ duration: isRevealing ? CROSSFADE_MS / 1000 : 0.22, ease: EASE }}
        aria-hidden
      />
      <motion.div
        className="fixed z-[202] overflow-hidden bg-canvas"
        initial={{
          top: bounds.top,
          left: bounds.left,
          width: bounds.width,
          height: bounds.height,
          borderRadius: 12,
          opacity: 1,
        }}
        animate={{
          top: isRevealing ? target.top : target.top,
          left: isRevealing ? target.left : target.left,
          width: target.width,
          height: target.height,
          borderRadius: isRevealing ? 0 : 0,
          opacity: isRevealing ? 0 : 1,
        }}
        transition={{
          duration: isRevealing ? CROSSFADE_MS / 1000 : EXPAND_MS / 1000,
          ease: EASE,
        }}
        onAnimationComplete={() => {
          if (phaseRef.current === 'expanding' && !expandDoneRef.current) {
            expandDoneRef.current = true;
            onExpandComplete();
          }
          if (phaseRef.current === 'revealing' && !revealDoneRef.current) {
            revealDoneRef.current = true;
            onRevealComplete();
          }
        }}
        role="presentation"
        aria-hidden
        style={{ pointerEvents: isRevealing ? 'none' : 'auto' }}
      >
        {project.posterUrl && (
          <ProjectMedia
            src={project.posterUrl}
            priority
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        )}
        {project.videoUrl && (
          <video
            src={project.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(5,3,15,0.88)_0%,rgba(5,3,15,0.58)_54%,transparent_100%)] p-8 md:p-12">
          <div className="max-w-[680px] rounded-[24px] border border-white/22 bg-black/48 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.38)] backdrop-blur-md">
            <h2 className="cc-fit-title font-display text-[clamp(1.75rem,6vw,2.75rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.72)]">
              {project.title}
            </h2>
            {project.tagline && (
              <p className="mt-2 text-[17px] font-semibold leading-snug text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.62)] md:text-[18px]">
                {project.tagline}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </>,
    document.body,
  );
}

/** Lazy underlay — motion + ProjectDetailView stay out of the marketing critical chunk. */
export function ProjectOpenUnderlay({
  project,
  bounds,
  phase,
  meta,
  onExpandComplete,
  onRevealComplete,
}: {
  project: FeaturedProject;
  bounds: OpenBounds;
  phase: 'expanding' | 'revealing';
  meta: ProjectOpenMeta;
  onExpandComplete: () => void;
  onRevealComplete: () => void;
}): ReactNode {
  return (
    <>
      <div className="fixed inset-0 z-[200] overflow-y-auto bg-void-canvas">
        <ProjectDetailView
          project={project}
          profileSlug={meta.profileSlug}
          displayName={meta.displayName}
          accentColor={meta.accentColor}
          projects={meta.projects}
          transitionHandoff
        />
      </div>
      <ProjectOpenOverlay
        project={project}
        bounds={bounds}
        phase={phase}
        onExpandComplete={onExpandComplete}
        onRevealComplete={onRevealComplete}
      />
    </>
  );
}

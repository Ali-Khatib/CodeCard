'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';
import type { FeaturedProject } from '@/lib/projects/featured';
import {
  normalizeProjectPath,
  setOptimisticProject,
} from '@/lib/navigation/optimistic-project';
import { ProjectMedia } from '@/components/profile/project-media';
import { ProjectDetailView } from './project-detail-view';
import { TYPE } from '@/lib/design/tokens';

const EASE = [0.22, 1, 0.36, 1] as const;
const EXPAND_MS = 520;
const CROSSFADE_MS = 320;
const REVEAL_FALLBACK_MS = 480;

interface OpenBounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ProjectOpenMeta {
  profileSlug: string;
  displayName: string;
  accentColor?: string;
  projects?: FeaturedProject[];
}

interface OpeningState {
  project: FeaturedProject;
  bounds: OpenBounds;
  url: string;
  meta: ProjectOpenMeta;
}

interface ProjectOpenContextValue {
  opening: OpeningState | null;
  open: (
    project: FeaturedProject,
    element: HTMLElement,
    url: string,
    meta: ProjectOpenMeta,
  ) => void;
  close: () => void;
}

const ProjectOpenContext = createContext<ProjectOpenContextValue | null>(null);

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
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-canvas via-canvas/70 to-transparent p-8 md:p-12">
          <h2 className={TYPE.projectTitle}>{project.title}</h2>
          {project.tagline && (
            <p className="mt-2 text-[18px] text-text-secondary">{project.tagline}</p>
          )}
        </div>
      </motion.div>
    </>,
    document.body,
  );
}

function useProjectOpenState() {
  const router = useRouter();
  const pathname = usePathname();
  const [opening, setOpening] = useState<OpeningState | null>(null);
  const [phase, setPhase] = useState<'expanding' | 'revealing'>('expanding');
  const [navigated, setNavigated] = useState(false);
  const revealStartedRef = useRef(false);

  const startReveal = useCallback(() => {
    if (revealStartedRef.current) return;
    revealStartedRef.current = true;
    setPhase('revealing');
  }, []);

  const open = useCallback(
    (project: FeaturedProject, element: HTMLElement, url: string, meta: ProjectOpenMeta) => {
      setOptimisticProject({
        id: project.id,
        title: project.title,
        tagline: project.tagline,
        posterUrl: project.posterUrl,
        videoUrl: project.videoUrl,
        profileSlug: meta.profileSlug,
        displayName: meta.displayName,
        accentColor: meta.accentColor,
      });
      router.prefetch(url);
      document.documentElement.classList.add('cc-project-transition-active');
      const rect = element.getBoundingClientRect();
      revealStartedRef.current = false;
      setPhase('expanding');
      setNavigated(false);
      setOpening({
        project,
        bounds: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        url,
        meta,
      });
      requestAnimationFrame(() => {
        setNavigated(true);
        router.push(url);
      });
    },
    [router],
  );

  const close = useCallback(() => {
    document.documentElement.classList.remove('cc-project-transition-active');
    requestAnimationFrame(() => {
      setOpening(null);
      setPhase('expanding');
      setNavigated(false);
      revealStartedRef.current = false;
    });
  }, []);

  const onProjectPage =
    opening !== null &&
    (normalizeProjectPath(pathname) === normalizeProjectPath(opening.url) ||
      pathname.endsWith(`/projects/${opening.project.id}`));

  useEffect(() => {
    if (!opening || !navigated) return;

    const fallback = window.setTimeout(startReveal, REVEAL_FALLBACK_MS);
    return () => window.clearTimeout(fallback);
  }, [opening, navigated, startReveal]);

  useEffect(() => {
    if (!opening || !onProjectPage) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => startReveal());
    });
    return () => cancelAnimationFrame(id);
  }, [opening, onProjectPage, startReveal]);

  const handleExpandComplete = useCallback(() => {
    if (!revealStartedRef.current) startReveal();
  }, [startReveal]);

  return {
    opening,
    phase,
    open,
    close,
    handleExpandComplete,
    showUnderlay: opening !== null,
  };
}

export function ProjectOpenProvider({ children }: { children: ReactNode }) {
  const { opening, phase, open, close, handleExpandComplete, showUnderlay } =
    useProjectOpenState();

  return (
    <ProjectOpenContext.Provider value={{ opening, open, close }}>
      {children}
      {opening && showUnderlay && (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-void-canvas">
          <ProjectDetailView
            project={opening.project}
            profileSlug={opening.meta.profileSlug}
            displayName={opening.meta.displayName}
            accentColor={opening.meta.accentColor}
            projects={opening.meta.projects}
            transitionHandoff
          />
        </div>
      )}
      {opening && (
        <ProjectOpenOverlay
          project={opening.project}
          bounds={opening.bounds}
          phase={phase}
          onExpandComplete={handleExpandComplete}
          onRevealComplete={close}
        />
      )}
    </ProjectOpenContext.Provider>
  );
}

export function useProjectOpen() {
  const ctx = useContext(ProjectOpenContext);
  if (!ctx) {
    throw new Error('useProjectOpen must be used within ProjectOpenProvider');
  }
  return ctx;
}

export function useProjectOpenOptional() {
  return useContext(ProjectOpenContext);
}

export function isProjectTransitionTarget(
  opening: OpeningState | null | undefined,
  projectId: string,
  pathname: string,
): boolean {
  if (!opening || opening.project.id !== projectId) return false;
  return (
    normalizeProjectPath(pathname) === normalizeProjectPath(opening.url) ||
    pathname.endsWith(`/projects/${projectId}`)
  );
}

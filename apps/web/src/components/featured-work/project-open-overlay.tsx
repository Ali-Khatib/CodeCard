'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { FeaturedProject } from '@/lib/projects/featured';
import {
  normalizeProjectPath,
  setOptimisticProject,
} from '@/lib/navigation/optimistic-project';

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

type UnderlayProps = {
  project: FeaturedProject;
  bounds: OpenBounds;
  phase: 'expanding' | 'revealing';
  meta: ProjectOpenMeta;
  onExpandComplete: () => void;
  onRevealComplete: () => void;
};

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

/**
 * Thin provider shell — motion + ProjectDetailView load only when a project opens.
 */
export function ProjectOpenProvider({ children }: { children: ReactNode }) {
  const { opening, phase, open, close, handleExpandComplete, showUnderlay } =
    useProjectOpenState();
  const [Underlay, setUnderlay] = useState<ComponentType<UnderlayProps> | null>(null);

  useEffect(() => {
    if (!opening || Underlay) return;
    let cancelled = false;
    void import('./project-open-underlay').then((mod) => {
      if (!cancelled) setUnderlay(() => mod.ProjectOpenUnderlay);
    });
    return () => {
      cancelled = true;
    };
  }, [opening, Underlay]);

  return (
    <ProjectOpenContext.Provider value={{ opening, open, close }}>
      {children}
      {opening && showUnderlay && Underlay ? (
        <Underlay
          project={opening.project}
          bounds={opening.bounds}
          phase={phase}
          meta={opening.meta}
          onExpandComplete={handleExpandComplete}
          onRevealComplete={close}
        />
      ) : null}
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

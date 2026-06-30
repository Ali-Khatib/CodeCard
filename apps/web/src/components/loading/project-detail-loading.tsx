'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getOptimisticProject } from '@/lib/navigation/optimistic-project';
import { ProjectDetailSkeleton } from './route-skeletons';
import { ProjectWorkAtmosphere } from '@/components/featured-work/project-work-atmosphere';
import { ProjectMedia } from '@/components/profile/project-media';
import { TYPE } from '@/lib/design/tokens';

/** Instant project shell from card cache, or themed skeleton while RSC loads. */
export function ProjectDetailLoading() {
  const params = useParams();
  const projectId = typeof params?.id === 'string' ? params.id : '';

  const snapshot = useMemo(() => {
    if (!projectId) return null;
    return getOptimisticProject(projectId);
  }, [projectId]);

  useEffect(() => {
    if (!snapshot) return;
    document.documentElement.classList.add('cc-project-transition-active');
    return () => document.documentElement.classList.remove('cc-project-transition-active');
  }, [snapshot]);

  if (!snapshot) {
    return <ProjectDetailSkeleton />;
  }

  const backLabel = snapshot.displayName;

  return (
    <div
      className="relative min-h-[100dvh] text-text-primary"
      aria-busy
      aria-label={`Loading ${snapshot.title}`}
      style={{ '--profile-accent': snapshot.accentColor ?? '#8b5cf6' } as React.CSSProperties}
    >
      <ProjectWorkAtmosphere variant="page" />

      <div className="relative z-[1]">
        <header className="cc-container sticky top-0 z-20 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between rounded-full border border-border/40 bg-midnight/75 px-4 py-2.5 shadow-rim">
            <div className="flex items-center gap-2 px-2 py-1 text-[15px] text-text-secondary">
              <span className="inline-block h-4 w-4 rounded-sm bg-lavender/30" aria-hidden />
              <span className="hidden sm:inline">{backLabel}</span>
            </div>
            <div className="flex gap-2">
              <span className="h-10 w-10 rounded-full bg-midnight/80 ring-1 ring-border/40" aria-hidden />
            </div>
          </div>
        </header>

        <div className="relative w-full overflow-hidden">
          <div className="relative aspect-[16/9] min-h-[min(52vh,520px)] max-h-[min(78vh,880px)] w-full bg-deep-indigo">
            {snapshot.posterUrl && (
              <ProjectMedia src={snapshot.posterUrl} priority className="object-cover object-center" />
            )}
            {snapshot.videoUrl && (
              <video
                src={snapshot.videoUrl}
                poster={snapshot.posterUrl ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void-canvas via-void-canvas/55 to-void-canvas/10" />
            <div className="absolute inset-x-0 bottom-0 cc-container pb-10 pt-28 md:pb-14 md:pt-36">
              <p className={TYPE.eyebrow}>Featured project</p>
              <h1 className={`mt-3 max-w-[14ch] text-balance ${TYPE.projectTitle} text-lilac-white`}>
                {snapshot.title}
              </h1>
              {snapshot.tagline && (
                <p className={`mt-4 max-w-[42ch] ${TYPE.subheading} text-ash`}>{snapshot.tagline}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

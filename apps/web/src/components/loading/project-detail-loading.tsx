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
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(5,3,15,0.9)_0%,rgba(5,3,15,0.62)_40%,rgba(5,3,15,0.28)_72%,rgba(5,3,15,0.1)_100%),linear-gradient(90deg,rgba(5,3,15,0.68)_0%,rgba(5,3,15,0.34)_42%,rgba(5,3,15,0.1)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 cc-container pb-10 pt-28 md:pb-14 md:pt-36">
              <div className="max-w-[680px] rounded-[26px] border border-white/22 bg-black/48 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.42)] backdrop-blur-md md:p-6">
                <p className="font-eyebrow text-[11px] font-semibold uppercase tracking-[0.08em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                  Featured project
                </p>
                <h1 className="cc-fit-title mt-3 max-w-[14ch] font-display text-[clamp(2rem,8vw,3.4rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.72)]">
                  {snapshot.title}
                </h1>
                {snapshot.tagline && (
                  <p className="mt-4 max-w-[42ch] text-[17px] font-semibold leading-snug text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.62)] md:text-[18px]">
                    {snapshot.tagline}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

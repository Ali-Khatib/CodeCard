'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { ChromaItem } from '@/components/react-bits/chroma-grid/chroma-grid';
import type { FeaturedProject } from '@/lib/projects/featured';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useViewTransitionNavigate } from '@/hooks/use-view-transition-navigate';
import { saveScrollForProfile } from '@/hooks/use-scroll-restore';
import { COLORS, TYPE } from '@/lib/design/tokens';

const ChromaGrid = dynamic(() => import('@/components/react-bits/chroma-grid/chroma-grid'), {
  ssr: false,
  loading: () => <div className="h-[480px] animate-pulse rounded-lg bg-surface" />,
});

interface ChromaWorkSectionProps {
  projects: FeaturedProject[];
  profileSlug: string;
  accentColor: string;
}

export function ChromaWorkSection({ projects, profileSlug, accentColor }: ChromaWorkSectionProps) {
  const reducedMotion = useReducedMotion();
  const navigate = useViewTransitionNavigate();

  const items: ChromaItem[] = useMemo(
    () =>
      projects.map((p) => ({
        image: p.posterUrl ?? '',
        title: p.title,
        subtitle: p.tagline ?? p.domains[0] ?? 'Project',
        location: p.domains[0],
        borderColor: accentColor,
        gradient: `linear-gradient(145deg, ${accentColor}22, ${COLORS.canvas})`,
        url: `project:${p.id}`,
      })),
    [projects, accentColor],
  );

  const handleNavigate = (url?: string) => {
    if (!url?.startsWith('project:')) return;
    const id = url.replace('project:', '');
    saveScrollForProfile(profileSlug);
    const base = profileSlug === 'demo' ? '/demo' : `/${profileSlug}`;
    navigate(`${base}/projects/${id}`);
  };

  if (projects.length === 0) return null;

  return (
    <section id="all-work" aria-label="All work" className="py-16 md:py-20">
      <p className={TYPE.eyebrow}>All work</p>
      <h2 className="mt-2 text-[32px] font-semibold tracking-[-0.02em] md:text-[40px]">
        Explore every build
      </h2>

      <div className="mt-8 min-h-[420px]">
        {reducedMotion ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ChromaCardStatic
                key={p.id}
                project={p}
                accentColor={accentColor}
                onOpen={() => handleNavigate(`project:${p.id}`)}
              />
            ))}
          </div>
        ) : (
          <ChromaGrid
            items={items}
            className="min-h-[420px]"
            radius={280}
            damping={0.4}
            onItemClick={handleNavigate}
          />
        )}
      </div>
    </section>
  );
}

function ChromaCardStatic({
  project,
  accentColor,
  onOpen,
}: {
  project: FeaturedProject;
  accentColor: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="overflow-hidden rounded-lg border border-border text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{ background: `linear-gradient(145deg, ${accentColor}18, ${COLORS.surface})` }}
    >
      <div className="aspect-[16/10] overflow-hidden">
        {project.posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.posterUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="p-4">
        <h3 className="text-[17px] font-medium text-text-primary">{project.title}</h3>
        <p className="mt-1 text-[15px] text-text-secondary">{project.tagline}</p>
      </div>
    </button>
  );
}

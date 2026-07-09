'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGroup, motion, AnimatePresence } from 'motion/react';
import type { FeaturedProject } from '@/lib/projects/featured';
import { collectFilterOptions, filterProjects } from '@/lib/projects/featured';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { ScrollProjectCard } from './scroll-project-card';
import { MorphFilterSurface } from '@/components/profile/morph-filter-surface';
import { ProjectWorkAtmosphere } from './project-work-atmosphere';
import { useProjectOpen } from './project-open-overlay';
import { TYPE, COLORS } from '@/lib/design/tokens';

const ACTIVE_THRESHOLD = 0.58;

interface FeaturedWorkStackProps {
  projects: FeaturedProject[];
  profileSlug: string;
  displayName: string;
  accentColor?: string;
  activeId?: string;
  onActiveChange?: (id: string) => void;
  variant?: 'light' | 'dark';
  hideHeader?: boolean;
}

export function FeaturedWorkStack({
  projects,
  profileSlug,
  displayName,
  accentColor = COLORS.reactor,
  activeId: controlledActiveId,
  onActiveChange,
  variant = 'dark',
  hideHeader = false,
}: FeaturedWorkStackProps) {
  const isLight = variant === 'light';
  const reducedMotion = useReducedMotion();
  const { opening, open } = useProjectOpen();
  const [domain, setDomain] = useState<string | null>(null);
  const [focusArea, setFocusArea] = useState<string | null>(null);
  const [proximities, setProximities] = useState<Record<string, number>>({});

  const filterOptions = useMemo(() => collectFilterOptions(projects), [projects]);
  const filtered = useMemo(
    () => filterProjects(projects, domain, focusArea),
    [projects, domain, focusArea],
  );

  const derivedActiveId = useMemo(() => {
    let bestId = filtered[0]?.id ?? '';
    let best = 0;
    for (const p of filtered) {
      const prox = proximities[p.id] ?? 0;
      if (prox > best) {
        best = prox;
        bestId = p.id;
      }
    }
    return best >= ACTIVE_THRESHOLD ? bestId : filtered[0]?.id ?? '';
  }, [filtered, proximities]);

  const activeId = controlledActiveId ?? derivedActiveId;

  const onProximityChange = useCallback(
    (id: string, proximity: number) => {
      setProximities((prev) => (prev[id] === proximity ? prev : { ...prev, [id]: proximity }));
      if (proximity >= ACTIVE_THRESHOLD && onActiveChange) onActiveChange(id);
    },
    [onActiveChange],
  );

  const hasFilters =
    filterOptions.domains.length > 0 || filterOptions.focusAreas.length > 0;

  const anyVideoPlaying = filtered.some(
    (p) => p.id === activeId && (proximities[p.id] ?? 0) >= ACTIVE_THRESHOLD && !!p.videoUrl,
  );

  const projectBase = profileSlug === 'demo' ? '/demo' : `/${profileSlug}`;
  const router = useRouter();

  useEffect(() => {
    for (const project of projects) {
      router.prefetch(`${projectBase}/projects/${project.id}`);
    }
  }, [projects, projectBase, router]);

  return (
    <section aria-label="Featured work" className={`relative ${hideHeader ? 'pb-4' : 'pb-4 pt-8'}`}>
      <ProjectWorkAtmosphere variant="section" />
      <div
        className="relative z-[1]"
        style={{ pointerEvents: opening ? 'none' : 'auto' }}
      >
      {!hideHeader && (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {!isLight && <p className={TYPE.eyebrow}>Featured work</p>}
            <h2
              className={`mt-2 font-display text-[32px] leading-[1.1] tracking-[-0.02em] md:text-[46px] ${
                isLight ? 'text-on-light' : 'text-text-primary'
              }`}
            >
              What I&apos;ve built
            </h2>
          </div>
          {hasFilters && (
            <MorphFilterSurface
              domains={filterOptions.domains}
              focusAreas={filterOptions.focusAreas}
              domain={domain}
              focusArea={focusArea}
              onDomainChange={setDomain}
              onFocusAreaChange={setFocusArea}
              accentColor={accentColor}
            />
          )}
        </div>
      )}

      {hideHeader && hasFilters && (
        <div className="mb-6 flex justify-end">
          <MorphFilterSurface
            domains={filterOptions.domains}
            focusAreas={filterOptions.focusAreas}
            domain={domain}
            focusArea={focusArea}
            onDomainChange={setDomain}
            onFocusAreaChange={setFocusArea}
            accentColor={accentColor}
          />
        </div>
      )}

      <LayoutGroup id={`featured-${profileSlug}`}>
        <motion.div layout className="flex flex-col gap-6 md:gap-10">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                data-project-id={project.id}
                initial={false}
                exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.97 }}
                transition={{
                  layout: { type: 'spring', stiffness: 420, damping: 36 },
                  opacity: { duration: 0.2 },
                }}
                className={`flex items-center ${index === 0 ? 'min-h-[min(72vh,820px)]' : 'min-h-[min(60vh,720px)]'} py-4`}
              >
                <ScrollProjectCard
                  project={project}
                  profileSlug={profileSlug}
                  isActive={project.id === activeId}
                  isOnlyActiveVideo={project.id === activeId && anyVideoPlaying}
                  proximity={proximities[project.id] ?? 0}
                  reducedMotion={reducedMotion}
                  accentColor={accentColor}
                  onProximityChange={onProximityChange}
                  onOpen={
                    reducedMotion
                      ? undefined
                      : (element) =>
                          open(project, element, `${projectBase}/projects/${project.id}`, {
                            profileSlug,
                            displayName,
                            accentColor,
                            projects: filtered,
                          })
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-text-secondary">No projects match this filter.</p>
      )}
      </div>
    </section>
  );
}

'use client';

import { useCallback, useMemo } from 'react';
import {
  FeatureCarousel,
  type FeatureCarouselStep,
} from '@/components/ui/animated-feature-carousel';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  caseStudyMediaForSection,
  caseStudyTextForSection,
  hasShowcaseExtras,
  visibleCaseStudySections,
} from '@/lib/projects/case-study-sections';
import type { FeaturedProject } from '@/lib/projects/featured';

function projectShots(project: FeaturedProject): string[] {
  const shots = [
    ...(project.posterUrl ? [project.posterUrl] : []),
    ...project.screenshots,
  ];
  return shots.filter((shot, index) => shot && shots.indexOf(shot) === index);
}

function imagesForSection(
  project: FeaturedProject,
  mediaUrl: string | null,
  index: number,
): string[] {
  const trimmed = mediaUrl?.trim();
  if (trimmed) return [trimmed];
  const own = projectShots(project);
  if (own.length === 0) return [];
  const first = own[index % own.length]!;
  const second = own[(index + 1) % own.length]!;
  return first === second ? [first] : [first, second];
}

export function ProjectCaseStudyTabs({
  project,
  onSectionInteract,
}: {
  project: FeaturedProject;
  onSectionInteract?: (sectionName: string) => void;
}) {
  const reduced = useReducedMotion();
  const showcaseEnabled = hasShowcaseExtras(project);
  const visibleSections = useMemo(() => visibleCaseStudySections(project), [project]);

  const steps: FeatureCarouselStep[] = useMemo(
    () =>
      visibleSections.map((section, index) => {
        const text = caseStudyTextForSection(project, section.id);
        const media = caseStudyMediaForSection(project, section.id);
        return {
          id: section.id,
          name: section.eyebrow,
          title: section.label,
          description: text ?? section.summary,
          images: imagesForSection(project, media, index),
        };
      }),
    [project, visibleSections],
  );

  const handleStepChange = useCallback(
    (step: FeatureCarouselStep) => {
      onSectionInteract?.(step.title);
    },
    [onSectionInteract],
  );

  if (!showcaseEnabled || steps.length === 0) {
    return null;
  }

  return (
    <section
      className="mb-8 mt-6 md:mb-14 md:mt-14"
      data-testid="project-case-study-carousel"
      aria-label="Project showcase"
    >
      <div className="mb-6 px-1 md:mb-8">
        <p className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--app-ink,#232324)] md:text-[11px]">
          Extra showcase
        </p>
        {project.tagline ? (
          <p className="mt-2 max-w-2xl font-display text-[clamp(1.35rem,2.8vw,1.75rem)] font-medium leading-snug tracking-[-0.02em] text-[var(--app-ink,#232324)]">
            {project.tagline}
          </p>
        ) : (
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--app-muted,#5c5856)] md:text-[15px]">
            Optional story beats. Tap through each section of the work.
          </p>
        )}
      </div>
      <FeatureCarousel
        steps={steps}
        reducedMotion={reduced}
        onStepChange={handleStepChange}
      />
    </section>
  );
}

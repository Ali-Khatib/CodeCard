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

/** Stable Unsplash fallbacks when a section has no media (design fill only). */
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1618761714954-0b8cd0026356?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1607705703571-c5a8695f18f6?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542393545-10f5cde2c810?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=1200&auto=format&fit=crop',
] as const;

function imagesForSection(mediaUrl: string | null, index: number): string[] {
  const trimmed = mediaUrl?.trim();
  if (trimmed) return [trimmed];
  // Distinct pair of fallbacks only when the section has no real media.
  return [
    FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]!,
    FALLBACK_IMAGES[(index + 2) % FALLBACK_IMAGES.length]!,
  ];
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
          images: imagesForSection(media, index),
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
            Optional story beats — tap through each section of the work.
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

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
  const primary = mediaUrl?.trim() || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]!;
  const secondary =
    mediaUrl?.trim() ||
    FALLBACK_IMAGES[(index + 1) % FALLBACK_IMAGES.length]!;
  // Dual layer when we have a real media URL — reuse it for both frames;
  // otherwise show two distinct fallbacks for depth.
  if (mediaUrl?.trim()) {
    return [primary, primary];
  }
  return [primary, secondary];
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
      <div className="mb-5 px-1 text-center md:mb-7">
        <p className="font-eyebrow text-[10px] uppercase tracking-[0.18em] text-smoke md:text-[11px]">
          Extra showcase
        </p>
        {project.tagline ? (
          <p className="mx-auto mt-2 max-w-2xl text-[15px] font-medium leading-snug tracking-[-0.02em] text-ink md:text-[18px]">
            {project.tagline}
          </p>
        ) : (
          <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-smoke md:text-[14px]">
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

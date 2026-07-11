'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ProjectMedia } from '@/components/profile/project-media';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  caseStudyMediaForSection,
  caseStudyTextForSection,
  hasShowcaseExtras,
  visibleCaseStudySections,
  type CaseStudySectionConfig,
  type CaseStudySectionId,
} from '@/lib/projects/case-study-sections';
import type { FeaturedProject } from '@/lib/projects/featured';
import { cn } from '@/lib/cn';

const EASE = [0.22, 1, 0.36, 1] as const;

function TextCaseStudyPanel({
  section,
  body,
}: {
  section: CaseStudySectionConfig;
  body: string;
}) {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(192,148,228,0.22),transparent_32%),linear-gradient(160deg,#07040f,#17112b_58%,#05030a)]">
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(3,0,12,0.94),rgba(3,0,12,0.2)_42%,rgba(3,0,12,0.12))]" />
      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-8">
        <p className="font-eyebrow text-[8px] uppercase tracking-[0.18em] text-lavender/80 md:text-[10px]">
          {section.eyebrow}
        </p>
        <h2 className="mt-2 text-[clamp(1.35rem,5vw,2.5rem)] font-semibold leading-[0.92] tracking-[-0.06em] text-lilac-white md:mt-3">
          {section.label}
        </h2>
        <p className="mt-3 max-w-prose text-[12px] leading-relaxed text-ash md:mt-4 md:text-[15px]">
          {body}
        </p>
      </div>
    </div>
  );
}

function SpotlightHero({ project }: { project: FeaturedProject }) {
  const hero = project.posterUrl ?? project.screenshots[0];
  return (
    <section className="mb-8 mt-6 overflow-hidden rounded-[20px] border border-white/10 bg-[#07040f] shadow-[0_20px_60px_rgba(0,0,0,0.32)] md:mb-14 md:mt-14 md:rounded-[30px]">
      <div className="relative min-h-[220px] overflow-hidden sm:min-h-[280px] md:min-h-[420px]">
        {hero ? (
          <ProjectMedia src={hero} sizes="(max-width: 1024px) 100vw, 960px" className="object-cover object-top" />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#07040f,#241936_58%,#06030c)]" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(3,0,12,0.92),rgba(3,0,12,0.12)_48%,rgba(3,0,12,0.16))]" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <p className="font-eyebrow text-[8px] uppercase tracking-[0.18em] text-lavender/80 md:text-[10px]">
            Project
          </p>
          <h2 className="mt-2 max-w-[12ch] text-[clamp(1.6rem,6vw,5rem)] font-semibold leading-[0.9] tracking-[-0.08em] text-lilac-white">
            {project.title}
          </h2>
          {project.tagline && (
            <p className="mt-3 max-w-prose text-[14px] leading-relaxed text-ash md:text-[18px]">
              {project.tagline}
            </p>
          )}
        </div>
      </div>
    </section>
  );
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
  const [activePartId, setActivePartId] = useState<CaseStudySectionId>(visibleSections[0]?.id ?? 'problem');

  useEffect(() => {
    if (!visibleSections.some((section) => section.id === activePartId)) {
      setActivePartId(visibleSections[0]?.id ?? 'problem');
    }
  }, [activePartId, visibleSections]);

  if (!showcaseEnabled) {
    return <SpotlightHero project={project} />;
  }

  const activePart = visibleSections.find((part) => part.id === activePartId) ?? visibleSections[0]!;
  const activeText = caseStudyTextForSection(project, activePart.id);
  const activeMedia = caseStudyMediaForSection(project, activePart.id);
  const showDemoVideo = activePart.id === 'demo' && project.videoUrl && !activeMedia && !reduced;
  const showTextPanel = Boolean(activeText) && !showDemoVideo && !activeMedia;

  const setActive = (id: CaseStudySectionId, label: string) => {
    setActivePartId(id);
    onSectionInteract?.(label);
  };

  return (
    <section className="mb-8 mt-6 overflow-hidden rounded-[20px] border border-white/10 bg-[#07040f] shadow-[0_20px_60px_rgba(0,0,0,0.32)] md:mb-14 md:mt-14 md:rounded-[30px] md:shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
      <div className="grid overflow-hidden md:rounded-[30px] lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
        <div className="relative min-h-[220px] overflow-hidden sm:min-h-[280px] md:min-h-[520px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${project.id}-${activePart.id}-${activeText ?? activeMedia ?? 'empty'}`}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.02, y: 8 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.99, y: -6 }}
              transition={{ duration: reduced ? 0.18 : 0.4, ease: EASE }}
              className="absolute inset-0"
            >
              {showDemoVideo ? (
                <video
                  src={project.videoUrl ?? undefined}
                  poster={project.posterUrl ?? undefined}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover object-top"
                />
              ) : activeMedia ? (
                <ProjectMedia src={activeMedia} sizes="(max-width: 1024px) 100vw, 720px" className="object-cover object-top" />
              ) : showTextPanel ? (
                <TextCaseStudyPanel section={activePart} body={activeText!} />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#07040f,#241936_58%,#06030c)]" />
              )}
            </motion.div>
          </AnimatePresence>

          {!showTextPanel && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(3,0,12,0.88),rgba(3,0,12,0.1)_45%,rgba(3,0,12,0.12))]" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
                <p className="font-eyebrow text-[8px] uppercase tracking-[0.18em] text-lavender/80 md:text-[10px]">
                  {activePart.eyebrow}
                </p>
                <h2 className="mt-2 max-w-[12ch] text-[clamp(1.5rem,5vw,4rem)] font-semibold leading-[0.9] tracking-[-0.08em] text-lilac-white">
                  {activePart.label}
                </h2>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col justify-between border-t border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-3 backdrop-blur-xl sm:p-4 md:p-8 lg:border-l lg:border-t-0">
          <div>
            <p className="font-eyebrow text-[8px] uppercase tracking-[0.18em] text-lavender/80 md:text-[10px]">
              Extra showcase
            </p>
            {project.tagline && (
              <h3 className="mt-3 text-[16px] font-medium leading-snug tracking-[-0.03em] text-lilac-white sm:text-[18px] md:mt-5 md:text-[24px]">
                {project.tagline}
              </h3>
            )}
          </div>

          <div className="mt-4 md:mt-8">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1 lg:gap-2">
              {visibleSections.map(({ id, label, Icon }) => {
                const active = id === activePart.id;
                return (
                  <button
                    key={id}
                    type="button"
                    onMouseEnter={() => setActive(id, label)}
                    onFocus={() => setActive(id, label)}
                    onClick={() => setActive(id, label)}
                    className={cn(
                      'flex min-w-0 items-center gap-1.5 rounded-[12px] border px-2 py-1.5 text-left transition-all duration-200 lg:gap-3 lg:rounded-[20px] lg:px-4 lg:py-3',
                      active
                        ? 'border-lavender/35 bg-lavender/15 text-lilac-white shadow-[0_10px_30px_rgba(192,148,228,0.12)]'
                        : 'border-white/8 bg-white/[0.035] text-ash opacity-70 hover:opacity-100',
                    )}
                    aria-pressed={active}
                  >
                    <Icon className={cn('h-3.5 w-3.5 shrink-0 lg:h-5 lg:w-5', active && 'text-lavender')} aria-hidden />
                    <span className="truncate text-[11px] font-medium leading-tight lg:text-[15px]">{label}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={activePart.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mt-3 min-h-[36px] text-[12px] leading-relaxed text-ash md:mt-4 md:text-[14px]"
              >
                {activeText ?? activePart.summary}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

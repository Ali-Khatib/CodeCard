'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ProjectMedia } from '@/components/profile/project-media';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  CASE_STUDY_SECTIONS,
  caseStudyBodyForSection,
  visibleCaseStudySections,
  type CaseStudySectionConfig,
  type CaseStudySectionId,
} from '@/lib/projects/case-study-sections';
import type { FeaturedProject } from '@/lib/projects/featured';
import { cn } from '@/lib/cn';

const EASE = [0.22, 1, 0.36, 1] as const;

function mediaForPart(project: FeaturedProject, partId: CaseStudySectionId) {
  if (partId === 'overview') return project.posterUrl ?? project.screenshots[0];
  if (partId === 'pipeline') return project.screenshots[1];
  if (partId === 'dataset') return project.screenshots[2];
  if (partId === 'results') return project.screenshots[3];
  if (partId === 'demo') return project.screenshots[0] ?? project.posterUrl;
  return undefined;
}

function GeneratedVisual({
  kind,
  project,
}: {
  kind: CaseStudySectionConfig['visual'];
  project: FeaturedProject;
}) {
  if (kind === 'pipeline') {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(192,148,228,0.35),transparent_28%),linear-gradient(135deg,#07040f,#17112b_55%,#05030a)]">
        <div className="absolute inset-3 grid grid-cols-2 items-center gap-2 md:inset-8 md:grid-cols-3 md:gap-5">
          {['Client', 'API', 'Worker', 'Store', 'Model', 'Ship'].map((label, index) => (
            <div
              key={label}
              className="rounded-[14px] border border-white/12 bg-white/[0.07] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-md md:rounded-[18px] md:p-4"
            >
              <span className="font-eyebrow text-[8px] uppercase tracking-[0.18em] text-lavender/80 md:text-[10px]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="mt-1 text-[12px] font-semibold text-lilac-white md:mt-3 md:text-[17px]">{label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'dataset') {
    return (
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#0a0612,#21183a)]">
        <div className="absolute inset-3 grid grid-cols-3 gap-2 md:inset-8 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[12px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(192,148,228,0.08))] p-2 md:rounded-[16px] md:p-3"
            >
              <div className="h-10 rounded-[10px] bg-[radial-gradient(circle_at_35%_35%,rgba(255,250,244,0.5),transparent_34%),linear-gradient(135deg,rgba(192,148,228,0.3),rgba(80,70,228,0.18))] md:h-16 md:rounded-[12px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'model') {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(192,148,228,0.34),transparent_30%),linear-gradient(135deg,#030014,#131028)]">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="absolute inset-x-6 top-1/2 flex -translate-y-1/2 items-center justify-between md:inset-x-10">
          {[0, 1, 2, 3].map((column) => (
            <div key={column} className="flex flex-col gap-3 md:gap-5">
              {Array.from({ length: column === 0 || column === 3 ? 3 : 5 }).map((_, row) => (
                <span
                  key={`${column}-${row}`}
                  className="h-3 w-3 rounded-full border border-lavender/35 bg-lavender/70 shadow-[0_0_28px_rgba(192,148,228,0.55)] md:h-4 md:w-4"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'results') {
    return (
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#08050d,#201833_60%,#05030a)]">
        <div className="absolute inset-x-4 bottom-6 flex h-[52%] items-end gap-2 md:inset-x-8 md:bottom-10 md:h-[62%] md:gap-4">
          {[38, 62, 47, 82, 58, 92, 74].map((height, index) => (
            <div key={index} className="flex h-full flex-1 flex-col justify-end gap-2 md:gap-3">
              <div
                className="w-full rounded-t-[12px] bg-[linear-gradient(180deg,#f3d6ff,#8f6bff)] shadow-[0_0_32px_rgba(192,148,228,0.35)] md:rounded-t-[18px]"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'github') {
    return (
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#050505,#111827_55%,#06030c)]">
        <div className="absolute inset-3 rounded-[18px] border border-white/12 bg-[#06070b]/88 p-3 font-mono shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:inset-8 md:rounded-[24px] md:p-5">
          <p className="text-[11px] text-lavender/80 md:text-[13px]">
            repo/{project.title.toLowerCase().replace(/\s+/g, '-')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_22%,rgba(255,255,255,0.18),transparent_24%),linear-gradient(135deg,#07040f,#241936_58%,#06030c)]">
      <div className="absolute inset-3 rounded-[18px] border border-white/12 bg-white/[0.07] p-4 backdrop-blur-md md:inset-8 md:rounded-[26px] md:p-6">
        <p className="font-eyebrow text-[8px] uppercase tracking-[0.18em] text-lavender/80 md:text-[10px]">
          Technical brief
        </p>
        <p className="mt-3 max-w-[420px] text-[clamp(1.35rem,4vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.06em] text-lilac-white md:mt-5">
          Why {project.title} exists
        </p>
      </div>
    </div>
  );
}

function TextCaseStudyPanel({
  section,
  project,
  body,
}: {
  section: CaseStudySectionConfig;
  project: FeaturedProject;
  body: string;
}) {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(192,148,228,0.22),transparent_32%),linear-gradient(160deg,#07040f,#17112b_58%,#05030a)]">
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(3,0,12,0.94),rgba(3,0,12,0.2)_42%,rgba(3,0,12,0.12))]" />
      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-8">
        <p className="font-eyebrow text-[8px] uppercase tracking-[0.18em] text-lavender/80 md:text-[10px]">
          {section.eyebrow}
        </p>
        <h2 className="mt-2 max-w-[14ch] text-[clamp(1.5rem,5vw,3.25rem)] font-semibold leading-[0.92] tracking-[-0.06em] text-lilac-white md:mt-3">
          {section.id === 'overview' ? project.title : section.label}
        </h2>
        <p className="mt-3 max-w-prose text-[12px] leading-relaxed text-ash md:mt-4 md:text-[15px] md:leading-relaxed">
          {body}
        </p>
      </div>
    </div>
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
  const visibleSections = useMemo(() => visibleCaseStudySections(project), [project]);
  const [activePartId, setActivePartId] = useState<CaseStudySectionId>('overview');

  useEffect(() => {
    if (!visibleSections.some((section) => section.id === activePartId)) {
      setActivePartId(visibleSections[0]?.id ?? 'overview');
    }
  }, [activePartId, visibleSections]);

  const activePart = visibleSections.find((part) => part.id === activePartId) ?? visibleSections[0] ?? CASE_STUDY_SECTIONS[0];
  const activeBody = caseStudyBodyForSection(project, activePart.id);
  const activeMedia = mediaForPart(project, activePart.id);
  const showDemoVideo = activePart.id === 'demo' && project.videoUrl && !reduced;
  const showTextPanel = Boolean(activeBody) && !showDemoVideo && !activeMedia;

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
              key={`${project.id}-${activePart.id}-${activeBody ?? 'visual'}`}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.02, y: 8 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.99, y: -6 }}
              transition={{ duration: reduced ? 0.18 : 0.4, ease: EASE }}
              className="absolute inset-0"
            >
              {showDemoVideo ? (
                <video
                  src={project.videoUrl ?? undefined}
                  poster={activeMedia ?? project.posterUrl ?? undefined}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover object-top"
                />
              ) : showTextPanel ? (
                <TextCaseStudyPanel section={activePart} project={project} body={activeBody!} />
              ) : activeMedia ? (
                <ProjectMedia src={activeMedia} sizes="(max-width: 1024px) 100vw, 720px" className="object-cover object-top" />
              ) : (
                <GeneratedVisual kind={activePart.visual} project={project} />
              )}
            </motion.div>
          </AnimatePresence>

          {!showTextPanel && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,0,12,0.2),rgba(3,0,12,0.04)_44%,rgba(3,0,12,0.34)),linear-gradient(0deg,rgba(3,0,12,0.92),rgba(3,0,12,0.12)_48%,rgba(3,0,12,0.16))]" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
                <p className="font-eyebrow text-[8px] uppercase tracking-[0.18em] text-lavender/80 md:text-[10px]">
                  {activePart.eyebrow}
                </p>
                <h2 className="cc-fit-title mt-2 max-w-[12ch] text-[clamp(1.6rem,6vw,7rem)] font-semibold leading-[0.9] tracking-[-0.08em] text-lilac-white md:mt-3">
                  {project.title}
                </h2>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col justify-between border-t border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-3 backdrop-blur-xl sm:p-4 md:p-8 lg:border-l lg:border-t-0">
          <div>
            <p className="font-eyebrow text-[8px] uppercase tracking-[0.18em] text-lavender/80 md:text-[10px]">
              Technical case study
            </p>
            {project.tagline && (
              <h3 className="mt-3 text-[16px] font-medium leading-snug tracking-[-0.03em] text-lilac-white sm:text-[18px] md:mt-5 md:text-[28px]">
                {project.tagline}
              </h3>
            )}
          </div>

          <div className="mt-4 md:mt-8">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-1 lg:gap-2">
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
                        ? 'border-lavender/35 bg-lavender/15 text-lilac-white shadow-[0_10px_30px_rgba(192,148,228,0.12)] lg:scale-[1.02] lg:shadow-[0_14px_44px_rgba(192,148,228,0.14)]'
                        : 'border-white/8 bg-white/[0.035] text-ash opacity-70 hover:opacity-100',
                    )}
                    aria-pressed={active}
                  >
                    <Icon
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 transition-transform duration-200 lg:h-5 lg:w-5',
                        active && 'text-lavender lg:scale-110',
                      )}
                      aria-hidden
                    />
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
                className="mt-3 min-h-[36px] text-[12px] leading-relaxed text-ash md:mt-4 md:min-h-[44px] md:text-[14px]"
              >
                {activeBody ?? activePart.summary}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

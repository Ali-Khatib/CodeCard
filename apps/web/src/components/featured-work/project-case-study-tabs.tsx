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

function CaseStudyPanel({
  section,
  body,
  mediaUrl,
}: {
  section: CaseStudySectionConfig;
  body: string;
  mediaUrl: string | null;
}) {
  const hasImage = Boolean(mediaUrl);

  return (
    <div
      className={cn(
        'absolute inset-0',
        // Site-palette backdrop (cream → lavender mist) when no image is set.
        !hasImage &&
          'bg-[radial-gradient(circle_at_16%_14%,rgba(192,148,228,0.22),transparent_46%),linear-gradient(150deg,var(--paper),var(--hume-lavender-mist)_58%,var(--hume-cream))]',
      )}
    >
      {hasImage && mediaUrl ? (
        <>
          <ProjectMedia
            src={mediaUrl}
            alt=""
            sizes="(max-width: 1024px) 100vw, 720px"
            className="object-cover"
          />
          {/* Scrim guarantees the story text stays readable over any image. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(23,21,26,0.42),rgba(23,21,26,0.58)_48%,rgba(23,21,26,0.8))]"
          />
        </>
      ) : null}

      <div
        className="absolute inset-0 flex flex-col justify-center gap-4 overflow-y-auto p-5 sm:p-7 md:gap-5 md:p-10"
        role="presentation"
      >
        <p
          className={cn(
            'font-eyebrow text-[10px] uppercase tracking-[0.2em] md:text-[11px]',
            hasImage ? 'text-[#e9ddf5] [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]' : 'text-smoke',
          )}
        >
          {section.eyebrow}
        </p>
        <h2
          className={cn(
            'max-w-[14ch] text-[clamp(2rem,7vw,3.75rem)] font-semibold leading-[0.92] tracking-[-0.07em]',
            hasImage ? 'text-white [text-shadow:0_2px_22px_rgba(0,0,0,0.55)]' : 'text-ink',
          )}
        >
          {section.label}
        </h2>
        <p
          className={cn(
            'max-w-[34ch] text-[clamp(1.15rem,3.2vw,1.85rem)] font-medium leading-[1.25] tracking-[-0.03em] md:max-w-[38ch]',
            hasImage ? 'text-white [text-shadow:0_1px_16px_rgba(0,0,0,0.6)]' : 'text-ink',
          )}
        >
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
  const showcaseEnabled = hasShowcaseExtras(project);
  const visibleSections = useMemo(() => visibleCaseStudySections(project), [project]);
  const [activePartId, setActivePartId] = useState<CaseStudySectionId>(visibleSections[0]?.id ?? 'problem');

  useEffect(() => {
    if (!visibleSections.some((section) => section.id === activePartId)) {
      setActivePartId(visibleSections[0]?.id ?? 'problem');
    }
  }, [activePartId, visibleSections]);

  if (!showcaseEnabled) {
    return null;
  }

  const activePart = visibleSections.find((part) => part.id === activePartId) ?? visibleSections[0]!;
  const activeText = caseStudyTextForSection(project, activePart.id);
  const activeMedia = caseStudyMediaForSection(project, activePart.id);
  const activeBody = activeText ?? activePart.summary;

  const setActive = (id: CaseStudySectionId, label: string) => {
    setActivePartId(id);
    onSectionInteract?.(label);
  };

  return (
    <section className="mb-8 mt-6 overflow-hidden rounded-[20px] border border-[color:var(--line-soft)] bg-paper shadow-[0_18px_50px_rgba(35,35,36,0.1)] md:mb-14 md:mt-14 md:rounded-[30px] md:shadow-[0_24px_70px_rgba(35,35,36,0.12)]">
      <div className="grid overflow-hidden md:rounded-[30px] lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
        <div className="relative min-h-[220px] overflow-hidden sm:min-h-[280px] md:min-h-[520px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${project.id}-${activePart.id}-${activeBody}-${activeMedia ?? 'no-media'}`}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.02, y: 8 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.99, y: -6 }}
              transition={{ duration: reduced ? 0.18 : 0.4, ease: EASE }}
              className="absolute inset-0"
            >
              <CaseStudyPanel section={activePart} body={activeBody} mediaUrl={activeMedia} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col justify-between border-t border-[color:var(--line-soft)] bg-[color:var(--hume-cream)] p-3 sm:p-4 md:p-8 lg:border-l lg:border-t-0">
          <div>
            <p className="font-eyebrow text-[8px] uppercase tracking-[0.18em] text-smoke md:text-[10px]">
              Extra showcase
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-smoke md:text-[13px]">
              Optional story beats — each tab is a short written section visitors can tap through.
            </p>
            {project.tagline && (
              <h3 className="mt-3 text-[16px] font-medium leading-snug tracking-[-0.03em] text-ink sm:text-[18px] md:mt-5 md:text-[24px]">
                {project.tagline}
              </h3>
            )}
          </div>

          <div className="mt-4 md:mt-8">
            <div
              className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1 lg:gap-2"
              role="tablist"
              aria-label="Project showcase sections"
            >
              {visibleSections.map(({ id, label, Icon }) => {
                const active = id === activePart.id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    id={`case-study-tab-${id}`}
                    aria-selected={active}
                    aria-controls={`case-study-panel-${id}`}
                    tabIndex={active ? 0 : -1}
                    onMouseEnter={() => {
                      if (
                        typeof window !== 'undefined' &&
                        window.matchMedia('(hover: hover) and (pointer: fine)').matches
                      ) {
                        setActive(id, label);
                      }
                    }}
                    onFocus={() => setActive(id, label)}
                    onClick={() => setActive(id, label)}
                    onKeyDown={(event) => {
                      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
                        return;
                      }
                      event.preventDefault();
                      const index = visibleSections.findIndex((section) => section.id === id);
                      const delta =
                        event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
                      const next =
                        visibleSections[(index + delta + visibleSections.length) % visibleSections.length];
                      if (!next) return;
                      setActive(next.id, next.label);
                      window.requestAnimationFrame(() => {
                        document.getElementById(`case-study-tab-${next.id}`)?.focus();
                      });
                    }}
                    className={cn(
                      'flex min-h-11 min-w-0 items-center gap-1.5 rounded-[12px] border px-2 py-1.5 text-left transition-all duration-200 lg:gap-3 lg:rounded-[20px] lg:px-4 lg:py-3',
                      active
                        ? 'border-[#c094e4] bg-paper text-ink shadow-[0_10px_26px_rgba(192,148,228,0.28)]'
                        : 'border-[color:var(--border)] bg-paper text-smoke hover:border-[#c094e4] hover:text-ink',
                    )}
                  >
                    <Icon
                      className={cn('h-3.5 w-3.5 shrink-0 lg:h-5 lg:w-5', active ? 'text-[#a86ed6]' : 'text-smoke')}
                      aria-hidden
                    />
                    <span className="truncate text-[11px] font-medium leading-tight lg:text-[15px]">{label}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activePart.id}
                id={`case-study-panel-${activePart.id}`}
                role="tabpanel"
                aria-labelledby={`case-study-tab-${activePart.id}`}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: reduced ? 0.12 : 0.2 }}
                className="mt-3 min-h-[36px] text-[12px] leading-relaxed text-smoke md:mt-4 md:text-[14px]"
              >
                {activeText ?? activePart.summary}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

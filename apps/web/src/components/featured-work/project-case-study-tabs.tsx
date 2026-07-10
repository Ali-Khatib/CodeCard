'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  HiOutlineBeaker,
  HiOutlineChartBarSquare,
  HiOutlineCodeBracketSquare,
  HiOutlineCpuChip,
  HiOutlineCubeTransparent,
  HiOutlinePlayCircle,
  HiOutlineSquares2X2,
} from 'react-icons/hi2';
import { ProjectMedia } from '@/components/profile/project-media';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { FeaturedProject } from '@/lib/projects/featured';
import { cn } from '@/lib/cn';

const EASE = [0.22, 1, 0.36, 1] as const;

const PROJECT_PARTS = [
  {
    id: 'overview',
    label: 'Overview',
    eyebrow: 'Main frame',
    summary: 'The finished product, main screenshot, and first proof point.',
    visual: 'overview',
    Icon: HiOutlineSquares2X2,
  },
  {
    id: 'problem',
    label: 'Problem',
    eyebrow: 'Constraint',
    summary: 'The technical or user problem this project was built to solve.',
    visual: 'problem',
    Icon: HiOutlineCubeTransparent,
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    eyebrow: 'Workflow',
    summary: 'How data, services, jobs, and UI states move through the system.',
    visual: 'pipeline',
    Icon: HiOutlineCubeTransparent,
  },
  {
    id: 'dataset',
    label: 'Dataset',
    eyebrow: 'Inputs',
    summary: 'Sample records, captures, events, or training material powering the project.',
    visual: 'dataset',
    Icon: HiOutlineBeaker,
  },
  {
    id: 'model',
    label: 'Model',
    eyebrow: 'Intelligence',
    summary: 'The model, prompt layer, inference path, or decision logic behind the product.',
    visual: 'model',
    Icon: HiOutlineCpuChip,
  },
  {
    id: 'results',
    label: 'Results',
    eyebrow: 'Proof',
    summary: 'Metrics, before/after comparisons, and signals that show the work landed.',
    visual: 'results',
    Icon: HiOutlineChartBarSquare,
  },
  {
    id: 'demo',
    label: 'Demo',
    eyebrow: 'Live surface',
    summary: 'A product-facing preview of the interface, prototype, or interaction loop.',
    visual: 'demo',
    Icon: HiOutlinePlayCircle,
  },
  {
    id: 'github',
    label: 'GitHub',
    eyebrow: 'Source',
    summary: 'A clean repository/code view for reviewers who want to inspect the build.',
    visual: 'github',
    Icon: HiOutlineCodeBracketSquare,
  },
] as const;

type ProjectPart = (typeof PROJECT_PARTS)[number];

function mediaForPart(project: FeaturedProject, part: ProjectPart) {
  if (part.id === 'overview') return project.posterUrl ?? project.screenshots[0];
  if (part.id === 'pipeline') return project.screenshots[1];
  if (part.id === 'dataset') return project.screenshots[2];
  if (part.id === 'results') return project.screenshots[3];
  if (part.id === 'demo') return project.screenshots[0] ?? project.posterUrl;
  return undefined;
}

function GeneratedVisual({
  kind,
  project,
}: {
  kind: ProjectPart['visual'];
  project: FeaturedProject;
}) {
  if (kind === 'pipeline') {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(192,148,228,0.35),transparent_28%),linear-gradient(135deg,#07040f,#17112b_55%,#05030a)]">
        <div className="absolute inset-6 grid grid-cols-2 items-center gap-4 md:inset-8 md:grid-cols-3 md:gap-5">
          {['Client', 'API', 'Worker', 'Store', 'Model', 'Ship'].map((label, index) => (
            <div
              key={label}
              className="rounded-[18px] border border-white/12 bg-white/[0.07] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-md"
            >
              <span className="font-eyebrow text-[10px] uppercase tracking-[0.18em] text-lavender/80">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="mt-3 text-[17px] font-semibold text-lilac-white">{label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'dataset') {
    return (
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#0a0612,#21183a)]">
        <div className="absolute inset-6 grid grid-cols-2 gap-3 md:inset-8 md:grid-cols-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[16px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(192,148,228,0.08))] p-3"
            >
              <div className="h-16 rounded-[12px] bg-[radial-gradient(circle_at_35%_35%,rgba(255,250,244,0.5),transparent_34%),linear-gradient(135deg,rgba(192,148,228,0.3),rgba(80,70,228,0.18))]" />
              <div className="mt-3 h-1.5 w-3/4 rounded-full bg-white/25" />
              <div className="mt-2 h-1.5 w-1/2 rounded-full bg-white/15" />
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
        <div className="absolute inset-x-10 top-1/2 flex -translate-y-1/2 items-center justify-between">
          {[0, 1, 2, 3].map((column) => (
            <div key={column} className="flex flex-col gap-5">
              {Array.from({ length: column === 0 || column === 3 ? 4 : 6 }).map((_, row) => (
                <span
                  key={`${column}-${row}`}
                  className="h-4 w-4 rounded-full border border-lavender/35 bg-lavender/70 shadow-[0_0_28px_rgba(192,148,228,0.55)]"
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
        <div className="absolute inset-x-8 bottom-10 flex h-[62%] items-end gap-4">
          {[38, 62, 47, 82, 58, 92, 74].map((height, index) => (
            <div key={index} className="flex h-full flex-1 flex-col justify-end gap-3">
              <div
                className="w-full rounded-t-[18px] bg-[linear-gradient(180deg,#f3d6ff,#8f6bff)] shadow-[0_0_32px_rgba(192,148,228,0.35)]"
                style={{ height: `${height}%` }}
              />
              <span className="mx-auto h-1.5 w-8 rounded-full bg-white/18" />
            </div>
          ))}
        </div>
        <div className="absolute left-8 top-8 rounded-[24px] border border-white/12 bg-white/[0.08] p-5 backdrop-blur-md">
          <p className="font-eyebrow text-[10px] uppercase tracking-[0.18em] text-lavender/80">Score</p>
          <p className="mt-2 text-[46px] font-semibold tracking-[-0.05em] text-lilac-white">92%</p>
        </div>
      </div>
    );
  }

  if (kind === 'github') {
    return (
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#050505,#111827_55%,#06030c)]">
        <div className="absolute inset-6 rounded-[24px] border border-white/12 bg-[#06070b]/88 p-5 font-mono shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:inset-8">
          <div className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <p className="mt-6 text-[13px] text-lavender/80">repo/{project.title.toLowerCase().replace(/\s+/g, '-')}</p>
          {['import pipeline from "@/core/pipeline";', 'const model = await loadModel(config);', 'export async function run(input) {', '  return pipeline.score(input, model);', '}'].map((line, index) => (
            <div key={line} className="mt-3 flex gap-4 text-[13px]">
              <span className="w-5 text-right text-white/24">{index + 1}</span>
              <span className={index % 2 === 0 ? 'text-lilac-white' : 'text-[#9be9a8]'}>{line}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_22%,rgba(255,255,255,0.18),transparent_24%),linear-gradient(135deg,#07040f,#241936_58%,#06030c)]">
      <div className="absolute inset-6 rounded-[26px] border border-white/12 bg-white/[0.07] p-6 backdrop-blur-md md:inset-8">
        <p className="font-eyebrow text-[10px] uppercase tracking-[0.18em] text-lavender/80">Technical brief</p>
        <p className="mt-5 max-w-[420px] text-[clamp(2rem,5vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.06em] text-lilac-white">
          Why {project.title} exists
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
  const [activePartId, setActivePartId] = useState<ProjectPart['id']>('overview');
  const activePart = PROJECT_PARTS.find((part) => part.id === activePartId) ?? PROJECT_PARTS[0];
  const activeMedia = mediaForPart(project, activePart);
  const showDemoVideo = activePart.id === 'demo' && project.videoUrl && !reduced;

  const setActive = (id: ProjectPart['id'], label: string) => {
    setActivePartId(id);
    onSectionInteract?.(label);
  };

  return (
    <section className="mb-12 mt-10 rounded-[30px] border border-white/10 bg-[#07040f] shadow-[0_28px_90px_rgba(0,0,0,0.38)] md:mb-14 md:mt-14">
      <div className="grid overflow-hidden rounded-[30px] lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
        <div className="relative min-h-[360px] overflow-hidden md:min-h-[520px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${project.id}-${activePart.id}`}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.035, y: 14, filter: 'blur(14px)' }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.985, y: -10, filter: 'blur(10px)' }}
              transition={{ duration: reduced ? 0.18 : 0.55, ease: EASE }}
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
              ) : activeMedia ? (
                <ProjectMedia src={activeMedia} sizes="(max-width: 1024px) 100vw, 720px" className="object-cover object-top" />
              ) : (
                <GeneratedVisual kind={activePart.visual} project={project} />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,0,12,0.2),rgba(3,0,12,0.04)_44%,rgba(3,0,12,0.34)),linear-gradient(0deg,rgba(3,0,12,0.92),rgba(3,0,12,0.12)_48%,rgba(3,0,12,0.16))]" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <p className="font-eyebrow text-[10px] uppercase tracking-[0.2em] text-lavender/80">
              {activePart.eyebrow}
            </p>
            <h2 className="cc-fit-title mt-3 max-w-[12ch] text-[clamp(2.3rem,7vw,7rem)] font-semibold leading-[0.88] tracking-[-0.08em] text-lilac-white">
              {project.title}
            </h2>
          </div>
        </div>

        <div className="flex flex-col justify-between border-t border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 backdrop-blur-xl md:p-8 lg:border-l lg:border-t-0">
          <div>
            <p className="font-eyebrow text-[10px] uppercase tracking-[0.2em] text-lavender/80">
              Technical case study
            </p>
            {project.tagline && (
              <h3 className="mt-5 text-[22px] font-medium leading-snug tracking-[-0.03em] text-lilac-white md:text-[28px]">
                {project.tagline}
              </h3>
            )}
            {project.description && (
              <p className="mt-4 line-clamp-4 text-[15px] leading-relaxed text-ash">
                {project.description.split(/\n\n+/)[0]}
              </p>
            )}
          </div>

          <div className="mt-8">
            <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {PROJECT_PARTS.map(({ id, label, Icon }) => {
                const active = id === activePart.id;
                return (
                  <button
                    key={id}
                    type="button"
                    onMouseEnter={() => setActive(id, label)}
                    onFocus={() => setActive(id, label)}
                    onClick={() => setActive(id, label)}
                    className={cn(
                      'group flex min-w-fit items-center justify-between gap-4 rounded-[20px] border px-4 py-3 text-left transition-all duration-300 lg:w-full',
                      active
                        ? 'scale-[1.02] border-lavender/35 bg-lavender/15 text-lilac-white shadow-[0_14px_44px_rgba(192,148,228,0.14)]'
                        : 'border-white/8 bg-white/[0.035] text-ash opacity-60 hover:opacity-100',
                    )}
                    aria-pressed={active}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={cn('h-5 w-5 transition-transform duration-300', active && 'scale-110 text-lavender')} aria-hidden />
                      <span className="text-[15px] font-medium">{label}</span>
                    </span>
                    <span className={cn('hidden text-[12px] text-lavender/75 lg:inline', active ? 'opacity-100' : 'opacity-0')}>
                      View
                    </span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={activePart.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24 }}
                className="mt-4 min-h-[44px] text-[14px] leading-relaxed text-ash"
              >
                {activePart.summary}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

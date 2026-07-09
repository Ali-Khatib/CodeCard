'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import {
  HiOutlineArrowTopRightOnSquare,
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
import type { PortfolioProject } from '@/lib/dashboard/portfolio';
import { cn } from '@/lib/cn';

const EASE = [0.22, 1, 0.36, 1] as const;

const PROJECT_PARTS = [
  {
    id: 'overview',
    label: 'Overview',
    eyebrow: 'Main frame',
    summary: 'A hero view for the finished product and the strongest first impression.',
    visual: 'overview',
    Icon: HiOutlineSquares2X2,
  },
  {
    id: 'problem',
    label: 'Problem',
    eyebrow: 'Constraint',
    summary: 'The user pain, system pressure, or technical gap this project was built to solve.',
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
    summary: 'Sample records, captures, events, or training material powering the experience.',
    visual: 'dataset',
    Icon: HiOutlineBeaker,
  },
  {
    id: 'model',
    label: 'Model',
    eyebrow: 'Intelligence',
    summary: 'The model, inference path, prompt layer, or decision logic behind the product.',
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

type A24ProjectShowcaseProps = {
  projects: PortfolioProject[];
  basePath?: string;
};

function getMediaForPart(project: PortfolioProject, part: ProjectPart) {
  const screenshots = project.screenshots ?? [];

  if (part.id === 'overview') return project.posterUrl ?? screenshots[0];
  if (part.id === 'dataset') return screenshots[1] ?? screenshots[0] ?? project.posterUrl;
  if (part.id === 'demo') return screenshots[2] ?? screenshots[0] ?? project.posterUrl;
  return undefined;
}

function GeneratedVisual({
  kind,
  project,
}: {
  kind: ProjectPart['visual'];
  project: PortfolioProject;
}) {
  if (kind === 'pipeline') {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(192,148,228,0.38),transparent_28%),linear-gradient(135deg,#07040f,#17112b_55%,#05030a)]">
        <div className="absolute inset-8 grid grid-cols-3 items-center gap-5">
          {['Client', 'API', 'Worker', 'Store', 'Model', 'Ship'].map((label, index) => (
            <div
              key={label}
              className="relative rounded-[22px] border border-white/12 bg-white/[0.07] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-md"
            >
              <span className="font-eyebrow text-[10px] uppercase tracking-[0.18em] text-lavender/80">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="mt-3 text-[18px] font-semibold text-lilac-white">{label}</p>
              {index < 5 && (
                <span className="absolute left-[calc(100%+0.45rem)] top-1/2 hidden h-px w-8 bg-lavender/45 md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'dataset') {
    return (
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#0a0612,#21183a)]">
        <div className="absolute inset-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[18px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(192,148,228,0.08))] p-3"
            >
              <div className="h-20 rounded-[12px] bg-[radial-gradient(circle_at_35%_35%,rgba(255,250,244,0.5),transparent_34%),linear-gradient(135deg,rgba(192,148,228,0.3),rgba(80,70,228,0.18))]" />
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
        <div className="absolute inset-x-8 top-1/2 flex -translate-y-1/2 items-center justify-between">
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
        <div className="absolute inset-x-8 bottom-10 flex items-end gap-4">
          {[38, 62, 47, 82, 58, 92, 74].map((height, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-3">
              <div
                className="w-full rounded-t-[18px] bg-[linear-gradient(180deg,#f3d6ff,#8f6bff)] shadow-[0_0_32px_rgba(192,148,228,0.35)]"
                style={{ height: `${height}%` }}
              />
              <span className="h-1.5 w-8 rounded-full bg-white/18" />
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
        <div className="absolute inset-8 rounded-[26px] border border-white/12 bg-[#06070b]/88 p-5 font-mono shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
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
      <div className="absolute inset-8 rounded-[28px] border border-white/12 bg-white/[0.07] p-6 backdrop-blur-md">
        <p className="font-eyebrow text-[10px] uppercase tracking-[0.18em] text-lavender/80">Technical brief</p>
        <p className="mt-5 max-w-[420px] text-[clamp(2rem,5vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.06em] text-lilac-white">
          What changed after {project.title}
        </p>
      </div>
    </div>
  );
}

function ProjectCaseStudy({
  project,
  index,
  basePath,
}: {
  project: PortfolioProject;
  index: number;
  basePath: string;
}) {
  const reduced = useReducedMotion();
  const [activePartId, setActivePartId] = useState<ProjectPart['id']>('overview');
  const activePart = PROJECT_PARTS.find((part) => part.id === activePartId) ?? PROJECT_PARTS[0];
  const activeMedia = getMediaForPart(project, activePart);
  const showDemoVideo = activePart.id === 'demo' && project.videoUrl && !reduced;
  const supportingCopy = project.description || project.tagline || 'A technical project presented as a focused product case study.';
  const projectHref = project.href || `${basePath}/projects/${project.id}`;

  const partStats = useMemo(
    () => [
      `${project.technologies.slice(0, 2).join(' + ') || 'TypeScript'}`,
      `${project.views ?? 0} views`,
      `${project.saves ?? 0} saves`,
    ],
    [project.saves, project.technologies, project.views],
  );

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.65, delay: index * 0.04, ease: EASE }}
      className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#07040f] shadow-[0_32px_110px_rgba(0,0,0,0.42)]"
    >
      <div className="grid min-h-[720px] lg:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
        <div className="relative min-h-[430px] overflow-hidden lg:min-h-full">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${project.id}-${activePart.id}`}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.04, y: 16, filter: 'blur(14px)' }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.985, y: -12, filter: 'blur(10px)' }}
              transition={{ duration: reduced ? 0.18 : 0.58, ease: EASE }}
              className="absolute inset-0"
            >
              {showDemoVideo ? (
                <video
                  src={project.videoUrl}
                  poster={activeMedia ?? project.posterUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover object-top"
                />
              ) : activeMedia ? (
                <ProjectMedia
                  src={activeMedia}
                  priority={index === 0 && activePart.id === 'overview'}
                  sizes="(max-width: 1024px) 100vw, 760px"
                  className="object-cover object-top"
                />
              ) : (
                <GeneratedVisual kind={activePart.visual} project={project} />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,0,12,0.28),rgba(3,0,12,0.05)_42%,rgba(3,0,12,0.42)),linear-gradient(0deg,rgba(3,0,12,0.9),rgba(3,0,12,0.1)_46%,rgba(3,0,12,0.22))]" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <p className="font-eyebrow text-[10px] uppercase tracking-[0.2em] text-lavender/80">
              {activePart.eyebrow}
            </p>
            <h3 className="mt-3 max-w-[12ch] text-[clamp(2.6rem,7vw,6.8rem)] font-semibold leading-[0.88] tracking-[-0.075em] text-lilac-white">
              {project.title}
            </h3>
          </div>
        </div>

        <div className="relative flex flex-col justify-between border-t border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 backdrop-blur-xl md:p-8 lg:border-l lg:border-t-0">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-eyebrow text-[10px] uppercase tracking-[0.2em] text-lavender/80">
                Technical case study
              </p>
              {project.isPublished === false && (
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] text-amber-100">
                  Draft
                </span>
              )}
            </div>

            {project.tagline && (
              <p className="mt-6 text-[20px] font-medium leading-snug tracking-[-0.03em] text-lilac-white md:text-[26px]">
                {project.tagline}
              </p>
            )}

            <p className="mt-4 line-clamp-4 text-[15px] leading-relaxed text-ash">
              {supportingCopy}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {partStats.map((stat) => (
                <span
                  key={stat}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[12px] text-lilac-white/80"
                >
                  {stat}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {PROJECT_PARTS.map(({ id, label, Icon }) => {
                const active = id === activePart.id;
                return (
                  <button
                    key={id}
                    type="button"
                    onMouseEnter={() => setActivePartId(id)}
                    onFocus={() => setActivePartId(id)}
                    onClick={() => setActivePartId(id)}
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

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={projectHref}
                className="cc-instant-press inline-flex items-center gap-2 rounded-full bg-lilac-white px-4 py-2 text-[13px] font-semibold text-void-canvas transition-transform hover:scale-[1.02]"
              >
                Open project
                <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
              </Link>
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="cc-instant-press inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-[13px] font-semibold text-lilac-white"
                >
                  GitHub
                  <HiOutlineCodeBracketSquare className="h-4 w-4" aria-hidden />
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="cc-instant-press inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-[13px] font-semibold text-lilac-white"
                >
                  Demo
                  <HiOutlinePlayCircle className="h-4 w-4" aria-hidden />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function A24ProjectShowcase({ projects, basePath = '/dashboard' }: A24ProjectShowcaseProps) {
  if (projects.length === 0) return null;

  return (
    <section className="space-y-8" aria-label="Interactive project showcase">
      <div className="mx-auto max-w-[780px] text-center">
        <p className="font-eyebrow text-[11px] uppercase tracking-[0.18em] text-[var(--app-smoke)]">
          Editorial project showcase
        </p>
        <h2 className="mt-3 text-[clamp(2.2rem,5vw,4.8rem)] font-semibold leading-[0.94] tracking-[-0.07em] text-[var(--app-ink)]">
          Hover through the proof, not just the poster.
        </h2>
      </div>

      <div className="space-y-10">
        {projects.map((project, index) => (
          <ProjectCaseStudy
            key={project.id}
            project={project}
            index={index}
            basePath={basePath}
          />
        ))}
      </div>
    </section>
  );
}

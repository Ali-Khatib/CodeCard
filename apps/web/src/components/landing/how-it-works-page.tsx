'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion';
import { HiOutlineFunnel, HiPlus, HiCheck } from 'react-icons/hi2';
import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE } from '@/lib/projects/demo-data';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useIsMobile } from '@/hooks/use-is-mobile';
import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';
import { TYPE } from '@/lib/design/tokens';
import { SectionCounter } from './section-counter';
import { ScrollReveal } from './scroll-reveal';
import { AuroraDivider } from './aurora-divider';

const STEPS = [
  {
    title: 'Share your CodeCard',
    detail: 'Hand over a QR or link and they land on your showcase right away, with no app to install.',
  },
  {
    title: 'Lead with your best work',
    detail:
      'Your name, role, links, and strongest projects appear first so visitors understand your value fast.',
  },
  {
    title: 'Help visitors find what matters',
    detail: 'Filters let people narrow a larger body of work by domain, focus area, or the proof they came to see.',
  },
  {
    title: 'Open the full project story',
    detail: 'One tap reveals screenshots, videos, papers, repo links, live demos, and the outcome behind the work.',
  },
  {
    title: 'Turn interest into a saved connection',
    detail:
      'After someone explores, a gentle prompt helps them keep you in their circle for later follow-up.',
  },
  {
    title: 'Remember the context later',
    detail: 'Add where you met, next steps, and private notes so the relationship has context when you return.',
  },
] as const;

export function HowItWorksSection() {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const useStaticLayout = reducedMotion || isMobile;

  return (
    <div id="how-it-works" className="scroll-mt-28 py-20 md:py-[100px]">
      <section className="cc-container pb-10 md:pb-14">
        <ScrollReveal>
          <SectionCounter index="04" label="How it works" />
          <h2 className={`mt-6 ${TYPE.sectionHeading} text-phosphor`}>
            Share once. <span className="cc-text-reactor">They see your work.</span>
          </h2>
          <p className="mt-6 max-w-[680px] text-[18px] leading-[1.55] text-lichen">
            From the first scan to a saved connection — one continuous story.
            {useStaticLayout ? '' : ' Scroll to watch it play like a film.'}
          </p>
        </ScrollReveal>
      </section>

      <AuroraDivider className="cc-container mb-10 md:mb-14" />

      {useStaticLayout ? (
        isMobile && !reducedMotion ? (
          <section className="cc-container cc-how-it-works-mobile">
            <div className="cc-how-it-works-mobile__steps">
              {STEPS.map((s, i) => (
                <article key={s.title} className="cc-how-it-works-mobile__step">
                  <PhoneMock step={i} />
                  <StepPanel
                    step={s}
                    stepIndex={i}
                    total={STEPS.length}
                    className="mt-6"
                  />
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="cc-container">
            <div className="grid gap-10 md:grid-cols-[minmax(260px,320px)_1fr] md:gap-14">
              <PhoneMock step={0} />
              <div className="space-y-8">
                {STEPS.map((s, i) => (
                  <div key={s.title}>
                    <p className="font-eyebrow text-[12px] uppercase tracking-[0.1em] text-reactor">
                      Step {i + 1}
                    </p>
                    <h3 className="mt-2 font-display text-[24px] text-vellum">{s.title}</h3>
                    <p className="mt-2 text-[17px] leading-relaxed text-lichen">{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      ) : (
        <ScrollExpandMedia
          mediaType="qr"
          mediaSrc="qr"
          bgImageSrc="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920&q=80"
          title="Scan CodeCard"
          date="01 / QR to proof"
          scrollToExpand="Scroll — watch the scan become a living CodeCard"
          className="mt-[-10px]"
        >
          {(scrollProgress) => <HowItWorksExpandedPage scrollProgress={scrollProgress} />}
        </ScrollExpandMedia>
      )}
    </div>
  );
}

export function HowItWorksPage() {
  return (
    <div className="cc-marketing-page pb-16">
      <HowItWorksSection />
    </div>
  );
}

function HowItWorksExpandedPage({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const [activeStep, setActiveStep] = useState(0);

  useMotionValueEvent(scrollProgress, 'change', (latest) => {
    // After the QR engulfs the frame, scrub the phone story like a film reel.
    const bands = [0.38, 0.48, 0.57, 0.66, 0.76, 0.86];
    let next = 0;
    for (let i = bands.length - 1; i >= 0; i -= 1) {
      if (latest >= bands[i]!) {
        next = i;
        break;
      }
    }
    setActiveStep((prev) => (prev === next ? prev : next));
  });

  const stageOpacity = useTransform(scrollProgress, [0.32, 0.4], [0, 1]);
  const stageY = useTransform(scrollProgress, [0.32, 0.4], ['28px', '0px']);
  const captionOpacity = useTransform(scrollProgress, [0.36, 0.44], [0, 1]);
  const step = STEPS[activeStep] ?? STEPS[0];

  return (
    <div className="cc-hiw-cinema mx-auto flex h-full min-h-full w-full max-w-[1180px] flex-col justify-center">
      <motion.div
        className="cc-hiw-cinema__grid"
        style={{ opacity: stageOpacity, y: stageY }}
      >
        <motion.div className="cc-hiw-cinema__caption" style={{ opacity: captionOpacity }}>
          <p className="font-eyebrow text-[11px] uppercase tracking-[0.16em] text-[#8b7f76]">
            Live story · {String(activeStep + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3 className="mt-4 font-display text-[clamp(2.2rem,4.6vw,4.4rem)] font-normal leading-[0.92] tracking-[-0.06em] text-[#232324]">
                {step.title}
              </h3>
              <p className="mt-5 max-w-[420px] text-[17px] leading-[1.58] text-[#6f6660]">
                {step.detail}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="cc-hiw-cinema__dots" aria-hidden>
            {STEPS.map((s, i) => (
              <span
                key={s.title}
                className={`cc-hiw-cinema__dot ${i === activeStep ? 'cc-hiw-cinema__dot--active' : ''} ${i < activeStep ? 'cc-hiw-cinema__dot--done' : ''}`}
              />
            ))}
          </div>

          <p className="mt-6 hidden text-[13px] font-medium text-[#9a8f87] md:block">
            Keep scrolling — the CodeCard keeps opening.
          </p>
        </motion.div>

        <div className="cc-hiw-cinema__stage">
          <div className="cc-hiw-cinema__phone-shell">
            <PhoneMock step={activeStep} cinema />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StepPanel({
  step,
  stepIndex,
  total,
  className = '',
}: {
  step: (typeof STEPS)[number];
  stepIndex: number;
  total: number;
  className?: string;
}) {
  return (
    <motion.div
      key={stepIndex}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`cc-how-it-works-step-panel ${className}`}
    >
      <p className="font-eyebrow text-[12px] uppercase tracking-[0.1em] text-reactor">
        Step {stepIndex + 1} of {total}
      </p>
      <h3 className="mt-2 font-display text-[28px] leading-[1.1] text-vellum md:text-[34px] lg:text-[40px]">
        {step.title}
      </h3>
      <p className="mt-3 max-w-[520px] text-[16px] leading-[1.5] text-lichen md:text-[17px]">
        {step.detail}
      </p>

      {stepIndex === 3 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {['GitHub ↗', 'LinkedIn ↗', 'Live demo ↗'].map((link) => (
            <span
              key={link}
              className="rounded-full border border-reactor/25 bg-reactor/10 px-3 py-1.5 text-[12px] text-lichen"
            >
              {link}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

const FILTER_OPTIONS = ['All', 'DevOps', 'AI'] as const;
type PreviewFilter = (typeof FILTER_OPTIONS)[number];

const QR_SIZE = 13;

function isQrFinder(row: number, col: number, startRow: number, startCol: number) {
  const r = row - startRow;
  const c = col - startCol;
  if (r < 0 || r > 4 || c < 0 || c > 4) return false;
  return r === 0 || r === 4 || c === 0 || c === 4 || (r >= 2 && r <= 3 && c >= 2 && c <= 3);
}

function isQrCellFilled(index: number) {
  const row = Math.floor(index / QR_SIZE);
  const col = index % QR_SIZE;
  if (isQrFinder(row, col, 0, 0) || isQrFinder(row, col, 0, 8) || isQrFinder(row, col, 8, 0)) {
    return true;
  }
  return (
    (row * 7 + col * 5) % 11 < 4 ||
    (row + col) % 7 === 0 ||
    (row % 3 === 0 && col % 4 === 1)
  );
}

function matchesPreviewFilter(
  project: (typeof DEMO_FEATURED_PROJECTS)[number],
  filter: PreviewFilter,
): boolean {
  if (filter === 'All') return true;
  if (filter === 'DevOps') {
    return project.focusAreas.some((f) => f === 'DevOps' || f === 'CI/CD');
  }
  if (filter === 'AI') {
    return (
      project.domains.includes('Artificial Intelligence') ||
      project.focusAreas.some((f) => f === 'LLMs' || f === 'AI')
    );
  }
  return true;
}

function PreviewFilterBar({ active }: { active: PreviewFilter }) {
  return (
    <div className="cc-how-it-works-preview__filter cc-app-filter-bar">
      <span className="cc-how-it-works-preview__filter-label inline-flex items-center gap-1">
        <HiOutlineFunnel className="h-3 w-3" aria-hidden />
        Filter
      </span>
      {FILTER_OPTIONS.map((option) => (
        <span
          key={option}
          className={`cc-app-filter-pill cc-how-it-works-preview__filter-pill ${
            active === option ? 'cc-app-filter-pill--active' : ''
          }`}
        >
          {option}
        </span>
      ))}
    </div>
  );
}

function PhoneMock({ step, cinema = false }: { step: number; cinema?: boolean }) {
  const reducedMotion = useReducedMotion();
  const allProjects = DEMO_FEATURED_PROJECTS.slice(0, 3);
  const showProjects = step >= 1;
  const isFilterStep = step === 2;
  const isExpandStep = step === 3;
  const showFilter = isFilterStep;
  const activeFilter: PreviewFilter = isFilterStep ? 'DevOps' : 'All';

  let displayProjects = allProjects;
  if (isFilterStep) {
    displayProjects = allProjects.filter((p) => matchesPreviewFilter(p, 'DevOps'));
  } else if (isExpandStep) {
    displayProjects = [allProjects[0]];
  }

  const expanded = isExpandStep;
  const showSavePrompt = step === 4;
  const showSavedToast = step === 5;

  return (
    <div
      className={`cc-how-it-works-preview cc-how-it-works-preview--large relative mx-auto w-full max-w-[min(92vw,390px)] md:max-w-[580px] ${cinema ? 'cc-how-it-works-preview--cinema' : ''}`}
    >
      <div className="cc-how-it-works-preview__glow" aria-hidden />
      <div className="cc-how-it-works-preview__frame">
        <div className="cc-how-it-works-preview__header">
          <div className="flex items-center gap-3">
            <div className="cc-how-it-works-preview__avatar relative h-10 w-10 overflow-hidden">
              <Image
                src={DEMO_PROFILE.avatar_url!}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <p className="break-words font-display text-[15px] leading-tight text-ink">
                  {DEMO_PROFILE.display_name}
                </p>
                {step >= 1 && (
                  <span
                    className={`cc-how-it-works-preview__header-save shrink-0 ${
                      showSavePrompt ? 'cc-how-it-works-preview__header-save--hint' : ''
                    } ${step >= 5 ? 'cc-how-it-works-preview__header-save--saved' : ''}`}
                    aria-hidden
                  >
                    {step >= 5 ? (
                      <HiCheck className="h-2.5 w-2.5" strokeWidth={2.5} />
                    ) : (
                      <HiPlus className="h-2.5 w-2.5" strokeWidth={2.5} />
                    )}
                  </span>
                )}
              </div>
              <p className="mt-0.5 break-words text-[11px] leading-tight text-smoke">{DEMO_PROFILE.headline}</p>
            </div>
            <span className="cc-how-it-works-preview__live font-eyebrow">Live</span>
          </div>
        </div>

        <div className="cc-how-it-works-preview__body relative">
          {step === 0 && (
            <div className="cc-how-it-works-preview__scan-state">
              <div className="cc-how-it-works-preview__qr flex flex-col items-center gap-2 py-5">
                <div
                  className="cc-how-it-works-preview__qr-frame grid gap-px p-2"
                  style={{
                    gridTemplateColumns: `repeat(${QR_SIZE}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${QR_SIZE}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: QR_SIZE * QR_SIZE }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-[1px]"
                      style={{
                        backgroundColor: isQrCellFilled(i) ? 'rgba(35, 35, 36, 0.86)' : 'transparent',
                      }}
                    />
                  ))}
                </div>
                <p className="text-[11px] font-medium text-ink">Scan to open</p>
              </div>

              <div className="cc-how-it-works-preview__scan-content">
                <div className="cc-how-it-works-preview__scan-summary">
                  <div>
                    <p className="font-eyebrow text-[9px] uppercase tracking-[0.1em] text-smoke">
                      Opens into
                    </p>
                    <p className="mt-1 font-display text-[17px] leading-tight text-ink">
                      A full project showcase
                    </p>
                  </div>
                  <span className="cc-how-it-works-preview__scan-pill font-eyebrow">3 projects</span>
                </div>

                <div className="space-y-2">
                  {allProjects.slice(0, 2).map((project) => (
                    <div key={project.id} className="cc-how-it-works-preview__mini-project">
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-[9px] border border-[rgba(34,34,34,0.08)]">
                        {project.posterUrl && (
                          <Image
                            src={project.posterUrl}
                            alt=""
                            fill
                            className="object-cover object-top"
                            sizes="64px"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="break-words font-display text-[13px] leading-tight text-ink">
                          {project.title}
                        </p>
                        <p className="mt-0.5 break-words text-[10px] leading-tight text-smoke">{project.tagline}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showProjects && (
            <div className="cc-how-it-works-preview__projects space-y-2 p-3 pt-2">
              {showFilter && <PreviewFilterBar active={activeFilter} />}

              {displayProjects.map((p, i) => {
                const isLead = i === 0;
                const showVideo =
                  expanded && isLead && !reducedMotion && Boolean(p.videoUrl);

                return (
                  <div key={p.id} className={isLead && expanded ? 'space-y-2' : ''}>
                    <div
                      className={`cc-how-it-works-preview__media relative overflow-hidden rounded-[10px] border border-[rgba(34,34,34,0.1)] transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isLead && expanded
                          ? 'h-[220px]'
                          : 'cc-how-it-works-preview__media--compact h-[64px]'
                      }`}
                    >
                      {isLead && expanded ? (
                        <>
                          {showVideo && p.videoUrl ? (
                            <video
                              src={p.videoUrl}
                              poster={p.posterUrl ?? undefined}
                              autoPlay
                              muted
                              loop
                              playsInline
                              className="h-full w-full object-cover object-top"
                            />
                          ) : p.posterUrl ? (
                            <Image
                              src={p.posterUrl}
                              alt=""
                              fill
                              className="object-cover object-top opacity-90"
                              sizes="300px"
                            />
                          ) : null}
                          <div className="cc-how-it-works-preview__media-overlay cc-how-it-works-preview__media-overlay--compact bg-[linear-gradient(0deg,rgba(5,3,15,0.82),rgba(5,3,15,0.28),transparent)]">
                            <p className="font-display text-[14px] leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">{p.title}</p>
                            <p className="break-words text-[10px] font-semibold leading-tight text-white/92 drop-shadow-[0_2px_8px_rgba(0,0,0,0.62)]">{p.tagline}</p>
                          </div>
                        </>
                      ) : (
                        <div className="cc-how-it-works-preview__project-card">
                          <div className="cc-how-it-works-preview__project-thumb">
                            {p.posterUrl ? (
                              <Image
                                src={p.posterUrl}
                                alt=""
                                fill
                                className="object-cover object-top"
                                sizes="72px"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="break-words font-display text-[12px] leading-tight text-ink">{p.title}</p>
                            <p className="mt-0.5 break-words text-[9px] leading-tight text-smoke">{p.tagline}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {isLead && expanded && p.screenshots?.[0] && p.screenshots?.[1] && (
                      <div className="grid grid-cols-2 gap-1.5">
                        {[p.screenshots[0], p.screenshots[1]].map((src, j) => (
                          <div
                            key={j}
                            className="relative h-14 overflow-hidden rounded-[8px] border border-[rgba(34,34,34,0.1)]"
                          >
                            <Image src={src} alt="" fill className="object-cover" sizes="140px" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <AnimatePresence>
            {showSavePrompt && (
              <SaveConnectionPrompt key="save-prompt" reducedMotion={reducedMotion} />
            )}
          </AnimatePresence>

          {showSavedToast && (
            <div className="cc-how-it-works-preview__saved-toast mx-3 mt-2 flex items-center justify-center gap-1.5 rounded-full border border-[rgba(34,34,34,0.08)] bg-[#daf7ee] px-3 py-1.5">
              <HiCheck className="h-3 w-3 text-ink" aria-hidden />
              <p className="font-eyebrow text-[9px] uppercase tracking-[0.08em] text-ink">
                Saved to connections
              </p>
            </div>
          )}

          {step >= 5 && (
            <div className="cc-how-it-works-preview__note mx-3 mb-3 rounded-[12px] p-2.5">
              <p className="font-eyebrow text-[10px] uppercase tracking-[0.08em] text-smoke">
                Private note
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink">
                Met at DevConf, follow up Jul 2
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveConnectionPrompt({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <motion.div
      className="cc-how-it-works-preview__save-overlay absolute inset-0 z-10 flex items-center justify-center p-4"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="cc-how-it-works-preview__save-backdrop absolute inset-0" aria-hidden />

      <motion.div
        className="cc-how-it-works-preview__save-prompt relative flex flex-col items-center"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.88, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reducedMotion ? undefined : { opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="font-eyebrow text-[8px] uppercase tracking-[0.14em] text-smoke">
          Been browsing a while
        </p>

        <div className="cc-how-it-works-preview__save-plus my-3 flex h-14 w-14 items-center justify-center rounded-full border">
          <HiPlus className="h-7 w-7 text-ink" strokeWidth={2} aria-hidden />
        </div>

        <p className="font-display text-[14px] leading-tight text-ink">Save connection?</p>
        <p className="mt-1.5 max-w-[150px] text-center text-[10px] leading-relaxed text-smoke">
          Tap + to keep {DEMO_PROFILE.display_name?.split(' ')[0] ?? 'them'} in your circle
        </p>
      </motion.div>
    </motion.div>
  );
}

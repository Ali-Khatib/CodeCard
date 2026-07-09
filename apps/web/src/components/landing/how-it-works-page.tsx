'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HiOutlineFunnel, HiPlus, HiCheck } from 'react-icons/hi2';
import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE } from '@/lib/projects/demo-data';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { TYPE } from '@/lib/design/tokens';
import { SectionCounter } from './section-counter';
import { ScrollReveal } from './scroll-reveal';
import { AuroraDivider } from './aurora-divider';

const STEPS = [
  {
    title: 'Scan or share',
    detail: 'QR code or link. They open your showcase on their phone. No app install.',
  },
  {
    title: 'Profile & best work',
    detail:
      'Name, role, and links up top. Your strongest projects show first with screenshots, demos, and outcomes.',
  },
  {
    title: 'Filter by domain',
    detail: 'Visitors narrow your work by focus area when you have a lot to show.',
  },
  {
    title: 'Project expands',
    detail: 'One tap for screenshots, video, repo links, and live demos.',
  },
  {
    title: 'Save the connection',
    detail:
      'After they browse your profile or a project for a bit, a gentle prompt asks if they want to save you to their circle.',
  },
  {
    title: 'Add private context',
    detail: 'Where you met, follow-ups, and notes. Visible only to you.',
  },
] as const;

/** Viewport heights of scroll runway per step */
const STEP_SCROLL_VH = 72;

export function HowItWorksSection() {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const useStaticLayout = reducedMotion || isMobile;
  const [activeStep, setActiveStep] = useState(0);
  const runwayRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(activeStep);
  const step = STEPS[activeStep];

  const goToStep = useCallback((index: number) => {
    const next = Math.min(STEPS.length - 1, Math.max(0, index));
    if (stepRef.current === next) return;
    stepRef.current = next;
    setActiveStep(next);
  }, []);

  useEffect(() => {
    if (useStaticLayout) return;

    let raf = 0;
    const measure = () => {
      const runway = runwayRef.current;
      if (!runway) return;

      const rect = runway.getBoundingClientRect();
      const stepPx = window.innerHeight * (STEP_SCROLL_VH / 100);
      const scrolled = Math.max(0, -rect.top);
      goToStep(Math.floor(scrolled / stepPx));
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    measure();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [goToStep, useStaticLayout]);

  const scrollToStep = (index: number) => {
    const runway = runwayRef.current;
    if (!runway) return;
    const stepPx = window.innerHeight * (STEP_SCROLL_VH / 100);
    const top = runway.getBoundingClientRect().top + window.scrollY + index * stepPx;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div id="how-it-works" className="scroll-mt-28 py-20 md:py-[100px]">
      <section className="cc-container pb-10 md:pb-14">
        <ScrollReveal>
          <SectionCounter index="04" label="How it works" />
          <h2 className={`mt-6 ${TYPE.sectionHeading} text-phosphor`}>
            Share once. <span className="cc-text-reactor">They see your work.</span>
          </h2>
          <p className="mt-6 max-w-[680px] text-[18px] leading-[1.55] text-lichen">
            Six steps from first scan to a saved connection, built for intros, events, and async
            sharing.{useStaticLayout ? '' : ' Scroll to walk through it.'}
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
        <section className="cc-container">
          <div
            ref={runwayRef}
            className="cc-how-it-works-runway grid gap-10 md:grid-cols-[minmax(280px,380px)_1fr] md:gap-14 lg:gap-20"
            style={{ minHeight: `${STEPS.length * STEP_SCROLL_VH}vh` }}
          >
            <div className="relative hidden md:block">
              <div className="sticky top-28">
                <nav className="cc-how-it-works-rail-nav flex flex-col" aria-label="How it works steps">
                  {STEPS.map((s, i) => {
                    const isActive = i === activeStep;
                    return (
                      <motion.div
                        key={s.title}
                        className={`cc-how-it-works-pill-wrap ${isActive ? 'cc-how-it-works-pill-wrap--active' : ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => scrollToStep(i)}
                          className="cc-how-it-works-pill text-left"
                          aria-current={isActive ? 'step' : undefined}
                        >
                          <span className="cc-how-it-works-pill__num font-eyebrow">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="cc-how-it-works-pill__title font-display">{s.title}</span>
                        </button>

                        <div className="cc-how-it-works-pill__detail" aria-hidden={!isActive}>
                          <p>{s.detail}</p>
                          {i === 3 && (
                            <div className="mt-4 flex flex-wrap gap-2">
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
                        </div>
                      </motion.div>
                    );
                  })}
                </nav>
              </div>
            </div>

            <div className="md:sticky md:top-24 md:self-start">
              <motion.div
                animate={{ rotateZ: activeStep % 2 === 0 ? -0.8 : 0.8 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="cc-how-it-works-phone-wrap cc-how-it-works-phone-wrap--right"
              >
                <PhoneMock step={activeStep} />
              </motion.div>

              <StepPanel
                step={step}
                stepIndex={activeStep}
                total={STEPS.length}
                className="mt-8 md:hidden"
              />

              <p className="mt-5 text-center font-eyebrow text-[12px] uppercase tracking-[0.08em] text-graphite md:hidden">
                Step {activeStep + 1} of {STEPS.length}
              </p>
            </div>
          </div>
        </section>
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

function PhoneMock({ step }: { step: number }) {
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
    <div className="cc-how-it-works-preview cc-how-it-works-preview--large relative mx-auto w-full max-w-[min(92vw,390px)] md:max-w-[580px]">
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
                <p className="truncate font-display text-[15px] text-ink">
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
              <p className="truncate text-[11px] text-smoke">{DEMO_PROFILE.headline}</p>
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
                        <p className="truncate font-display text-[13px] leading-tight text-ink">
                          {project.title}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-smoke">{project.tagline}</p>
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
                        isLead && expanded ? 'h-[220px]' : 'h-[88px]'
                      }`}
                    >
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
                      <div className="cc-how-it-works-preview__media-overlay cc-how-it-works-preview__media-overlay--compact">
                        <p className="font-display text-[13px] leading-tight text-white">{p.title}</p>
                        <p className="truncate text-[10px] text-white/75">{p.tagline}</p>
                      </div>
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

'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import {
  ensureGsapPlugins,
  gsap,
  gsapMarkersEnabled,
  refreshScrollTrigger,
} from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { useScrollTriggerRefresh } from '@/hooks/use-scroll-trigger-refresh';

type EditorialHeroSceneProps = {
  hero: ReactNode;
};

/** Page-load entrance only — not scroll-driven. */
const INTRO_DURATION = 1.1;
/** Matches cubic-bezier(0.16, 1, 0.3, 1) closely (premium ease-out). */
const INTRO_EASE = 'expo.out';

/**
 * Pin runway for expand + statement beats.
 * Expand itself is a tiny fraction of this — one small scroll gesture.
 */
const CINEMA_SCROLL_END = { desktop: '+=520%', mobile: '+=460%' } as const;
/** Snappy scrub so expand tracks the wheel tightly (not a slow lag). */
const CINEMA_SCRUB = 0.2;
/**
 * Share of the runway for cream inset → full-bleed.
 * ~0.04 × 520vh ≈ 0.21vh — one small scroll finishes the expansion.
 */
const CINEMA_EXPAND_END = 0.04;
/** Full-bleed hold — hero + CTAs stay visible while you scroll down. */
const CINEMA_CHROME_START = 0.11;
/** Progress line + tag dock under hero; beats start after hero clears. */
const CINEMA_STATEMENT_START = 0.19;

/** Per-beat scroll shares: rise ↑, fill words, exit ↑, gap (empty). */
const BEAT_ENTER_SHARE = 0.1;
const BEAT_FILL_SHARE = 0.54;
const BEAT_EXIT_SHARE = 0.13;
/** Enter from below viewport; exit upward like IB. */
const BEAT_ENTER_Y = 32;
const BEAT_EXIT_Y = -34;

/**
 * Only true after a successful intro (or intentional skip).
 * Do NOT set this before the timeline finishes — Strict Mode remount would
 * kill the first run and skip the second, so expansion never plays.
 */
let heroIntroPlayed = false;

const STATEMENT_BEATS = [
  {
    id: 'problem',
    title: 'Your work belongs in one place.',
    lead: 'Your work belongs',
    sub: 'in one place.',
    lede:
      'Not a link tree. Not a PDF resume. CodeCard is one living profile where your projects, research, connections, and analytics sit together. People actually understand what you do.',
    detail:
      'Stop sending people to five tabs. Share one link and they see the full picture.',
  },
  {
    id: 'shift',
    title: 'Show what you build right on the spot.',
    lead: 'Show what you build',
    sub: 'right on the spot.',
    lede:
      'When someone asks what you build, open your card. Demos, stack, outcomes, and papers are right there. Nothing buried in GitHub, Notion, or LinkedIn.',
    detail:
      'They get proof while you are talking, not a promise to look later.',
  },
  {
    id: 'identity',
    title: 'One card. Your whole story.',
    lead: 'One card.',
    sub: 'Your whole story.',
    lede:
      'Projects, papers, and connection notes stay on one identity you can hand off at a meetup, interview, or pitch. You carry it with you after.',
    detail:
      'Hand someone your CodeCard. They leave knowing who you are and what you ship.',
  },
] as const;

function wordsOf(text: string) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function StatementWords({
  text,
  beatId,
  tone,
}: {
  text: string;
  beatId: string;
  tone: 'lead' | 'sub' | 'lede';
}) {
  const words = wordsOf(text);
  const toneClass =
    tone === 'lead'
      ? 'cc-ed-hero-scene__statement-lead'
      : tone === 'sub'
        ? 'cc-ed-hero-scene__statement-sub'
        : 'cc-ed-hero-scene__statement-lede-run';
  return (
    <span className={toneClass}>
      {words.map((word, wi) => (
        <span
          key={`${beatId}-${tone}-${wi}`}
          className="cc-ed-hero-scene__statement-word"
          data-statement-word
        >
          {word}
          {wi < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
}

function stageRadius(mobile: boolean) {
  return mobile ? 22 : 28;
}

function creamPad(mobile: boolean) {
  return mobile ? 8 : 10;
}

/** Fully shut — cream page only. Used as intro FROM state. */
function introClipShut(mobile: boolean) {
  const r = stageRadius(mobile);
  return `inset(50% 50% 50% 50% round ${r}px)`;
}

/**
 * Settled IB frame after load: cream frame via clip-path inset (px), not layout padding.
 * Scroll expands this continuously to full-bleed.
 */
function scrollClipClosed(mobile: boolean) {
  const r = stageRadius(mobile);
  const p = creamPad(mobile);
  return `inset(${p}px ${p}px ${p}px ${p}px round ${r}px)`;
}

function scrollClipOpen() {
  return 'inset(0px 0px 0px 0px round 0px)';
}

/**
 * TWO SEPARATE systems (never mixed):
 * 1) Page-load entrance — ONE clip-path tween on locked final geometry (no scroll).
 * 2) After complete — scroll cinema (full-bleed + statement beats).
 */
export function EditorialHeroScene({ hero }: EditorialHeroSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);
  const pagerRef = useRef<HTMLSpanElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const { canEnhanceMotion, hydrated } = useMotionPreferences();
  useScrollTriggerRefresh();

  useGSAP(
    () => {
      if (!hydrated) return;

      const root = rootRef.current;
      const track = trackRef.current;
      const stage = stageRef.current;
      const statement = statementRef.current;
      if (!root || !track || !stage || !statement) return;

      ensureGsapPlugins();

      const mobile = window.matchMedia('(max-width: 767px)').matches;
      const openClip = scrollClipOpen();
      const closedClip = scrollClipClosed(mobile);
      const shutClip = introClipShut(mobile);
      const heroCopy = stage.querySelector<HTMLElement>('.cc-ed-hero__content');
      const heroMedia = stage.querySelector<HTMLElement>('.cc-ed-hero__media');
      const statementChrome = statement.querySelector<HTMLElement>(
        '.cc-ed-hero-scene__statement-chrome',
      );
      const statementStage = statement.querySelector<HTMLElement>(
        '.cc-ed-hero-scene__statement-stage',
      );
      const beatEls = Array.from(
        statement.querySelectorAll<HTMLElement>('[data-statement-beat]'),
      );
      const viewportH = () => window.innerHeight;
      const beatCount = Math.max(beatEls.length, 1);
      const beatSpan = (0.92 - CINEMA_STATEMENT_START) / beatCount;

      const setPager = (index: number) => {
        if (pagerRef.current) {
          pagerRef.current.textContent = String(index + 1).padStart(2, '0');
        }
        root.dataset.cinemaChapter = index < 0 ? 'hero' : 'statement';
      };

      const setStatementProgress = (statementLocal: number) => {
        if (!progressFillRef.current) return;
        const t = Math.max(0, Math.min(1, statementLocal));
        progressFillRef.current.style.transform = `scaleX(${t})`;
      };

      /**
       * Lock full-viewport stage once. Cream frame = clip-path only (no padding/height thrash).
       * Intro + scroll expand both animate clip-path on this locked box.
       */
      const lockFinalGeometry = (clip: string) => {
        const h = viewportH();
        gsap.set(root, {
          paddingTop: 0,
          paddingLeft: 0,
          paddingRight: 0,
          paddingBottom: 0,
        });
        gsap.set(stage, {
          clearProps:
            'width,height,minHeight,marginTop,marginLeft,marginRight,transform,scale,borderRadius',
        });
        stage.style.width = '100%';
        stage.style.height = `${h}px`;
        stage.style.minHeight = `${h}px`;
        stage.style.marginTop = '0';
        stage.style.marginLeft = '0';
        stage.style.marginRight = '0';
        stage.style.borderRadius = '0px';
        stage.style.clipPath = clip;
      };

      let scrollTl: gsap.core.Timeline | null = null;

      const notifyCinemaReady = () => {
        window.dispatchEvent(new CustomEvent('codecard:hero-cinema-ready'));
      };

      const buildScrollCinema = (opts?: { holdForIntro?: boolean }) => {
        const holdForIntro = Boolean(opts?.holdForIntro);

        lockFinalGeometry(holdForIntro ? shutClip : closedClip);
        if (!holdForIntro) {
          root.dataset.heroIntro = 'settled';
          document.body.style.overflow = '';
        }

        gsap.set(statement, { autoAlpha: 1 });
        if (statementChrome) {
          gsap.set(statementChrome, { autoAlpha: 0, y: 28 });
        }
        if (statementStage) {
          gsap.set(statementStage, { autoAlpha: 0 });
        }
        if (progressFillRef.current) {
          progressFillRef.current.style.transform = 'scaleX(0)';
        }
        beatEls.forEach((beat) => {
          gsap.set(beat, { autoAlpha: 0, yPercent: BEAT_ENTER_Y });
          beat
            .querySelectorAll<HTMLElement>('[data-statement-word]')
            .forEach((w) => {
              gsap.set(w, { opacity: 0.22 });
            });
        });
        setPager(-1);
        setStatementProgress(0);

        scrollTl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            id: 'editorial-hero-cinema',
            trigger: track,
            start: 'top top',
            end: mobile ? CINEMA_SCROLL_END.mobile : CINEMA_SCROLL_END.desktop,
            scrub: CINEMA_SCRUB,
            pin: stage,
            pinSpacing: true,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
            onUpdate: (self) => {
              const p = self.progress;
              if (p < CINEMA_CHROME_START) {
                root.dataset.cinemaChapter = 'hero';
                setPager(-1);
                setStatementProgress(0);
                return;
              }
              if (p < CINEMA_STATEMENT_START) {
                root.dataset.cinemaChapter = 'hero';
                setPager(-1);
                setStatementProgress(0);
                return;
              }
              root.dataset.cinemaChapter = 'statement';
              const statementSpan = 0.92 - CINEMA_STATEMENT_START;
              const local = Math.min(
                1,
                Math.max(0, (p - CINEMA_STATEMENT_START) / statementSpan),
              );
              const scaled = local * beatCount;
              const beatIndex = Math.min(beatCount - 1, Math.floor(scaled));
              setPager(beatIndex);
              setStatementProgress(local);
            },
          },
        });

        // Cream inset → full-bleed: ONE continuous clip-path scrub (no layout props).
        scrollTl.fromTo(
          stage,
          { clipPath: closedClip },
          { clipPath: openClip, duration: CINEMA_EXPAND_END, ease: 'none' },
          0,
        );

        if (heroMedia) {
          scrollTl.fromTo(
            heroMedia,
            { scale: 1 },
            { scale: 1.04, duration: CINEMA_EXPAND_END, ease: 'none' },
            0,
          );
        }

        /* IB flow: hero stays through expand + scroll-down hold + chrome dock. */
        if (heroCopy) {
          scrollTl.to(
            heroCopy,
            {
              autoAlpha: 0,
              yPercent: -10,
              duration: 0.055,
              ease: 'none',
            },
            CINEMA_STATEMENT_START,
          );
        }

        if (statementChrome) {
          scrollTl.fromTo(
            statementChrome,
            { autoAlpha: 0, y: 28 },
            {
              autoAlpha: 1,
              y: 0,
              duration: CINEMA_STATEMENT_START - CINEMA_CHROME_START,
              ease: 'none',
            },
            CINEMA_CHROME_START,
          );
        }

        if (statementStage) {
          scrollTl.set(
            statementStage,
            { autoAlpha: 1 },
            CINEMA_STATEMENT_START,
          );
        }

        beatEls.forEach((beat, beatIndex) => {
          const beatStart = CINEMA_STATEMENT_START + beatIndex * beatSpan;
          const words = Array.from(
            beat.querySelectorAll<HTMLElement>('[data-statement-word]'),
          );
          const enterDur = beatSpan * BEAT_ENTER_SHARE;
          const fillDur = beatSpan * BEAT_FILL_SHARE;
          const exitDur = beatSpan * BEAT_EXIT_SHARE;
          const fillAt = beatStart + enterDur;
          const exitAt = beatStart + enterDur + fillDur;
          const isLastBeat = beatIndex === beatCount - 1;

          scrollTl!.set(
            beat,
            { yPercent: BEAT_ENTER_Y },
            beatStart,
          );
          words.forEach((word) => {
            scrollTl!.set(word, { opacity: 0.22 }, beatStart);
          });

          scrollTl!.set(beat, { autoAlpha: 1 }, beatStart);

          scrollTl!.fromTo(
            beat,
            { yPercent: BEAT_ENTER_Y },
            { yPercent: 0, duration: enterDur, ease: 'none' },
            beatStart,
          );

          words.forEach((word, wi) => {
            const t =
              fillAt + (wi / Math.max(words.length, 1)) * fillDur * 0.94;
            scrollTl!.fromTo(
              word,
              { opacity: 0.22 },
              { opacity: 1, duration: fillDur * 0.08, ease: 'none' },
              t,
            );
          });

          if (!isLastBeat) {
            scrollTl!.to(
              beat,
              { yPercent: BEAT_EXIT_Y, duration: exitDur, ease: 'none' },
              exitAt,
            );
            scrollTl!.to(
              beat,
              { autoAlpha: 0, duration: exitDur * 0.4, ease: 'none' },
              exitAt + exitDur * 0.55,
            );
          }
        });

        if (holdForIntro) {
          // Keep pin-spacer in the document NOW so Crash Course measures correctly,
          // but don't scrub until the load entrance finishes.
          scrollTl.scrollTrigger?.disable(false);
          lockFinalGeometry(shutClip);
          root.dataset.heroIntro = 'running';
          refreshScrollTrigger({ safe: true });
          notifyCinemaReady();
          return;
        }

        refreshScrollTrigger({ safe: true });
        notifyCinemaReady();
      };

      const releaseIntroHold = () => {
        lockFinalGeometry(closedClip);
        root.dataset.heroIntro = 'settled';
        document.body.style.overflow = '';
        if (scrollTl?.scrollTrigger) {
          scrollTl.scrollTrigger.enable();
          scrollTl.progress(0);
        }
        refreshScrollTrigger({ safe: true });
        notifyCinemaReady();
      };

      // Hard refresh must not restore mid Crash Course under a late hero pin.
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      if (!window.location.hash) {
        window.scrollTo(0, 0);
      }

      const skipIntro =
        !canEnhanceMotion || window.scrollY > 24 || heroIntroPlayed;
      if (skipIntro) {
        heroIntroPlayed = true;
        buildScrollCinema();
        return () => {
          scrollTl?.scrollTrigger?.kill();
          scrollTl?.kill();
        };
      }

      let cancelled = false;
      let intro: gsap.core.Timeline | null = null;
      let introFinished = false;

      const markIntroDoneAndBuild = () => {
        if (introFinished) return;
        introFinished = true;
        heroIntroPlayed = true;
        releaseIntroHold();
      };

      document.body.style.overflow = 'hidden';
      // Pin runway exists before Crash Course mounts its ScrollTrigger.
      buildScrollCinema({ holdForIntro: true });

      if (heroCopy) {
        gsap.set(heroCopy, { autoAlpha: 0, y: 18 });
      }

      // ONE continuous tween: shut cream → settled IB hero. No width/height.
      intro = gsap.timeline({
        defaults: { ease: INTRO_EASE },
        onComplete: markIntroDoneAndBuild,
      });

      intro.fromTo(
        stage,
        { clipPath: shutClip },
        {
          clipPath: closedClip,
          duration: INTRO_DURATION,
          ease: INTRO_EASE,
          immediateRender: true,
        },
        0,
      );

      if (heroCopy) {
        intro.to(
          heroCopy,
          {
            autoAlpha: 1,
            y: 0,
            duration: INTRO_DURATION * 0.55,
            ease: INTRO_EASE,
          },
          INTRO_DURATION * 0.28,
        );
      }

      return () => {
        cancelled = true;
        document.body.style.overflow = '';
        if (!introFinished) {
          intro?.kill();
        } else {
          intro?.kill();
        }
        scrollTl?.scrollTrigger?.kill();
        scrollTl?.kill();
        void cancelled;
      };
    },
    {
      scope: rootRef,
      dependencies: [hydrated, canEnhanceMotion],
      revertOnUpdate: false,
    },
  );

  return (
    <div
      ref={rootRef}
      className="cc-ed-hero-scene cc-ed-hero-scene--enhanced"
      data-testid="editorial-hero-scene"
      data-chapter-section="hero"
      data-motion-pattern="section-enter"
      data-motion-owner="gsap"
      data-hero-intro="pending"
      data-cinema-chapter="hero"
    >
      <div ref={trackRef} className="cc-ed-hero-scene__track">
        <div ref={stageRef} className="cc-ed-hero-scene__stage">
          <div className="cc-ed-hero-scene__hero">
            <div className="cc-ed-hero-scene__hero-inner">{hero}</div>
          </div>

          <div
            ref={statementRef}
            className="cc-ed-hero-scene__statement"
            data-testid="editorial-statement"
            aria-labelledby="editorial-statement-heading"
          >
            <div className="cc-ed-hero-scene__statement-chrome">
              <p className="cc-ed-hero-scene__statement-tag">
                <span
                  className="cc-ed-hero-scene__statement-tag-mark"
                  aria-hidden
                />
                What this is
              </p>

              <div
                className="cc-ed-hero-scene__statement-progress"
                aria-hidden
              >
                <div
                  ref={progressFillRef}
                  className="cc-ed-hero-scene__statement-progress-fill"
                />
              </div>

              <p
                className="cc-ed-hero-scene__statement-pager"
                aria-live="polite"
              >
                <span ref={pagerRef} data-statement-index>
                  01
                </span>
                <span className="cc-ed-hero-scene__statement-pager-total">
                  {' '}
                  / 03
                </span>
              </p>
            </div>

            <div className="cc-ed-hero-scene__statement-stage">
              {STATEMENT_BEATS.map((beat, i) => (
                <div
                  key={beat.id}
                  className="cc-ed-hero-scene__statement-slot"
                  data-statement-beat={beat.id}
                  aria-hidden={i !== 0}
                >
                  <p
                    className="cc-ed-hero-scene__statement-body"
                    aria-label={beat.title}
                  >
                    <StatementWords
                      text={beat.lead}
                      beatId={beat.id}
                      tone="lead"
                    />{' '}
                    <StatementWords
                      text={beat.sub}
                      beatId={beat.id}
                      tone="sub"
                    />
                  </p>
                  <div className="cc-ed-hero-scene__statement-copy">
                    <p className="cc-ed-hero-scene__statement-lede">
                      <StatementWords
                        text={beat.lede}
                        beatId={beat.id}
                        tone="lede"
                      />
                    </p>
                    <p className="cc-ed-hero-scene__statement-detail">
                      <StatementWords
                        text={beat.detail}
                        beatId={`${beat.id}-detail`}
                        tone="lede"
                      />
                    </p>
                  </div>
                  {i === 0 ? (
                    <span
                      id="editorial-statement-heading"
                      className="sr-only"
                    >
                      {beat.title}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="cc-ed-hero-scene__bridge-out" aria-hidden />
    </div>
  );
}

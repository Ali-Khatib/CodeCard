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

/** Real scroll distance for cream inset → full-bleed (hero only — do not change). */
const EXPAND_SCROLL_VH = { desktop: 42, mobile: 38 } as const;
const CINEMA_SCRUB = 0.35;
/** Share of the expand segment used for the clip-path tween. */
const EXPAND_CLIP_END = 0.88;

/**
 * ONE pinned statement runway — scroll scrubs all 3 beats on the same panel.
 * Per beat: fill text + line → slight fade-up → next fades in muted at same spot.
 * Line stays fixed; fill resets each beat (progress for current text).
 */
const STATEMENT_PIN_SCROLL = { desktop: '+=360%', mobile: '+=300%' } as const;
const STATEMENT_WORD_DIM = 0.22;
const STATEMENT_WORD_LIT = 1;
/** Within each beat third: mostly fill, then short fade-up / next-in overlap. */
const BEAT_FILL_SHARE = 0.78;
const BEAT_EXIT_Y = -10;
const BEAT_ENTER_Y = 6;

let heroIntroPlayed = false;

const STATEMENT_BEATS = [
  {
    id: 'problem',
    title: 'Your work belongs in one place.',
    lead: 'Your work belongs',
    sub: 'in one place.',
    lede:
      'Not a link tree. Not a PDF resume. CodeCard is one living profile where your projects, research, connections, and analytics sit together. People actually understand what you do.',
  },
  {
    id: 'shift',
    title: 'Show what you build right on the spot.',
    lead: 'Show what you build',
    sub: 'right on the spot.',
    lede:
      'When someone asks what you build, open your card. Demos, stack, outcomes, and papers are right there. Nothing buried in GitHub, Notion, or LinkedIn.',
  },
  {
    id: 'identity',
    title: 'One card. Your whole story.',
    lead: 'One card.',
    sub: 'Your whole story.',
    lede:
      'Projects, papers, and connection notes stay on one identity you can hand off at a meetup, interview, or pitch. You carry it with you after.',
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

function introClipShut(mobile: boolean) {
  const r = stageRadius(mobile);
  return `inset(50% 50% 50% 50% round ${r}px)`;
}

function scrollClipClosed(mobile: boolean) {
  const r = stageRadius(mobile);
  const p = creamPad(mobile);
  return `inset(${p}px ${p}px ${p}px ${p}px round ${r}px)`;
}

function scrollClipOpen() {
  return 'inset(0px 0px 0px 0px round 0px)';
}

function runwayTotalVh(mobile: boolean) {
  const expand = mobile ? EXPAND_SCROLL_VH.mobile : EXPAND_SCROLL_VH.desktop;
  return expand + 100;
}

export function EditorialHeroScene({ hero }: EditorialHeroSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const runwayRef = useRef<HTMLDivElement>(null);
  const statementPinRef = useRef<HTMLDivElement>(null);
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
      const runway = runwayRef.current;
      const statementPin = statementPinRef.current;
      if (!root || !track || !stage || !runway || !statementPin) return;

      ensureGsapPlugins();

      const mobile = window.matchMedia('(max-width: 767px)').matches;
      const openClip = scrollClipOpen();
      const closedClip = scrollClipClosed(mobile);
      const shutClip = introClipShut(mobile);
      const expandScrollEnd = mobile
        ? `+=${EXPAND_SCROLL_VH.mobile}%`
        : `+=${EXPAND_SCROLL_VH.desktop}%`;
      const heroMedia = stage.querySelector<HTMLElement>('.cc-ed-hero__media');
      const heroCopy = stage.querySelector<HTMLElement>('.cc-ed-hero__copy');
      const panel = statementPin.querySelector<HTMLElement>(
        '[data-statement-panel]',
      );
      const beatEls = Array.from(
        statementPin.querySelectorAll<HTMLElement>('[data-statement-beat]'),
      );
      const viewportH = () => window.innerHeight;

      runway.style.minHeight = `${runwayTotalVh(mobile)}vh`;

      const syncLogoForExpand = (expandProgress: number) => {
        document.documentElement.dataset.logoTone =
          expandProgress < EXPAND_CLIP_END * 0.92 ? 'dark' : 'light';
      };

      const beatCount = Math.max(beatEls.length, 1);
      const beatSpan = 1 / beatCount;

      const setPager = (index: number) => {
        if (pagerRef.current) {
          pagerRef.current.textContent = String(index + 1).padStart(2, '0');
        }
      };

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

      let expandTl: gsap.core.Timeline | null = null;
      let statementTl: gsap.core.Timeline | null = null;

      const notifyCinemaReady = () => {
        window.dispatchEvent(new CustomEvent('codecard:hero-cinema-ready'));
      };

      const buildStatementPin = () => {
        if (!panel || !progressFillRef.current) return;

        const fillEl = progressFillRef.current;

        setPager(0);
        gsap.set(fillEl, { scaleX: 0, transformOrigin: 'left center' });

        /* Beat 0 starts in place, muted. Others wait off until their enter. */
        beatEls.forEach((beat, i) => {
          const words = beat.querySelectorAll<HTMLElement>('[data-statement-word]');
          gsap.set(words, { opacity: STATEMENT_WORD_DIM });
          if (i === 0) {
            gsap.set(beat, { autoAlpha: 1, yPercent: 0 });
          } else {
            gsap.set(beat, { autoAlpha: 0, yPercent: BEAT_ENTER_Y });
          }
        });

        statementTl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            id: 'editorial-hero-statement',
            trigger: statementPin,
            start: 'top top',
            end: mobile
              ? STATEMENT_PIN_SCROLL.mobile
              : STATEMENT_PIN_SCROLL.desktop,
            pin: panel,
            pinSpacing: true,
            scrub: true,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
            onUpdate: (self) => {
              root.dataset.cinemaChapter = 'statement';
              document.documentElement.dataset.logoTone = 'light';
              const beatIndex = Math.min(
                beatCount - 1,
                Math.floor(self.progress * beatCount),
              );
              setPager(beatIndex);
            },
            onLeave: () => {
              setPager(beatCount - 1);
            },
            onLeaveBack: () => {
              root.dataset.cinemaChapter = 'hero';
              setPager(0);
            },
          },
        });

        beatEls.forEach((beat, beatIndex) => {
          const beatStart = beatIndex * beatSpan;
          const words = Array.from(
            beat.querySelectorAll<HTMLElement>('[data-statement-word]'),
          );
          const isFirst = beatIndex === 0;
          const isLast = beatIndex === beatCount - 1;
          const fillDur = beatSpan * BEAT_FILL_SHARE;
          const transDur = beatSpan * (1 - BEAT_FILL_SHARE);
          const fillAt = beatStart;
          const exitAt = fillAt + fillDur;

          /* Enter: first already on-screen muted; later beats fade into same slot during previous exit. */
          if (isFirst) {
            statementTl!.set(beat, { autoAlpha: 1, yPercent: 0 }, beatStart);
            statementTl!.set(words, { opacity: STATEMENT_WORD_DIM }, beatStart);
            statementTl!.set(fillEl, { scaleX: 0 }, beatStart);
          } else {
            const enterAt = beatStart - transDur;
            statementTl!.set(words, { opacity: STATEMENT_WORD_DIM }, enterAt);
            statementTl!.fromTo(
              beat,
              { autoAlpha: 0, yPercent: BEAT_ENTER_Y },
              {
                autoAlpha: 1,
                yPercent: 0,
                duration: transDur,
                ease: 'none',
              },
              enterAt,
            );
            statementTl!.fromTo(
              fillEl,
              { scaleX: 1 },
              { scaleX: 0, duration: transDur * 0.4, ease: 'none' },
              enterAt,
            );
          }

          /* Fill: words brighten L→R; line fills in sync for THIS text. */
          words.forEach((word, wi) => {
            const t =
              fillAt + (wi / Math.max(words.length, 1)) * fillDur * 0.92;
            statementTl!.fromTo(
              word,
              { opacity: STATEMENT_WORD_DIM },
              {
                opacity: STATEMENT_WORD_LIT,
                duration: Math.max(fillDur * 0.06, 0.01),
                ease: 'none',
              },
              t,
            );
          });
          statementTl!.fromTo(
            fillEl,
            { scaleX: 0 },
            { scaleX: 1, duration: fillDur, ease: 'none' },
            fillAt,
          );

          /* Exit: slight fade-up while next fades in (no blank frame). */
          if (!isLast) {
            statementTl!.to(
              beat,
              {
                yPercent: BEAT_EXIT_Y,
                autoAlpha: 0,
                duration: transDur,
                ease: 'none',
              },
              exitAt,
            );
          }
        });
      };

      const buildScrollCinema = (opts?: { holdForIntro?: boolean }) => {
        const holdForIntro = Boolean(opts?.holdForIntro);

        lockFinalGeometry(holdForIntro ? shutClip : closedClip);
        if (!holdForIntro) {
          root.dataset.heroIntro = 'settled';
          document.body.style.overflow = '';
        }

        expandTl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            id: 'editorial-hero-expand',
            trigger: runway,
            start: 'top top',
            end: expandScrollEnd,
            scrub: CINEMA_SCRUB,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
            onUpdate: (self) => syncLogoForExpand(self.progress),
            onLeave: () => {
              document.documentElement.dataset.logoTone = 'light';
            },
          },
        });

        expandTl.fromTo(
          stage,
          { clipPath: closedClip },
          { clipPath: openClip, duration: EXPAND_CLIP_END, ease: 'none' },
          0,
        );

        if (heroMedia) {
          expandTl.fromTo(
            heroMedia,
            { scale: 1 },
            { scale: 1.04, duration: EXPAND_CLIP_END, ease: 'none' },
            0,
          );
        }

        buildStatementPin();

        if (holdForIntro) {
          expandTl.scrollTrigger?.disable(false);
          statementTl?.scrollTrigger?.disable(false);
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
        syncLogoForExpand(0);
        expandTl?.scrollTrigger?.enable();
        statementTl?.scrollTrigger?.enable();
        expandTl?.progress(0);
        refreshScrollTrigger({ safe: true });
        notifyCinemaReady();
      };

      const killAll = () => {
        expandTl?.scrollTrigger?.kill();
        expandTl?.kill();
        statementTl?.scrollTrigger?.kill();
        statementTl?.kill();
      };

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
        syncLogoForExpand(0);
        buildScrollCinema();
        return killAll;
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
      document.documentElement.dataset.logoTone = 'dark';
      buildScrollCinema({ holdForIntro: true });

      if (heroCopy) {
        gsap.set(heroCopy, { autoAlpha: 0, y: 18 });
      }

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
        intro?.kill();
        killAll();
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
        <div ref={runwayRef} className="cc-ed-hero-scene__runway">
          <div className="cc-ed-hero-scene__cinema-panel">
            <div ref={stageRef} className="cc-ed-hero-scene__stage">
              <div className="cc-ed-hero-scene__hero">
                <div className="cc-ed-hero-scene__hero-inner">{hero}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={statementPinRef}
        className="cc-ed-hero-scene__statement-pin"
        data-statement-pin
        data-testid="editorial-statement"
        aria-labelledby="editorial-statement-heading"
      >
        <div
          className="cc-ed-hero-scene__statement-panel"
          data-statement-panel
        >
          {/* Persistent full-bleed progress line — never moves, only fills */}
          <div
            className="cc-ed-hero-scene__statement-progress"
            aria-hidden
          >
            <div
              ref={progressFillRef}
              className="cc-ed-hero-scene__statement-progress-fill"
              data-statement-progress-fill
            />
          </div>

          <div className="cc-ed-hero-scene__statement-chrome">
            <p className="cc-ed-hero-scene__statement-tag">
              <span
                className="cc-ed-hero-scene__statement-tag-mark"
                aria-hidden
              />
              What this is
            </p>

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

          {/* Single text slot — beats fade up / fade in here, never under the line */}
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
                <p className="cc-ed-hero-scene__statement-lede">
                  <StatementWords
                    text={beat.lede}
                    beatId={beat.id}
                    tone="lede"
                  />
                </p>
                {i === 0 ? (
                  <span id="editorial-statement-heading" className="sr-only">
                    {beat.title}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cc-ed-hero-scene__bridge-out" aria-hidden />
    </div>
  );
}

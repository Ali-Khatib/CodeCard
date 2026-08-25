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
import { ShaderHeroBackdrop } from '@/components/ui/shader-hero';
import { useScrollTriggerRefresh } from '@/hooks/use-scroll-trigger-refresh';

type EditorialHeroSceneProps = {
  hero: ReactNode;
};

/** Page-load entrance only — not scroll-driven. */
const INTRO_DURATION = 1.1;
/** Matches cubic-bezier(0.16, 1, 0.3, 1) closely (premium ease-out). */
const INTRO_EASE = 'expo.out';

/** Real scroll distance for cream inset → full-bleed (hero only). */
const EXPAND_SCROLL_VH = { desktop: 42, mobile: 38 } as const;
/**
 * Extra pinned scroll after the frame is open, before the hero scrolls away.
 * Gives the full-bleed hero room to breathe instead of handing straight off
 * to the statement bar.
 */
const HERO_HOLD_VH = { desktop: 58, mobile: 42 } as const;
/**
 * Pinned scrub distance for the 3-group reveal — one viewport per group.
 * The hero scrolls away and the statement scrolls up on plain document
 * scroll first; nothing is faked with transforms.
 */
const STATEMENT_SCROLL_VH = { desktop: 300, mobile: 270 } as const;
const CINEMA_SCRUB = 0.35;
/** Share of the expand segment used for the clip-path tween. */
const EXPAND_CLIP_END = 0.88;

/**
 * Reveal runs per character so the fill reads as a wipe instead of a
 * word-by-word blink. Groups are stacked in one slot; ONE bar fills 0 → 1
 * across all three.
 */
const STATEMENT_CHAR_DIM = 0.4;
const STATEMENT_CHAR_LIT = 1;
/** Share of each group's segment spent filling before it hands over. */
const BEAT_FILL_SHARE = 0.72;
/**
 * A finished group lifts as it fades. The incoming group fades in where the old
 * one sat, without moving, so nothing appears to spawn from below.
 */
const BEAT_EXIT_LIFT = -36;

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
      'When someone asks what you build, open your card. Demos, stack, outcomes, and papers are right there. Nothing buried across a dozen other tabs.',
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

/**
 * Words stay inline-block so wrapping only ever breaks on real spaces, while
 * each character inside gets its own node for the scrubbed fill.
 */
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
        <span key={`${beatId}-${tone}-${wi}`}>
          <span
            className="cc-ed-hero-scene__statement-word"
            data-statement-word
          >
            {Array.from(word).map((char, ci) => (
              <span
                key={`${beatId}-${tone}-${wi}-${ci}`}
                className="cc-ed-hero-scene__statement-char"
                data-statement-char
                aria-hidden
              >
                {char}
              </span>
            ))}
          </span>
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
  return mobile ? 14 : 18;
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

/**
 * Hero runway: sticky panel (100vh) plus the expand distance plus the hold.
 * The panel stays stuck for expand + hold, then the hero scrolls away on plain
 * document scroll while the statement rises into place.
 */
function runwayTotalVh(mobile: boolean) {
  const expand = mobile ? EXPAND_SCROLL_VH.mobile : EXPAND_SCROLL_VH.desktop;
  const hold = mobile ? HERO_HOLD_VH.mobile : HERO_HOLD_VH.desktop;
  return expand + hold + 100;
}

/** Statement section: one viewport in view, then the pinned scrub distance. */
function statementTotalVh(mobile: boolean) {
  const pin = mobile
    ? STATEMENT_SCROLL_VH.mobile
    : STATEMENT_SCROLL_VH.desktop;
  return pin + 100;
}

export function EditorialHeroScene({ hero }: EditorialHeroSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const runwayRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLElement>(null);
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
      const field = fieldRef.current;
      const runway = runwayRef.current;
      const statement = statementRef.current;
      if (!root || !track || !stage || !field || !runway || !statement) return;

      ensureGsapPlugins();

      const mobile = window.matchMedia('(max-width: 767px)').matches;
      const openClip = scrollClipOpen();
      const closedClip = scrollClipClosed(mobile);
      const shutClip = introClipShut(mobile);
      const expandScrollEnd = mobile
        ? `+=${EXPAND_SCROLL_VH.mobile}%`
        : `+=${EXPAND_SCROLL_VH.desktop}%`;
      /* The field and the hero frame are clipped as one so they stay in step. */
      const clipped = [stage, field];
      const heroMedia = field.querySelector<HTMLElement>('.cc-ed-hero__media');
      const heroCopy = stage.querySelector<HTMLElement>('.cc-ed-hero__copy');
      const beatEls = Array.from(
        statement.querySelectorAll<HTMLElement>('[data-statement-beat]'),
      );
      const viewportH = () => window.innerHeight;

      runway.style.minHeight = `${runwayTotalVh(mobile)}vh`;
      statement.style.minHeight = `${statementTotalVh(mobile)}vh`;

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
        gsap.set(clipped, {
          clearProps:
            'width,height,minHeight,marginTop,marginLeft,marginRight,transform,scale,borderRadius',
        });
        for (const el of clipped) {
          el.style.width = '100%';
          el.style.height = `${h}px`;
          el.style.minHeight = `${h}px`;
          el.style.marginTop = '0';
          el.style.marginLeft = '0';
          el.style.marginRight = '0';
          el.style.borderRadius = '0px';
          el.style.clipPath = clip;
        }
      };

      let expandTl: gsap.core.Timeline | null = null;
      let statementTl: gsap.core.Timeline | null = null;

      const notifyCinemaReady = () => {
        window.dispatchEvent(new CustomEvent('codecard:hero-cinema-ready'));
      };

      const buildStatementReveal = () => {
        if (!progressFillRef.current) return;
        const fillEl = progressFillRef.current;

        setPager(0);
        gsap.set(fillEl, { scaleX: 0, transformOrigin: 'left center' });

        /*
         * The handoff window is split in two so the fades run back to back
         * instead of together — the old group is fully gone (autoAlpha also
         * kills visibility) before the new one starts, so they never ghost
         * over each other.
         */
        const fadeDur = (beatSpan * (1 - BEAT_FILL_SHARE)) / 2;

        /* Group 1 sits on screen already dim while the section scrolls up. */
        beatEls.forEach((beat, i) => {
          const chars = beat.querySelectorAll<HTMLElement>(
            '[data-statement-char]',
          );
          gsap.set(chars, { opacity: STATEMENT_CHAR_DIM });
          gsap.set(beat, { autoAlpha: i === 0 ? 1 : 0, y: 0 });
        });

        statementTl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            id: 'editorial-hero-statement',
            trigger: statement,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
            markers: gsapMarkersEnabled(),
            onUpdate: (self) => {
              root.dataset.cinemaChapter = 'statement';
              document.documentElement.dataset.logoTone = 'light';
              /*
               * Count from the crossover, not the segment edge — the incoming
               * group owns the slot a fade early, so the pager flips with it.
               */
              setPager(
                Math.min(
                  beatCount - 1,
                  Math.max(
                    0,
                    Math.floor((self.progress + fadeDur) * beatCount),
                  ),
                ),
              );
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

        /* ONE bar, linear across all three groups. */
        statementTl.fromTo(
          fillEl,
          { scaleX: 0 },
          { scaleX: 1, duration: 1, ease: 'none' },
          0,
        );

        beatEls.forEach((beat, beatIndex) => {
          const beatStart = beatIndex * beatSpan;
          const chars = Array.from(
            beat.querySelectorAll<HTMLElement>('[data-statement-char]'),
          );
          const isLast = beatIndex === beatCount - 1;
          const fillDur = beatSpan * BEAT_FILL_SHARE;

          /* Re-dim at the segment edge so a reversed scrub resets cleanly. */
          statementTl!.set(chars, { opacity: STATEMENT_CHAR_DIM }, beatStart);

          if (beatIndex > 0) {
            statementTl!.fromTo(
              beat,
              { autoAlpha: 0, y: 0 },
              {
                autoAlpha: 1,
                y: 0,
                duration: fadeDur,
                /*
                 * Steep curves on both sides keep each group readable for most
                 * of its fade, so the instant where neither is lit stays a
                 * crossover rather than a visible empty slot.
                 */
                ease: 'power2.out',
                /* Without this the from-state paints at build time. */
                immediateRender: false,
              },
              beatStart - fadeDur,
            );
          }

          chars.forEach((char, ci) => {
            statementTl!.fromTo(
              char,
              { opacity: STATEMENT_CHAR_DIM },
              {
                opacity: STATEMENT_CHAR_LIT,
                duration: Math.max(fillDur * 0.05, 0.004),
                ease: 'none',
              },
              beatStart + (ci / Math.max(chars.length, 1)) * fillDur * 0.95,
            );
          });

          /* Filled group lifts away, clearing the slot for the next one. */
          if (!isLast) {
            statementTl!.fromTo(
              beat,
              { autoAlpha: 1, y: 0 },
              {
                autoAlpha: 0,
                y: BEAT_EXIT_LIFT,
                duration: fadeDur,
                ease: 'power2.in',
                immediateRender: false,
              },
              beatStart + fillDur,
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
          clipped,
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

        buildStatementReveal();

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
        clipped,
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
        {/*
          ONE field for the hero and the statement. Sticky across the whole
          track, so both sections read off a single element instead of butting
          two viewport-sized panels together — which is what produced a seam.
        */}
        <div className="cc-ed-hero-scene__field" aria-hidden>
          <div ref={fieldRef} className="cc-ed-hero-scene__field-inner">
            <div className="cc-ed-hero__media" data-hero-shader>
              <ShaderHeroBackdrop />
              <div className="cc-ed-hero__veil" />
            </div>
          </div>
        </div>

        <div ref={runwayRef} className="cc-ed-hero-scene__runway">
          {/* Cream the inset clip reveals — sits behind the field. */}
          <div className="cc-ed-hero-scene__letterbox" aria-hidden />
          <div className="cc-ed-hero-scene__cinema-panel">
            <div ref={stageRef} className="cc-ed-hero-scene__stage">
              <div className="cc-ed-hero-scene__hero">
                <div className="cc-ed-hero-scene__hero-inner">{hero}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Real section under the hero: scrolls up, pins, then scrubs. */}
        <section
          ref={statementRef}
          className="cc-ed-hero-scene__statement"
          data-statement-section
          data-testid="editorial-statement"
          aria-labelledby="editorial-statement-heading"
        >
          <div className="cc-ed-hero-scene__statement-pin">
            <div className="cc-ed-hero-scene__statement-progress" aria-hidden>
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
        </section>
      </div>

      <div className="cc-ed-hero-scene__bridge-out" aria-hidden />
    </div>
  );
}

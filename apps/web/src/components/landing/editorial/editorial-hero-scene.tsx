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

const INTRO_DURATION = 1.2;
const INTRO_EASE = 'power3.out';
/** More viewport scroll = slower progress through beats. */
const CINEMA_SCROLL_END = { desktop: '+=520%', mobile: '+=460%' } as const;
const CINEMA_SCRUB = 0.55;
/** Real share of the runway for cream-frame → full-bleed expand (was 0.08 — invisible). */
const CINEMA_EXPAND_END = 0.24;

/**
 * Only true after a successful intro (or intentional skip).
 * Do NOT set this before the timeline finishes — Strict Mode remount would
 * kill the first run and skip the second, so expansion never plays.
 */
let heroIntroPlayed = false;

const STATEMENT_BEATS = [
  {
    id: 'problem',
    lead: 'YOUR WORK BELONGS',
    sub: 'IN ONE PLACE.',
    title: 'YOUR WORK BELONGS IN ONE PLACE.',
    lede:
      'Projects, papers, people, and signals live in one CodeCard you can share.',
  },
  {
    id: 'shift',
    lead: 'SHOW WHAT YOU BUILD.',
    sub: 'RIGHT ON THE SPOT.',
    title: 'SHOW WHAT YOU BUILD. RIGHT ON THE SPOT.',
    lede: 'Open your card and they see the work clearly, right away.',
  },
  {
    id: 'identity',
    lead: 'ONE CARD.',
    sub: 'YOUR WHOLE STORY.',
    title: 'ONE CARD. YOUR WHOLE STORY.',
    lede: 'Hand someone your CodeCard. They get the full picture in one place.',
  },
] as const;

function stageRadius(mobile: boolean) {
  return mobile ? 22 : 32;
}

/** Settled-but-not-full-bleed: still reads as an inset card on cream. */
function scrollClipClosed(mobile: boolean) {
  const r = stageRadius(mobile);
  return mobile
    ? `inset(3.5% 3.5% 3.5% 3.5% round ${r}px)`
    : `inset(4.5% 4% 4.5% 4% round ${r}px)`;
}

function scrollClipOpen() {
  return 'inset(0% 0% 0% 0% round 0px)';
}

/**
 * ONE continuous cinema:
 * 1) Load — visible inset dark hero expands once through cream matting
 * 2) Scroll — same frame grows full-bleed; hero copy exits; statement text
 *    loads word-by-word inside that frame (no second card, no cream gap)
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
      const finalRadius = stageRadius(mobile);
      const heroCopy = stage.querySelector<HTMLElement>('.cc-ed-hero__content');
      const beatEls = Array.from(
        statement.querySelectorAll<HTMLElement>('[data-statement-beat]'),
      );
      const viewportH = () => window.innerHeight;
      const beatCount = Math.max(beatEls.length, 1);
      const beatSpan = (0.92 - CINEMA_EXPAND_END) / beatCount;
      const pad = mobile
        ? { top: 10, x: 12, bottom: 10 }
        : { top: 14, x: 16, bottom: 14 };

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

      /** After load expand: full width of cream frame, still inset via clip + root pad. */
      const snapSettledGeometry = () => {
        gsap.set(root, {
          paddingTop: pad.top,
          paddingLeft: pad.x,
          paddingRight: pad.x,
          paddingBottom: pad.bottom,
        });
        gsap.set(stage, {
          clearProps:
            'width,height,minHeight,marginTop,marginLeft,marginRight,borderRadius',
        });
        stage.style.width = '100%';
        stage.style.height = `${viewportH()}px`;
        stage.style.minHeight = `${viewportH()}px`;
        stage.style.marginTop = '0';
        stage.style.marginLeft = '0';
        stage.style.marginRight = '0';
        stage.style.borderRadius = `${finalRadius}px`;
        stage.style.clipPath = closedClip;
        root.dataset.heroIntro = 'settled';
      };

      let scrollTl: gsap.core.Timeline | null = null;

      const buildScrollCinema = () => {
        snapSettledGeometry();
        document.body.style.overflow = '';

        gsap.set(statement, { autoAlpha: 0 });
        if (progressFillRef.current) {
          progressFillRef.current.style.transform = 'scaleX(0)';
        }
        beatEls.forEach((beat, i) => {
          gsap.set(beat, { autoAlpha: i === 0 ? 1 : 0 });
          beat.querySelectorAll<HTMLElement>('[data-statement-word]').forEach((w) => {
            gsap.set(w, { opacity: 0.72 });
          });
          const lede = beat.querySelector<HTMLElement>('[data-statement-lede]');
          if (lede) gsap.set(lede, { autoAlpha: 0, y: 14 });
        });
        setPager(-1);
        setStatementProgress(0);

        scrollTl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
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
              if (p < CINEMA_EXPAND_END * 0.92) {
                setPager(-1);
                setStatementProgress(0);
                return;
              }
              const statementSpan = 0.92 - CINEMA_EXPAND_END;
              const local = Math.min(
                1,
                Math.max(0, (p - CINEMA_EXPAND_END) / statementSpan),
              );
              const scaled = local * beatCount;
              const beatIndex = Math.min(beatCount - 1, Math.floor(scaled));
              const withinBeat =
                local >= 1 ? 1 : Math.min(1, Math.max(0, scaled - beatIndex));
              setPager(beatIndex);
              setStatementProgress(withinBeat);
            },
          },
        });

        // Cream frame → full-bleed (padding + clip + radius). Long enough to feel.
        scrollTl.fromTo(
          root,
          {
            paddingTop: pad.top,
            paddingLeft: pad.x,
            paddingRight: pad.x,
            paddingBottom: pad.bottom,
          },
          {
            paddingTop: 0,
            paddingLeft: 0,
            paddingRight: 0,
            paddingBottom: 0,
            duration: CINEMA_EXPAND_END,
          },
          0,
        );
        scrollTl.fromTo(
          stage,
          { clipPath: closedClip, borderRadius: finalRadius },
          { clipPath: openClip, borderRadius: 0, duration: CINEMA_EXPAND_END },
          0,
        );

        if (heroCopy) {
          scrollTl.to(
            heroCopy,
            {
              autoAlpha: 0,
              yPercent: -8,
              duration: CINEMA_EXPAND_END * 0.45,
            },
            CINEMA_EXPAND_END * 0.4,
          );
        }

        // Statement only after expand is essentially done.
        scrollTl.to(
          statement,
          { autoAlpha: 1, duration: CINEMA_EXPAND_END * 0.12 },
          CINEMA_EXPAND_END * 0.88,
        );

        beatEls.forEach((beat, beatIndex) => {
          const beatStart = CINEMA_EXPAND_END + beatIndex * beatSpan;
          const words = Array.from(
            beat.querySelectorAll<HTMLElement>('[data-statement-word]'),
          );
          const lede = beat.querySelector<HTMLElement>('[data-statement-lede]');
          const crossfade = beatSpan * 0.1;
          const wordRevealSpan = beatSpan * 0.52;

          if (beatIndex > 0) {
            scrollTl!.fromTo(
              beat,
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: crossfade },
              beatStart,
            );
            scrollTl!.to(
              beatEls[beatIndex - 1]!,
              { autoAlpha: 0, duration: crossfade },
              beatStart,
            );
          }

          words.forEach((word, wi) => {
            const t =
              beatStart +
              beatSpan * 0.08 +
              (wi / Math.max(words.length, 1)) * wordRevealSpan;
            scrollTl!.fromTo(
              word,
              { opacity: 0.72 },
              { opacity: 1, duration: beatSpan * 0.08 },
              t,
            );
          });

          if (lede) {
            scrollTl!.fromTo(
              lede,
              { autoAlpha: 0, y: 14 },
              { autoAlpha: 1, y: 0, duration: beatSpan * 0.14 },
              beatStart + beatSpan * 0.58,
            );
          }
        });

        refreshScrollTrigger({ safe: true });
      };

      const skipIntro = !canEnhanceMotion || window.scrollY > 24 || heroIntroPlayed;
      if (skipIntro) {
        heroIntroPlayed = true;
        snapSettledGeometry();
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
        buildScrollCinema();
      };

      const raf = window.requestAnimationFrame(() => {
        if (cancelled) return;

        if (heroIntroPlayed) {
          snapSettledGeometry();
          buildScrollCinema();
          return;
        }

        root.dataset.heroIntro = 'running';

        // Explicit from → to so CSS pending size is the start, not a snap.
        const fromW = mobile ? '90%' : '88%';
        const fromH = mobile
          ? () => Math.min(window.innerHeight * 0.54, window.innerHeight * 0.58)
          : () => Math.min(window.innerHeight * 0.58, window.innerHeight * 0.62);
        const fromRadius = mobile ? 24 : 28;
        const fromMarginTop = mobile
          ? () => Math.min(window.innerHeight * 0.04, 40)
          : () => Math.min(window.innerHeight * 0.06, 72);

        gsap.set(stage, {
          width: fromW,
          height: fromH,
          minHeight: fromH,
          marginTop: fromMarginTop,
          marginLeft: 'auto',
          marginRight: 'auto',
          borderRadius: fromRadius,
          clipPath: openClip,
        });

        intro = gsap.timeline({
          onComplete: markIntroDoneAndBuild,
        });

        intro.to(
          stage,
          {
            width: '100%',
            height: viewportH,
            minHeight: viewportH,
            marginTop: 0,
            marginLeft: 0,
            marginRight: 0,
            borderRadius: finalRadius,
            duration: INTRO_DURATION,
            ease: INTRO_EASE,
          },
          0,
        );

        // Land in the settled inset clip so scroll expand has somewhere to go.
        intro.to(
          stage,
          {
            clipPath: closedClip,
            duration: INTRO_DURATION * 0.35,
            ease: INTRO_EASE,
          },
          INTRO_DURATION * 0.65,
        );

        if (heroCopy) {
          intro.fromTo(
            heroCopy,
            { y: 10, autoAlpha: 0.92 },
            { y: 0, autoAlpha: 1, duration: 0.55, ease: INTRO_EASE },
            0.35,
          );
        }
      });

      const finishIntro = () => {
        if (intro && intro.progress() < 1) intro.progress(1);
      };

      window.addEventListener('wheel', finishIntro, { passive: true });
      window.addEventListener('touchmove', finishIntro, { passive: true });
      window.addEventListener('keydown', finishIntro);

      return () => {
        cancelled = true;
        window.cancelAnimationFrame(raf);
        window.removeEventListener('wheel', finishIntro);
        window.removeEventListener('touchmove', finishIntro);
        window.removeEventListener('keydown', finishIntro);
        document.body.style.overflow = '';
        // Interrupted before complete (Strict Mode) — allow remount to replay.
        if (!introFinished) {
          intro?.kill();
        } else {
          intro?.kill();
        }
        scrollTl?.scrollTrigger?.kill();
        scrollTl?.kill();
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

          {/* Same frame — statement loads in as you scroll; not a second card */}
          <div
            ref={statementRef}
            className="cc-ed-hero-scene__statement"
            data-testid="editorial-statement"
            aria-labelledby="editorial-statement-heading"
          >
            <div className="cc-ed-hero-scene__statement-chrome">
              <p className="cc-ed-hero-scene__statement-tag">
                <span className="cc-ed-hero-scene__statement-tag-mark" aria-hidden />
                What this is
              </p>
              <p className="cc-ed-hero-scene__statement-pager" aria-live="polite">
                <span ref={pagerRef} data-statement-index>
                  01
                </span>
                <span className="cc-ed-hero-scene__statement-pager-total"> / 03</span>
              </p>
            </div>

            <div className="cc-ed-hero-scene__statement-stage">
              <div
                className="cc-ed-hero-scene__statement-progress"
                aria-hidden
              >
                <div
                  ref={progressFillRef}
                  className="cc-ed-hero-scene__statement-progress-fill"
                />
              </div>

              {STATEMENT_BEATS.map((beat, i) => {
                const lead = beat.lead.split(/\s+/).filter(Boolean);
                const sub = beat.sub.split(/\s+/).filter(Boolean);
                return (
                  <div
                    key={beat.id}
                    className="cc-ed-hero-scene__statement-slot"
                    data-statement-beat={beat.id}
                    aria-hidden={i !== 0}
                  >
                    <h2
                      className="cc-ed-hero-scene__statement-headline"
                      aria-label={beat.title}
                    >
                      <span className="cc-ed-hero-scene__statement-lead">
                        {lead.map((word, wi) => (
                          <span
                            key={`l-${wi}`}
                            className="cc-ed-hero-scene__statement-word"
                            data-statement-word
                          >
                            {word}{' '}
                          </span>
                        ))}
                      </span>
                      <span className="cc-ed-hero-scene__statement-sub">
                        {sub.map((word, wi) => (
                          <span
                            key={`s-${wi}`}
                            className="cc-ed-hero-scene__statement-word"
                            data-statement-word
                          >
                            {word}{' '}
                          </span>
                        ))}
                      </span>
                    </h2>
                    <p
                      className="cc-ed-hero-scene__statement-lede"
                      data-statement-lede
                    >
                      {beat.lede}
                    </p>
                    {i === 0 ? (
                      <span id="editorial-statement-heading" className="sr-only">
                        {beat.title}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="cc-ed-hero-scene__bridge-out" aria-hidden />
    </div>
  );
}

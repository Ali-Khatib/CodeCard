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

const INTRO_DURATION = 1.15;
const INTRO_EASE = 'power3.out';
/** More viewport scroll = slower progress through beats. */
const CINEMA_SCROLL_END = { desktop: '+=520%', mobile: '+=460%' } as const;
const CINEMA_SCRUB = 0.55;
const CINEMA_EXPAND_END = 0.08;

/** Survive React Strict Mode remount so the expand never plays twice. */
let heroIntroPlayed = false;

const STATEMENT_BEATS = [
  {
    id: 'problem',
    lead: 'YOUR BEST WORK SHOULDN’T',
    sub: 'LIVE IN FIVE PLACES.',
    title: 'YOUR BEST WORK SHOULDN’T LIVE IN FIVE PLACES.',
    lede:
      'Projects, research, Circle, and connections belong in one shareable identity — not five tabs someone never opens.',
  },
  {
    id: 'shift',
    lead: 'DON’T SEND A LINK AND HOPE.',
    sub: 'SHOW THE WORK ON THE SPOT.',
    title: 'DON’T SEND A LINK AND HOPE. SHOW THE WORK ON THE SPOT.',
    lede:
      'The quickest way to showcase exactly what you do, so people see it clearly right away — not after they guess what a link means.',
  },
  {
    id: 'identity',
    lead: 'CARRY THE CARD.',
    sub: 'NOT FIVE TABS.',
    title: 'CARRY THE CARD. NOT FIVE TABS.',
    lede:
      'Hand someone your CodeCard. They see the work, the papers, and the people in one profile — without hunting across tabs.',
  },
] as const;

function stageRadius(mobile: boolean) {
  return mobile ? 22 : 32;
}

function scrollClipClosed(mobile: boolean) {
  const r = stageRadius(mobile);
  return `inset(0px 0px 0px 0px round ${r}px)`;
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
      const openClip = 'inset(0px 0px 0px 0px round 0px)';
      const closedClip = scrollClipClosed(mobile);
      const finalRadius = stageRadius(mobile);
      const heroCopy = stage.querySelector<HTMLElement>('.cc-ed-hero__content');
      const beatEls = Array.from(
        statement.querySelectorAll<HTMLElement>('[data-statement-beat]'),
      );
      const viewportH = () => window.innerHeight;
      const beatCount = Math.max(beatEls.length, 1);
      const beatSpan = (0.92 - CINEMA_EXPAND_END) / beatCount;

      const setPager = (index: number) => {
        if (pagerRef.current) {
          pagerRef.current.textContent = String(index + 1).padStart(2, '0');
        }
        root.dataset.cinemaChapter = index < 0 ? 'hero' : 'statement';
      };

      const snapSettledGeometry = () => {
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
        beatEls.forEach((beat, i) => {
          gsap.set(beat, { autoAlpha: i === 0 ? 1 : 0 });
          beat.querySelectorAll<HTMLElement>('[data-statement-word]').forEach((w) => {
            gsap.set(w, { opacity: 0.22 });
          });
          const lede = beat.querySelector<HTMLElement>('[data-statement-lede]');
          if (lede) gsap.set(lede, { autoAlpha: 0, y: 14 });
        });
        setPager(-1);

        // Long runway: expand → statement 01 → 02 → 03, then release.
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
              if (p < CINEMA_EXPAND_END) {
                setPager(-1);
                return;
              }
              const beatProgress = (p - CINEMA_EXPAND_END) / (0.92 - CINEMA_EXPAND_END);
              setPager(Math.min(beatCount - 1, Math.floor(beatProgress * beatCount)));
            },
          },
        });

        // 0 → expandEnd: hero grows full-bleed inside the same frame.
        scrollTl.fromTo(
          root,
          {
            paddingTop: mobile ? 10 : 14,
            paddingLeft: mobile ? 12 : 16,
            paddingRight: mobile ? 12 : 16,
            paddingBottom: mobile ? 10 : 14,
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
            { autoAlpha: 0, yPercent: -8, duration: CINEMA_EXPAND_END * 0.65 },
            CINEMA_EXPAND_END * 0.35,
          );
        }

        scrollTl.to(statement, { autoAlpha: 1, duration: 0.04 }, CINEMA_EXPAND_END - 0.02);

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
              { opacity: 0.22 },
              { opacity: 1, duration: beatSpan * 0.07 },
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

      if (!canEnhanceMotion || window.scrollY > 8 || heroIntroPlayed) {
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
      const raf = window.requestAnimationFrame(() => {
        if (cancelled || heroIntroPlayed) {
          if (!cancelled && heroIntroPlayed) {
            snapSettledGeometry();
            buildScrollCinema();
          }
          return;
        }

        heroIntroPlayed = true;
        root.dataset.heroIntro = 'running';

        intro = gsap.timeline({
          onComplete: buildScrollCinema,
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

        if (heroCopy) {
          intro.fromTo(
            heroCopy,
            { y: 8 },
            { y: 0, duration: 0.5, ease: INTRO_EASE },
            0.4,
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
        intro?.kill();
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

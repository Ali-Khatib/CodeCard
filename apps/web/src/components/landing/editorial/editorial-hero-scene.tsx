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
import { revealedWordCount } from '@/components/ui/reading-text-reveal';
import { useScrollTriggerRefresh } from '@/hooks/use-scroll-trigger-refresh';
import {
  applyLandingChromeInk,
  syncLandingChromeFromCinema,
} from '@/components/landing/editorial/landing-chrome-tone';

type EditorialHeroSceneProps = {
  hero: ReactNode;
};

/** Real scroll distance for cream inset → full-bleed (hero only). */
const EXPAND_SCROLL_VH = { desktop: 16, mobile: 14 } as const;
/**
 * Extra pinned scroll after the frame is open, before the hero scrolls away.
 * Gives the full-bleed hero room to breathe instead of handing straight off
 * to the statement bar.
 */
const HERO_HOLD_VH = { desktop: 58, mobile: 42 } as const;
/**
 * Pinned scrub distance for the 3-group reveal.
 * The hero scrolls away and the statement scrolls up on plain document
 * scroll first; nothing is faked with transforms.
 */
const STATEMENT_SCROLL_VH = { desktop: 620, mobile: 530 } as const;
const CINEMA_SCRUB = 0.35;
/** Share of the expand segment used for the clip-path tween. */
const EXPAND_CLIP_END = 1;

/**
 * Reveal runs word by word (reading-text-reveal): dim → full as scroll
 * crosses the section. Groups share one slot; ONE bar fills 0 → 1 across all three.
 */
const STATEMENT_WORD_LERP = 0.07;
/** Word fill, then a filled lift, then a fade-down before the next group. */
const BEAT_ENTER_SHARE = 0.14;
const BEAT_FILL_SHARE = 0.58;
const BEAT_SETTLE_SHARE = 0.12;
const BEAT_EXIT_SHARE = 0.16;
const BEAT_RISE_PX = 22;
const BEAT_LIFT_PX = 12;
const BEAT_SINK_PX = 18;
let heroIntroPlayed = false;

const STATEMENT_BEATS = [
  {
    id: 'meet',
    step: 'The moment you meet',
    title: 'Put your work in the room.',
    lead: 'Put your work in the room.',
    sub: 'Show it before the conversation moves on.',
    lede: "Open your CodeCard on your phone, or let them scan your QR. Your projects and research open instantly in their browser, right there, while you're talking.",
  },
  {
    id: 'discover',
    step: 'What they discover about you',
    title: 'Be more than your title.',
    lead: 'Be more than your title.',
    sub: 'Show people what you actually build, research, and care about.',
    lede: 'Your title tells people what you do. Your work tells them who you are. Bring your projects, research, experience, and ideas together in one place that gives people something real to remember you by.',
  },
  {
    id: 'after',
    step: 'After they see it',
    title: "Don't lose the connection.",
    lead: "Don't lose the connection.",
    sub: 'Keep the person, not just the profile.',
    lede: 'Save who you met, where you met, and what you talked about. Add a note, set a follow-up, and pick up where the conversation left off.',
  },
] as const;

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

function easeInQuad(t: number) {
  return t * t;
}

function beatWindows(beatIndex: number, beatCount: number, beatSpan: number) {
  const start = beatIndex * beatSpan;
  const enterDur = beatIndex === 0 ? 0 : beatSpan * BEAT_ENTER_SHARE;
  const settleDur = beatSpan * BEAT_SETTLE_SHARE;
  const exitDur =
    beatIndex === beatCount - 1 ? 0 : beatSpan * BEAT_EXIT_SHARE;
  const fillDur =
    beatSpan - enterDur - settleDur - exitDur;
  return {
    start,
    enterDur,
    fillDur,
    settleDur,
    exitDur,
    enterEnd: start + enterDur,
    fillEnd: start + enterDur + fillDur,
    settleEnd: start + enterDur + fillDur + settleDur,
  };
}

function wordsOf(text: string) {
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * One span per word. Scroll progress lights them in order — same mechanic as
 * reading-text-reveal, cream/orange type stays on the parent.
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
        <span
          key={`${beatId}-${tone}-${wi}`}
          className="cc-ed-hero-scene__statement-word"
          data-statement-word
          data-revealed="false"
        >
          {word}{' '}
        </span>
      ))}
    </span>
  );
}

function stageRadius(mobile: boolean) {
  return mobile ? 22 : 28;
}

function creamPad(mobile: boolean) {
  return mobile ? 12 : 16;
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
      const expandScrollEnd = mobile
        ? `+=${EXPAND_SCROLL_VH.mobile}%`
        : `+=${EXPAND_SCROLL_VH.desktop}%`;
      /* The field and the hero frame are clipped as one so they stay in step. */
      const clipped = [stage, field];
      const heroMedia = field.querySelector<HTMLElement>('.cc-ed-hero__media');
      const beatEls = Array.from(
        statement.querySelectorAll<HTMLElement>('[data-statement-beat]'),
      );
      const viewportH = () => window.innerHeight;

      runway.style.minHeight = `${runwayTotalVh(mobile)}vh`;
      statement.style.minHeight = `${statementTotalVh(mobile)}vh`;

      const shell = document.querySelector<HTMLElement>('.cc-marketing-shell');

      const setCinemaInset = (progress: number) => {
        const t = Math.min(1, Math.max(0, progress / EXPAND_CLIP_END));
        const pad = creamPad(mobile) * (1 - t);
        const radius = stageRadius(mobile) * (1 - t);
        shell?.style.setProperty('--cc-ed-cinema-inset', `${pad}px`);
        shell?.style.setProperty('--cc-ed-cinema-radius', `${radius}px`);
      };

      const syncLogoForExpand = (expandProgress: number) => {
        setCinemaInset(expandProgress);
        if (!syncLandingChromeFromCinema()) {
          applyLandingChromeInk('light');
        }
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
        setCinemaInset(clip === openClip ? 1 : 0);
      };

      let expandTl: gsap.core.Timeline | null = null;
      let statementTl: gsap.core.Timeline | null = null;

      const notifyCinemaReady = () => {
        window.dispatchEvent(new CustomEvent('codecard:hero-cinema-ready'));
      };

      let wordRevealTarget = 0;
      let wordRevealCurrent = 0;
      let wordRevealRaf: number | null = null;

      const activeBeatIndex = (progress: number) => {
        if (progress >= 1) return beatCount - 1;
        return Math.min(beatCount - 1, Math.max(0, Math.floor(progress / beatSpan)));
      };

      const setActiveBeat = (index: number) => {
        beatEls.forEach((beat, i) => {
          const on = i === index;
          if (beat.getAttribute('data-on') !== (on ? 'true' : 'false')) {
            beat.setAttribute('data-on', on ? 'true' : 'false');
            beat.setAttribute('aria-hidden', on ? 'false' : 'true');
          }
        });
        setPager(index);
      };

      const applyBeatMotion = (progress: number) => {
        beatEls.forEach((beat, beatIndex) => {
          const win = beatWindows(beatIndex, beatCount, beatSpan);
          const doneAt = win.settleEnd + win.exitDur;
          let opacity = 0;
          let y = BEAT_RISE_PX;
          let on = false;

          if (progress < win.start) {
            opacity = 0;
            y = BEAT_RISE_PX;
          } else if (win.exitDur > 0 && progress >= doneAt) {
            opacity = 0;
            y = BEAT_SINK_PX;
          } else if (progress < win.enterEnd) {
            const t = easeOutQuad(
              Math.min(
                1,
                (progress - win.start) / Math.max(win.enterDur, 1e-6),
              ),
            );
            opacity = t;
            y = BEAT_RISE_PX * (1 - t);
            on = t > 0.02;
          } else if (progress < win.fillEnd) {
            opacity = 1;
            y = 0;
            on = true;
          } else if (progress < win.settleEnd) {
            const t = easeOutQuad(
              Math.min(
                1,
                (progress - win.fillEnd) / Math.max(win.settleDur, 1e-6),
              ),
            );
            opacity = 1;
            y = BEAT_LIFT_PX * (1 - t);
            on = true;
          } else if (win.exitDur > 0) {
            const t = easeInQuad(
              Math.min(
                1,
                (progress - win.settleEnd) / Math.max(win.exitDur, 1e-6),
              ),
            );
            opacity = 1 - t;
            y = BEAT_SINK_PX * t;
            on = opacity > 0.02;
          } else {
            opacity = 1;
            y = 0;
            on = true;
          }

          beat.style.opacity = String(opacity);
          beat.style.visibility = on ? 'visible' : 'hidden';
          beat.style.transform = `translate3d(0, ${y}px, 0)`;
          beat.style.pointerEvents = on && opacity > 0.55 ? 'auto' : 'none';
          beat.style.zIndex = on ? '1' : '0';
        });
      };

      const applyWordReveal = (progress: number) => {
        const active = activeBeatIndex(progress);
        setActiveBeat(active);
        applyBeatMotion(progress);
        beatEls.forEach((beat, beatIndex) => {
          const words = beat.querySelectorAll<HTMLElement>(
            '[data-statement-word]',
          );
          const win = beatWindows(beatIndex, beatCount, beatSpan);
          if (beatIndex !== active) {
            words.forEach((word) => {
              if (word.getAttribute('data-revealed') !== 'false') {
                word.setAttribute('data-revealed', 'false');
              }
            });
            return;
          }
          const local =
            (progress - win.enterEnd) / Math.max(win.fillDur, 1e-6);
          const t = Math.max(0, Math.min(1, local));
          const count = revealedWordCount(t, words.length);
          words.forEach((word, wi) => {
            const next = wi < count ? 'true' : 'false';
            if (word.getAttribute('data-revealed') !== next) {
              word.setAttribute('data-revealed', next);
            }
          });
        });
      };

      const tickWordReveal = () => {
        const difference = wordRevealTarget - wordRevealCurrent;
        wordRevealCurrent += difference * STATEMENT_WORD_LERP;
        if (Math.abs(wordRevealTarget - wordRevealCurrent) > 0.001) {
          applyWordReveal(wordRevealCurrent);
          wordRevealRaf = requestAnimationFrame(tickWordReveal);
        } else {
          wordRevealCurrent = wordRevealTarget;
          applyWordReveal(wordRevealCurrent);
          wordRevealRaf = null;
        }
      };

      const queueWordReveal = (progress: number) => {
        wordRevealTarget = progress;
        if (wordRevealRaf == null) {
          wordRevealRaf = requestAnimationFrame(tickWordReveal);
        }
      };

      const buildStatementReveal = () => {
        if (!progressFillRef.current) return;
        const fillEl = progressFillRef.current;

        gsap.set(fillEl, { scaleX: 0, transformOrigin: 'left center' });

        beatEls.forEach((beat) => {
          beat
            .querySelectorAll<HTMLElement>('[data-statement-word]')
            .forEach((word) => word.setAttribute('data-revealed', 'false'));
        });
        applyWordReveal(0);

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
              applyLandingChromeInk('light');
              queueWordReveal(self.progress);
            },
            onLeave: () => {
              queueWordReveal(1);
            },
            onLeaveBack: () => {
              queueWordReveal(0);
              root.dataset.cinemaChapter = 'hero';
            },
          },
        });

        statementTl.fromTo(
          fillEl,
          { scaleX: 0 },
          { scaleX: 1, duration: 1, ease: 'none' },
          0,
        );
      };

      const buildScrollCinema = () => {
        lockFinalGeometry(closedClip);
        root.dataset.heroIntro = 'settled';
        document.body.style.overflow = '';

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
              setCinemaInset(1);
              applyLandingChromeInk('light');
              const coverH = viewportH();
              gsap.set(clipped, {
                height: coverH,
                minHeight: coverH,
                clipPath: openClip,
              });
            },
            onEnterBack: () => {
              lockFinalGeometry(openClip);
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

        refreshScrollTrigger({ safe: true });
        notifyCinemaReady();
      };

      const killAll = () => {
        if (wordRevealRaf != null) {
          cancelAnimationFrame(wordRevealRaf);
          wordRevealRaf = null;
        }
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

      heroIntroPlayed = true;
      syncLogoForExpand(0);
      buildScrollCinema();
      return killAll;
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
      data-hero-intro="settled"
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
                How it works
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
                  data-on={i === 0 ? 'true' : 'false'}
                  aria-hidden={i !== 0}
                >
                  <p className="cc-ed-hero-scene__statement-step">
                    <span className="cc-ed-hero-scene__statement-step-num">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="cc-ed-hero-scene__statement-step-label">
                      {beat.step}
                    </span>
                  </p>
                  <p
                    className="cc-ed-hero-scene__statement-body"
                    aria-label={beat.title}
                  >
                    <StatementWords
                      text={beat.lead}
                      beatId={beat.id}
                      tone="lead"
                    />
                  </p>
                  <p className="cc-ed-hero-scene__statement-dek">
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

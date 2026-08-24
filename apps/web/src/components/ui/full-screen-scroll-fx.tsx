'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react';
import {
  ensureGsapPlugins,
  gsap,
  ScrollTrigger,
} from '@/components/motion/gsap-runtime';
import './full-screen-scroll-fx.css';

export type FullScreenFXSection = {
  id?: string;
  background: string;
  leftLabel?: ReactNode;
  /** Compact label for the mobile equal-width chapter rail. */
  leftLabelShort?: string;
  /** Plain string titles still support word-mask animation. Prefer `content` for stories. */
  title?: string | ReactNode;
  /** Rich center story — skips word-mask; fades as a whole panel. */
  content?: ReactNode;
  rightLabel?: ReactNode;
  renderBackground?: (active: boolean, previous: boolean) => ReactNode;
};

type Colors = Partial<{
  text: string;
  overlay: string;
  pageBg: string;
  stageBg: string;
  accent: string;
}>;

type Durations = Partial<{
  change: number;
  snap: number;
}>;

export type FullScreenFXAPI = {
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  getIndex: () => number;
  refresh: () => void;
};

export type FullScreenFXProps = {
  sections: FullScreenFXSection[];
  className?: string;
  style?: CSSProperties;
  fontFamily?: string;
  header?: ReactNode;
  footer?: ReactNode;
  gap?: number;
  gridPaddingX?: number;
  showProgress?: boolean;
  showEnd?: boolean;
  debug?: boolean;
  durations?: Durations;
  reduceMotion?: boolean;
  bgTransition?: 'fade' | 'wipe';
  parallaxAmount?: number;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  initialIndex?: number;
  colors?: Colors;
  apiRef?: Ref<FullScreenFXAPI>;
  ariaLabel?: string;
};

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/** Sub-second scrub — scroll-linked, but snappy enough that the pager never lags a beat. */
const SCRUB_SMOOTH = 0.55;

/** Smoothstep for crossfades tied directly to scroll progress. */
function smoothCrossfade(t: number) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function scrollToY(y: number, durationMs: number) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement as HTMLElement & {
    lenis?: {
      scrollTo: (
        v: number,
        opts?: { duration?: number; easing?: (t: number) => number },
      ) => void;
    };
  };
  const lenis =
    root.lenis ??
    (window as unknown as {
      lenis?: {
        scrollTo: (
          v: number,
          opts?: { duration?: number; easing?: (t: number) => number },
        ) => void;
      };
    }).lenis;
  if (lenis?.scrollTo) {
    lenis.scrollTo(y, {
      duration: durationMs / 1000,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
    });
    return;
  }
  window.scrollTo({ top: y, behavior: 'smooth' });
}

function progressFromIndex(index: number, sectionCount: number) {
  if (sectionCount <= 1) return 0;
  return index / (sectionCount - 1);
}

export const FullScreenScrollFX = forwardRef<HTMLDivElement, FullScreenFXProps>(
  (
    {
      sections,
      className,
      style,
      fontFamily = 'var(--font-display), "Instrument Serif", Georgia, serif',
      header,
      footer,
      gap = 1,
      gridPaddingX = 2,
      showProgress = true,
      showEnd = false,
      debug = false,
      durations = { change: 0.7, snap: 800 },
      reduceMotion,
      bgTransition: _bgTransition = 'fade',
      parallaxAmount: _parallaxAmount = 4,
      currentIndex,
      onIndexChange,
      initialIndex = 0,
      colors = {
        text: 'rgba(245, 245, 245, 0.94)',
        overlay: 'rgba(32, 32, 36, 0.48)',
        pageBg: '#fcf1e7',
        stageBg: '#202020',
        accent: '#e95a0b',
      },
      apiRef,
      ariaLabel = 'Full screen scroll slideshow',
    },
    ref,
  ) => {
    const total = sections.length;
    const [localIndex, setLocalIndex] = useState(
      clamp(initialIndex, 0, Math.max(0, total - 1)),
    );
    const isControlled = typeof currentIndex === 'number';
    const index = isControlled
      ? clamp(currentIndex!, 0, Math.max(0, total - 1))
      : localIndex;

    const fixedRef = useRef<HTMLDivElement | null>(null);
    const fixedSectionRef = useRef<HTMLDivElement | null>(null);
    const bgRefs = useRef<(HTMLImageElement | null)[]>([]);
    const wordRefs = useRef<(HTMLSpanElement | null)[][]>([]);
    const featuredRefs = useRef<(HTMLDivElement | null)[]>([]);
    const leftTrackRef = useRef<HTMLDivElement | null>(null);
    const rightTrackRef = useRef<HTMLDivElement | null>(null);
    const leftItemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const rightItemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const progressFillRef = useRef<HTMLDivElement | null>(null);
    const currentNumberRef = useRef<HTMLSpanElement | null>(null);
    const stRef = useRef<ScrollTrigger | null>(null);
    const lastIndexRef = useRef(-1);
    const lastProgressRef = useRef(0);
    const isSnappingRef = useRef(false);
    const sectionTopRef = useRef<number[]>([]);
    const railMetricsRef = useRef<{ rowH: number; containerH: number } | null>(null);
    const applyScrollProgressRef = useRef<(progress: number) => void>(() => undefined);
    const goToRef = useRef<(to: number, withScroll?: boolean) => void>(
      () => undefined,
    );
    /** Scroll Y when the section trigger last activated — gates stale progress after hero pin. */
    const enterScrollYRef = useRef<number | null>(null);

    const prefersReduced = useMemo(() => {
      if (typeof window === 'undefined') return false;
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);
    const motionOff = reduceMotion ?? prefersReduced;
    const usesStoryContent = sections.some((s) => s.content != null);
    const showRightRail = sections.some((s) => s.rightLabel != null);

    const splitWords = (text: string, sectionIdx: number) => {
      const words = text.split(/\s+/).filter(Boolean);
      if (!wordRefs.current[sectionIdx]) wordRefs.current[sectionIdx] = [];
      return words.map((w, i) => (
        <span className="fx-word-mask" key={`${sectionIdx}-${i}-${w}`}>
          <span
            className="fx-word"
            ref={(el) => {
              if (!wordRefs.current[sectionIdx]) wordRefs.current[sectionIdx] = [];
              wordRefs.current[sectionIdx]![i] = el;
            }}
          >
            {w}
          </span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ));
    };

    const computePositions = () => {
      const el = fixedSectionRef.current;
      if (!el) return;
      const top = el.offsetTop;
      const h = el.offsetHeight;
      const arr: number[] = [];
      for (let i = 0; i < total; i += 1) {
        arr.push(top + (h * i) / Math.max(total, 1));
      }
      sectionTopRef.current = arr;
    };

    const measureRAF = (fn: () => void) => {
      if (typeof window === 'undefined') return;
      requestAnimationFrame(() => requestAnimationFrame(fn));
    };

    const isCompactRail = () =>
      typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;

    const measureRailMetrics = () => {
      if (isCompactRail()) {
        railMetricsRef.current = null;
        return;
      }

      const cont = leftTrackRef.current?.parentElement;
      const first = leftItemRefs.current[0];
      const second = leftItemRefs.current[1];
      if (!cont || !first) return;

      const contRect = cont.getBoundingClientRect();
      let rowH = first.getBoundingClientRect().height;
      if (second) {
        rowH = second.getBoundingClientRect().top - first.getBoundingClientRect().top;
      }
      railMetricsRef.current = { rowH, containerH: contRect.height };
    };

    const centerRailTrack = (
      track: HTMLDivElement | null,
      pos: number,
    ) => {
      if (!track || isCompactRail()) return;
      const metrics = railMetricsRef.current;
      if (!metrics) return;
      const targetY =
        metrics.containerH / 2 - metrics.rowH / 2 - pos * metrics.rowH;
      gsap.set(track, { y: targetY });
    };

    const applyScrollProgress = (progress: number) => {
      // Never gate/zero progress here — that desynced the pager from visible slides
      // and left story panels at autoAlpha 0 (blank Crash Course).
      const p = clamp(progress, 0, 1);
      lastProgressRef.current = p;
      const max = Math.max(total - 1, 1);
      const pos = clamp(p * max, 0, max);
      const from = Math.floor(pos);
      const to = Math.min(from + 1, total - 1);
      const rawBlend = from === to ? 0 : pos - from;
      const blend = from === to ? 0 : smoothCrossfade(rawBlend);
      const idx = from === to ? from : rawBlend >= 0.5 ? to : from;

      if (progressFillRef.current) {
        progressFillRef.current.style.width = `${(idx / max) * 100}%`;
      }

      bgRefs.current.forEach((bg, i) => {
        if (!bg) return;
        let opacity = 0;
        if (from === to) {
          opacity = i === from ? 1 : 0;
        } else if (i === from) {
          opacity = 1 - blend;
        } else if (i === to) {
          opacity = blend;
        }
        gsap.set(bg, { opacity, scale: 1, yPercent: 0 });
      });

      // Story copy is exclusive — never crossfade two surfaces (stacked ghost text).
      // Backgrounds still blend above; text swaps at the midpoint with a short slide.
      let maxPanelOpacity = 0;
      featuredRefs.current.forEach((panel, i) => {
        if (!panel) return;
        const isStory = sections[i]?.content != null;
        let opacity = 0;
        let y = 0;
        if (from === to) {
          opacity = i === from ? 1 : 0;
        } else if (isStory) {
          // One surface only — backgrounds may blend; copy must not stack.
          opacity = i === idx ? 1 : 0;
          y = i === idx ? 0 : i === from ? -14 : 16;
        } else if (i === from) {
          opacity = 1 - blend;
          y = -blend * 10;
        } else if (i === to) {
          opacity = blend;
          y = (1 - blend) * 12;
        }
        maxPanelOpacity = Math.max(maxPanelOpacity, opacity);
        const show = i === idx;
        panel.classList.toggle('active', show);
        panel.style.pointerEvents = show ? 'auto' : 'none';
        gsap.set(panel, {
          opacity,
          visibility: show ? 'visible' : 'hidden',
          y: show ? 0 : y,
          zIndex: show ? 2 : 1,
        });
      });

      // Safety: never leave the stage empty (blank charcoal + progress only).
      if (maxPanelOpacity < 0.05 && featuredRefs.current[idx]) {
        const panel = featuredRefs.current[idx]!;
        panel.classList.add('active');
        gsap.set(panel, {
          opacity: 1,
          visibility: 'visible',
          y: 0,
          zIndex: 2,
        });
      }

      wordRefs.current.forEach((words, sIdx) => {
        if (sections[sIdx]?.content != null) return;
        words.filter(Boolean).forEach((word) => {
          let opacity = 0;
          if (from === to) {
            opacity = sIdx === from ? 1 : 0;
          } else if (sIdx === from) {
            opacity = 1 - blend;
          } else if (sIdx === to) {
            opacity = blend;
          }
          gsap.set(word, {
            opacity,
            yPercent: sIdx === to ? (1 - blend) * 18 : blend * -18,
          });
        });
      });

      if (idx !== lastIndexRef.current) {
        lastIndexRef.current = idx;
        if (!isControlled) setLocalIndex(idx);
        onIndexChange?.(idx);
        if (currentNumberRef.current) {
          currentNumberRef.current.textContent = String(idx + 1).padStart(2, '0');
        }
      }

      const compact = isCompactRail();
      leftItemRefs.current.forEach((el, i) => {
        if (!el) return;
        const active = i === idx;
        el.classList.toggle('active', active);
        if (compact) {
          gsap.set(el, { clearProps: 'transform,x,y', opacity: active ? 1 : 0.55 });
          return;
        }
        gsap.set(el, { opacity: active ? 1 : 0.35, x: active ? 10 : 0 });
      });
      rightItemRefs.current.forEach((el, i) => {
        if (!el) return;
        const active = i === idx;
        el.classList.toggle('active', active);
        if (compact) {
          gsap.set(el, { clearProps: 'transform,x,y', opacity: active ? 1 : 0.55 });
          return;
        }
        gsap.set(el, { opacity: active ? 1 : 0.35, x: active ? -10 : 0 });
      });

      centerRailTrack(leftTrackRef.current, idx);
      centerRailTrack(rightTrackRef.current, idx);
    };
    applyScrollProgressRef.current = applyScrollProgress;

    const goTo = (to: number, withScroll = true) => {
      const clamped = clamp(to, 0, total - 1);
      isSnappingRef.current = true;
      applyScrollProgress(progressFromIndex(clamped, total));

      const pos = sectionTopRef.current[clamped];
      const snapMs = durations.snap ?? 800;

      if (withScroll && typeof window !== 'undefined' && typeof pos === 'number') {
        scrollToY(pos, snapMs);
        window.setTimeout(() => {
          isSnappingRef.current = false;
        }, snapMs);
      } else {
        isSnappingRef.current = false;
      }
    };
    goToRef.current = goTo;

    useLayoutEffect(() => {
      if (typeof window === 'undefined' || total === 0) return;
      ensureGsapPlugins();

      const fixed = fixedRef.current;
      const fs = fixedSectionRef.current;
      if (!fixed || !fs) return;

      gsap.set(bgRefs.current.filter(Boolean), {
        opacity: 0,
        scale: 1.04,
        yPercent: 0,
      });
      if (bgRefs.current[0]) gsap.set(bgRefs.current[0], { opacity: 1, scale: 1 });

      if (!motionOff) {
        featuredRefs.current.forEach((panel, sIdx) => {
          if (!panel) return;
          const on = sIdx === index;
          panel.classList.toggle('active', on);
          gsap.set(panel, {
            opacity: on ? 1 : 0,
            visibility: on ? 'visible' : 'hidden',
            y: on ? 0 : 16,
          });
        });
        wordRefs.current.forEach((words, sIdx) => {
          if (sections[sIdx]?.content != null) return;
          words.filter(Boolean).forEach((w) => {
            gsap.set(w, {
              yPercent: sIdx === index ? 0 : 100,
              opacity: sIdx === index ? 1 : 0,
            });
          });
        });
      }

      computePositions();
      measureRAF(() => {
        measureRailMetrics();
        applyScrollProgressRef.current(0);
      });

      if (motionOff) {
        return () => undefined;
      }

      // Sticky `.fx-fixed` holds the stage; scrub section scroll only — no GSAP pin
      // (pin + fast-scroll-end teleported users into mid-chapter after prior sections).
      const st = ScrollTrigger.create({
        trigger: fs,
        start: 'top top',
        end: () => {
          const stage = fixedRef.current;
          const scrollable = fs.offsetHeight - (stage?.offsetHeight ?? 0);
          return scrollable > 0 ? `+=${scrollable}` : 'bottom bottom';
        },
        scrub: SCRUB_SMOOTH,
        invalidateOnRefresh: true,
        onEnter: () => {
          enterScrollYRef.current =
            typeof window !== 'undefined' ? window.scrollY : null;
          applyScrollProgressRef.current(0);
        },
        onEnterBack: () => {
          applyScrollProgressRef.current(clamp(st.progress, 0, 1));
        },
        onLeaveBack: () => {
          enterScrollYRef.current = null;
          applyScrollProgressRef.current(0);
        },
        onRefresh: (self) => {
          computePositions();
          measureRailMetrics();
          // Always sync — inactive must show slide 01 so entry is never blank.
          applyScrollProgressRef.current(
            self.isActive ? clamp(self.progress, 0, 1) : 0,
          );
        },
        onUpdate: (self) => {
          if (isSnappingRef.current) return;
          applyScrollProgressRef.current(clamp(self.progress, 0, 1));
        },
      });
      stRef.current = st;

      // First paint insurance — slide 01 visible before any scrub tick.
      applyScrollProgressRef.current(st.isActive ? clamp(st.progress, 0, 1) : 0);

      if (initialIndex > 0 && initialIndex < total) {
        requestAnimationFrame(() => goToRef.current(initialIndex, false));
      }

      let resizeTimer: ReturnType<typeof setTimeout> | undefined;
      const ro = new ResizeObserver(() => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          computePositions();
          measureRailMetrics();
          if (stRef.current?.isActive) {
            applyScrollProgressRef.current(lastProgressRef.current);
          }
          // Local refresh only — global ScrollTrigger.refresh remaps the hero pin
          // and teleports this section mid-chapter.
          stRef.current?.refresh();
        }, 120);
      });
      ro.observe(fs);

      const onHeroCinemaReady = () => {
        computePositions();
        measureRailMetrics();
        stRef.current?.refresh();
        if (stRef.current?.isActive) {
          applyScrollProgressRef.current(clamp(stRef.current.progress, 0, 1));
        } else {
          applyScrollProgressRef.current(0);
        }
      };
      window.addEventListener('codecard:hero-cinema-ready', onHeroCinemaReady);

      return () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        ro.disconnect();
        window.removeEventListener(
          'codecard:hero-cinema-ready',
          onHeroCinemaReady,
        );
        st.kill();
        stRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/setup for section count + motion mode
    }, [total, initialIndex, motionOff]);

    useImperativeHandle(apiRef, () => ({
      next: () => goTo(index + 1),
      prev: () => goTo(index - 1),
      goTo,
      getIndex: () => index,
      refresh: () => {
        computePositions();
        stRef.current?.refresh();
      },
    }));

    useEffect(() => {
      if (motionOff) return;
      leftItemRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.set(el, {
          opacity: i === index ? 1 : 0.35,
          y: 0,
        });
      });
      rightItemRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.set(el, {
          opacity: i === index ? 1 : 0.35,
          y: 0,
        });
      });
      measureRailMetrics();
      // Do NOT force progress 0 here — ScrollTrigger may already be active after
      // scroll restore / hero pin refresh (forcing 0 blanked then jumped).
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cssVars: CSSProperties = {
      ['--fx-font' as string]: fontFamily,
      ['--fx-text' as string]: colors.text ?? 'rgba(245,245,245,0.94)',
      ['--fx-overlay' as string]: colors.overlay ?? 'rgba(32,32,36,0.48)',
      ['--fx-page-bg' as string]: colors.pageBg ?? '#fcf1e7',
      ['--fx-stage-bg' as string]: colors.stageBg ?? '#202020',
      ['--fx-accent' as string]: colors.accent ?? '#e95a0b',
      ['--fx-gap' as string]: `${gap}rem`,
      ['--fx-grid-px' as string]: `${gridPaddingX}rem`,
      ['--fx-row-gap' as string]: '10px',
      ['--fx-section-count' as string]: String(Math.max(1, total)),
    };

    return (
      <div
        ref={ref}
        className={[
          'fx',
          motionOff ? 'fx--reduced' : '',
          usesStoryContent ? 'fx--story' : '',
          showRightRail ? '' : 'fx--no-right',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ ...cssVars, ...style }}
        aria-label={ariaLabel}
        data-testid="full-screen-scroll-fx"
      >
        {debug ? <div className="fx-debug">Section: {index}</div> : null}

        <div className="fx-scroll">
          <div
            className="fx-fixed-section"
            ref={fixedSectionRef}
            style={{
              height: motionOff
                ? 'auto'
                : `calc(var(--fx-section-count) * var(--fx-section-length, 100vh))`,
            }}
          >
            <div className="fx-fixed" ref={fixedRef}>
              <div className="fx-bgs" aria-hidden>
                {sections.map((s, i) => (
                  <div className="fx-bg" key={s.id ?? i}>
                    {s.renderBackground ? (
                      s.renderBackground(index === i, lastIndexRef.current === i)
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          ref={(el) => {
                            bgRefs.current[i] = el;
                          }}
                          src={s.background}
                          alt=""
                          className="fx-bg-img"
                          draggable={false}
                        />
                        <div className="fx-bg-overlay" />
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="fx-grid">
                {header ? <div className="fx-header">{header}</div> : null}

                <div className="fx-content">
                  <div className="fx-left" role="list">
                    <div className="fx-track" ref={leftTrackRef}>
                      {sections.map((s, i) => (
                        <div
                          key={`L-${s.id ?? i}`}
                          className={`fx-item fx-left-item${i === index ? ' active' : ''}`}
                          ref={(el) => {
                            leftItemRefs.current[i] = el;
                          }}
                          onClick={() => goTo(i)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              goTo(i);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-pressed={i === index}
                        >
                          <span className="fx-item__full">{s.leftLabel}</span>
                          <span className="fx-item__short">
                            {s.leftLabelShort ?? s.leftLabel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="fx-center">
                    {sections.map((s, sIdx) => {
                      const isString = typeof s.title === 'string';
                      const hasContent = s.content != null;
                      return (
                        <div
                          key={`C-${s.id ?? sIdx}`}
                          className={`fx-featured${sIdx === index ? ' active' : ''}${hasContent ? ' fx-featured--story' : ''}`}
                          ref={(el) => {
                            featuredRefs.current[sIdx] = el;
                          }}
                        >
                          {hasContent ? (
                            <div className="fx-story">{s.content}</div>
                          ) : (
                            <h3 className="fx-featured-title">
                              {isString
                                ? splitWords(String(s.title), sIdx)
                                : s.title}
                            </h3>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {showRightRail ? (
                    <div className="fx-right" role="list">
                      <div className="fx-track" ref={rightTrackRef}>
                        {sections.map((s, i) => (
                          <div
                            key={`R-${s.id ?? i}`}
                            className={`fx-item fx-right-item${i === index ? ' active' : ''}`}
                            ref={(el) => {
                              rightItemRefs.current[i] = el;
                            }}
                            onClick={() => goTo(i)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                goTo(i);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-pressed={i === index}
                          >
                            {s.rightLabel}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="fx-footer">
                  {footer ? <div className="fx-footer-title">{footer}</div> : null}
                  {showProgress ? (
                    <div className="fx-progress">
                      <div className="fx-progress-numbers">
                        <span ref={currentNumberRef}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span>{String(total).padStart(2, '0')}</span>
                      </div>
                      <div className="fx-progress-bar">
                        <div className="fx-progress-fill" ref={progressFillRef} />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {showEnd ? (
            <div className="fx-end">
              <p className="fx-fin">fin</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);

FullScreenScrollFX.displayName = 'FullScreenScrollFX';

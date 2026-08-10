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

function scrollToY(y: number, durationMs: number) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement as HTMLElement & {
    lenis?: { scrollTo: (v: number, opts?: { duration?: number }) => void };
  };
  const lenis =
    root.lenis ??
    (window as unknown as {
      lenis?: { scrollTo: (v: number, opts?: { duration?: number }) => void };
    }).lenis;
  if (lenis?.scrollTo) {
    lenis.scrollTo(y, { duration: durationMs / 1000 });
    return;
  }
  window.scrollTo({ top: y, behavior: 'smooth' });
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
      bgTransition = 'fade',
      parallaxAmount = 4,
      currentIndex,
      onIndexChange,
      initialIndex = 0,
      colors = {
        text: 'rgba(245, 245, 245, 0.94)',
        overlay: 'rgba(32, 32, 36, 0.48)',
        pageBg: '#fcf1e7',
        stageBg: '#202020',
        accent: '#c094e4',
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
    const lastIndexRef = useRef(index);
    const isAnimatingRef = useRef(false);
    const isSnappingRef = useRef(false);
    const sectionTopRef = useRef<number[]>([]);
    const goToRef = useRef<(to: number, withScroll?: boolean) => void>(
      () => undefined,
    );

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

    const measureAndCenterLists = (toIndex = index, animate = true) => {
      // Mobile uses a fixed equal-width rail — never vertical-center or GSAP-shift it.
      if (isCompactRail()) {
        leftItemRefs.current.forEach((el, i) => {
          if (!el) return;
          gsap.set(el, { clearProps: 'transform,x,y' });
          el.classList.toggle('active', i === toIndex);
        });
        return;
      }

      const centerTrack = (
        track: HTMLDivElement | null,
        items: (HTMLDivElement | null)[],
      ) => {
        if (!track || items.length === 0 || !items[0]) return;
        const first = items[0];
        const second = items[1];
        const cont = track.parentElement;
        if (!cont) return;
        const contRect = cont.getBoundingClientRect();
        let rowH = first.getBoundingClientRect().height;
        if (second) {
          rowH = second.getBoundingClientRect().top - first.getBoundingClientRect().top;
        }
        const targetY = contRect.height / 2 - rowH / 2 - toIndex * rowH;
        const D = (durations.change ?? 0.7) * 0.9;
        if (animate && !motionOff) {
          gsap.to(track, { y: targetY, duration: D, ease: 'power3.out' });
        } else {
          gsap.set(track, { y: targetY });
        }
      };

      measureRAF(() => {
        measureRAF(() => {
          centerTrack(leftTrackRef.current, leftItemRefs.current);
          centerTrack(rightTrackRef.current, rightItemRefs.current);
        });
      });
    };

    const changeSection = (to: number) => {
      if (to === lastIndexRef.current || isAnimatingRef.current) return;
      const from = lastIndexRef.current;
      const down = to > from;
      isAnimatingRef.current = true;

      if (!isControlled) setLocalIndex(to);
      onIndexChange?.(to);

      if (currentNumberRef.current) {
        currentNumberRef.current.textContent = String(to + 1).padStart(2, '0');
      }
      if (progressFillRef.current) {
        const p = (to / (total - 1 || 1)) * 100;
        progressFillRef.current.style.width = `${p}%`;
      }

      const D = motionOff ? 0.01 : (durations.change ?? 0.7);

      // Rich story panels: fade the whole block. String titles: word masks.
      const fromHasContent = sections[from]?.content != null;
      const toHasContent = sections[to]?.content != null;
      if (fromHasContent || toHasContent) {
        const outPanel = featuredRefs.current[from];
        const inPanel = featuredRefs.current[to];
        if (outPanel) {
          gsap.to(outPanel, {
            opacity: 0,
            y: down ? -18 : 18,
            duration: D * 0.55,
            ease: 'power3.out',
          });
        }
        if (inPanel) {
          gsap.set(inPanel, { opacity: 0, y: down ? 22 : -22 });
          gsap.to(inPanel, {
            opacity: 1,
            y: 0,
            duration: D,
            ease: 'power3.out',
          });
        }
      } else {
        const outWords = (wordRefs.current[from] || []).filter(Boolean);
        const inWords = (wordRefs.current[to] || []).filter(Boolean);
        if (outWords.length) {
          gsap.to(outWords, {
            yPercent: down ? -100 : 100,
            opacity: 0,
            duration: D * 0.6,
            stagger: down ? 0.03 : -0.03,
            ease: 'power3.out',
          });
        }
        if (inWords.length) {
          gsap.set(inWords, { yPercent: down ? 100 : -100, opacity: 0 });
          gsap.to(inWords, {
            yPercent: 0,
            opacity: 1,
            duration: D,
            stagger: down ? 0.05 : -0.05,
            ease: 'power3.out',
          });
        }
      }

      const prevBg = bgRefs.current[from];
      const newBg = bgRefs.current[to];
      if (bgTransition === 'fade') {
        if (newBg) {
          gsap.set(newBg, {
            opacity: 0,
            scale: 1.04,
            yPercent: down ? 1 : -1,
          });
          gsap.to(newBg, {
            opacity: 1,
            scale: 1,
            yPercent: 0,
            duration: D,
            ease: 'power2.out',
          });
        }
        if (prevBg) {
          gsap.to(prevBg, {
            opacity: 0,
            yPercent: down ? -parallaxAmount : parallaxAmount,
            duration: D,
            ease: 'power2.out',
          });
        }
      } else {
        if (newBg) {
          gsap.set(newBg, {
            opacity: 1,
            clipPath: down ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)',
            scale: 1,
            yPercent: 0,
          });
          gsap.to(newBg, {
            clipPath: 'inset(0 0 0 0)',
            duration: D,
            ease: 'power3.out',
          });
        }
        if (prevBg) {
          gsap.to(prevBg, {
            opacity: 0,
            duration: D * 0.8,
            ease: 'power2.out',
          });
        }
      }

      measureAndCenterLists(to, !motionOff);

      const compact = isCompactRail();
      leftItemRefs.current.forEach((el, i) => {
        if (!el) return;
        el.classList.toggle('active', i === to);
        if (compact) {
          gsap.set(el, { clearProps: 'transform,x,y', opacity: i === to ? 1 : 0.55 });
          return;
        }
        gsap.to(el, {
          opacity: i === to ? 1 : 0.35,
          x: i === to ? 10 : 0,
          duration: D * 0.6,
          ease: 'power3.out',
        });
      });
      rightItemRefs.current.forEach((el, i) => {
        if (!el) return;
        el.classList.toggle('active', i === to);
        if (compact) {
          gsap.set(el, { clearProps: 'transform,x,y', opacity: i === to ? 1 : 0.55 });
          return;
        }
        gsap.to(el, {
          opacity: i === to ? 1 : 0.35,
          x: i === to ? -10 : 0,
          duration: D * 0.6,
          ease: 'power3.out',
        });
      });

      gsap.delayedCall(D, () => {
        lastIndexRef.current = to;
        isAnimatingRef.current = false;
      });
    };

    const goTo = (to: number, withScroll = true) => {
      const clamped = clamp(to, 0, total - 1);
      isSnappingRef.current = true;
      changeSection(clamped);

      const pos = sectionTopRef.current[clamped];
      const snapMs = durations.snap ?? 800;

      if (withScroll && typeof window !== 'undefined' && typeof pos === 'number') {
        scrollToY(pos, snapMs);
        window.setTimeout(() => {
          isSnappingRef.current = false;
        }, snapMs);
      } else {
        // Hold the gate long enough that touch momentum cannot skip chapters.
        const gateMs = motionOff
          ? 40
          : Math.max(420, Math.round((durations.change ?? 0.7) * 520));
        window.setTimeout(() => {
          isSnappingRef.current = false;
        }, gateMs);
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
          if (sections[sIdx]?.content != null) {
            gsap.set(panel, {
              opacity: sIdx === index ? 1 : 0,
              y: sIdx === index ? 0 : 16,
            });
          }
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
      measureAndCenterLists(index, false);

      if (motionOff) {
        return () => undefined;
      }

      const st = ScrollTrigger.create({
        trigger: fs,
        start: 'top top',
        end: 'bottom bottom',
        pin: fixed,
        pinSpacing: true,
        onUpdate: (self) => {
          if (isSnappingRef.current) return;
          const target = Math.min(
            total - 1,
            Math.floor(self.progress * total + 1e-6),
          );
          if (target !== lastIndexRef.current && !isAnimatingRef.current) {
            const next =
              lastIndexRef.current +
              (target > lastIndexRef.current ? 1 : -1);
            goToRef.current(next, false);
          }
          if (progressFillRef.current) {
            const p = (lastIndexRef.current / (total - 1 || 1)) * 100;
            progressFillRef.current.style.width = `${p}%`;
          }
        },
      });
      stRef.current = st;

      if (initialIndex > 0 && initialIndex < total) {
        requestAnimationFrame(() => goToRef.current(initialIndex, false));
      }

      const ro = new ResizeObserver(() => {
        computePositions();
        measureAndCenterLists(lastIndexRef.current, false);
        ScrollTrigger.refresh();
      });
      ro.observe(fs);

      return () => {
        ro.disconnect();
        st.kill();
        stRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/setup for section count + motion mode
    }, [total, initialIndex, motionOff, bgTransition, parallaxAmount]);

    useImperativeHandle(apiRef, () => ({
      next: () => goTo(index + 1),
      prev: () => goTo(index - 1),
      goTo,
      getIndex: () => index,
      refresh: () => ScrollTrigger.refresh(),
    }));

    useEffect(() => {
      if (motionOff) return;
      leftItemRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { opacity: 0, y: 20 },
          {
            opacity: i === index ? 1 : 0.35,
            y: 0,
            duration: 0.5,
            delay: i * 0.06,
            ease: 'power3.out',
          },
        );
      });
      rightItemRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { opacity: 0, y: 20 },
          {
            opacity: i === index ? 1 : 0.35,
            y: 0,
            duration: 0.5,
            delay: 0.2 + i * 0.06,
            ease: 'power3.out',
          },
        );
      });
      measureAndCenterLists(index, false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cssVars: CSSProperties = {
      ['--fx-font' as string]: fontFamily,
      ['--fx-text' as string]: colors.text ?? 'rgba(245,245,245,0.94)',
      ['--fx-overlay' as string]: colors.overlay ?? 'rgba(32,32,36,0.48)',
      ['--fx-page-bg' as string]: colors.pageBg ?? '#fcf1e7',
      ['--fx-stage-bg' as string]: colors.stageBg ?? '#202020',
      ['--fx-accent' as string]: colors.accent ?? '#c094e4',
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

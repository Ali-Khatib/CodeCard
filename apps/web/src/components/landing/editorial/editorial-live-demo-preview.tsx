'use client';

import {
  OPEN_LIVE_PEEK_EVENT,
  EditorialLivePeekButton,
} from '@/components/landing/editorial/editorial-live-peek-button';
import { Monitor, Smartphone } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { MOTION_DURATION } from '@/components/motion/motion-tokens';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useSmoothScroll } from '@/components/motion/smooth-scroll-provider';

type PreviewMode = 'web' | 'mobile';

type PeekZoom = { scale: number; y: number };

function readPeekZoom(): PeekZoom {
  if (typeof window === 'undefined') return { scale: 1.2, y: -12 };
  if (window.matchMedia('(max-width: 767px)').matches) {
    return { scale: 1.06, y: -4 };
  }
  if (window.matchMedia('(max-width: 1024px)').matches) {
    return { scale: 1.12, y: -8 };
  }
  return { scale: 1.22, y: -12 };
}

function usePeekZoom(active: boolean, reduceMotion: boolean): PeekZoom {
  const [zoom, setZoom] = useState<PeekZoom>({ scale: 1.2, y: -12 });

  useEffect(() => {
    const update = () => setZoom(readPeekZoom());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  if (reduceMotion || !active) return { scale: 1, y: 0 };
  return zoom;
}

const MIN_VISIBLE_MS = 18_000;
const DWELL_MS = 28_000;
const HOVER_MS = 14_000;
const PREVIEW_SCROLL_THRESHOLD = 320;

/** Simulated layout viewport — independent of the preview card's CSS size. */
const DESKTOP_VIEW = { width: 1440, height: 900 };
const MOBILE_VIEW = { width: 390, height: 844 };

type PreviewLayout = {
  scale: number;
  width: number;
  height: number;
  inner: { width: number; height: number };
};

function layoutForMode(
  mode: PreviewMode,
  previewWidth: number,
  previewHeight: number,
): PreviewLayout {
  const inner = mode === 'web' ? DESKTOP_VIEW : MOBILE_VIEW;
  const padX = mode === 'mobile' ? 28 : 8;
  const padY = mode === 'mobile' ? 32 : 8;
  const availW = Math.max(1, previewWidth - padX);
  const availH = Math.max(1, previewHeight - padY);
  const scale = Math.min(availW / inner.width, availH / inner.height, 1);
  return {
    scale,
    width: inner.width * scale,
    height: inner.height * scale,
    inner,
  };
}

type ModeToggleProps = {
  mode: PreviewMode;
  target: PreviewMode;
  icon: typeof Monitor;
  label: string;
  hint: string;
  onSelect: (mode: PreviewMode) => void;
};

function ModeToggle({ mode, target, icon: Icon, label, hint, onSelect }: ModeToggleProps) {
  const active = mode === target;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={label}
      title={hint}
      className={
        active
          ? 'cc-ed-demo-preview__toggle cc-ed-demo-preview__toggle--active'
          : 'cc-ed-demo-preview__toggle'
      }
      onClick={() => onSelect(target)}
    >
      <Icon className="cc-ed-demo-preview__toggle-icon" aria-hidden strokeWidth={1.85} />
      <span className="cc-ed-demo-preview__toggle-label">{label}</span>
    </button>
  );
}

/**
 * Compact scaled live demo preview with web/mobile toggle. Invitation appears only
 * after sustained engagement and never covers the embedded interface.
 */
export function EditorialLiveDemoPreview() {
  const reduced = useReducedMotion();
  const { release } = useSmoothScroll();
  const sectionRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const hoverStartRef = useRef<number | null>(null);
  const visibleSinceRef = useRef<number | null>(null);
  const scrollAccRef = useRef(0);
  const [mode, setMode] = useState<PreviewMode>('web');
  const [layout, setLayout] = useState<PreviewLayout>(() =>
    layoutForMode('web', 680, 520),
  );
  const [invited, setInvited] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const zoom = usePeekZoom(peeking, reduced);
  const peekTransition = reduced
    ? { duration: 0 }
    : { duration: MOTION_DURATION.section, ease: [0.22, 1, 0.36, 1] as const };

  const markEngaged = useCallback(() => {
    setInvited(true);
  }, []);

  const openPeek = useCallback(() => {
    setPeeking(true);
    release();
  }, [release]);

  useEffect(() => {
    const onPeek = () => openPeek();
    window.addEventListener(OPEN_LIVE_PEEK_EVENT, onPeek);
    return () => window.removeEventListener(OPEN_LIVE_PEEK_EVENT, onPeek);
  }, [openPeek]);

  useEffect(() => {
    release();
  }, [mode, release]);

  useEffect(() => {
    const stage = frameRef.current;
    if (!stage) return;

    const onWheel = (event: WheelEvent) => {
      const iframe = stage.querySelector('iframe');
      if (!iframe) return;
      const rect = iframe.getBoundingClientRect();
      const overEmbed =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!overEmbed) return;
      event.preventDefault();
      window.scrollBy(0, event.deltaY);
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const sync = () => {
      const width = viewport.clientWidth || 680;
      const height = viewport.clientHeight || 520;
      setLayout(layoutForMode(mode, width, height));
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [mode]);

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          visibleSinceRef.current = performance.now();
          return;
        }
        visibleSinceRef.current = null;
        hoverStartRef.current = null;
        scrollAccRef.current = 0;
      },
      { threshold: 0.55 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (reduced || invited) return;

    const tick = window.setInterval(() => {
      const visibleSince = visibleSinceRef.current;
      if (visibleSince == null) return;

      const now = performance.now();
      const visibleFor = now - visibleSince;
      if (visibleFor < MIN_VISIBLE_MS) return;

      const hoveredFor =
        hoverStartRef.current != null ? now - hoverStartRef.current : 0;

      if (
        visibleFor >= DWELL_MS ||
        hoveredFor >= HOVER_MS ||
        scrollAccRef.current >= PREVIEW_SCROLL_THRESHOLD
      ) {
        markEngaged();
      }
    }, 500);

    return () => window.clearInterval(tick);
  }, [invited, markEngaged, reduced]);

  useEffect(() => {
    if (reduced || invited) return;
    const frame = frameRef.current;
    if (!frame) return;

    const onWheel = (event: WheelEvent) => {
      if (visibleSinceRef.current == null) return;
      scrollAccRef.current += Math.abs(event.deltaY);
      if (
        performance.now() - visibleSinceRef.current >= MIN_VISIBLE_MS &&
        scrollAccRef.current >= PREVIEW_SCROLL_THRESHOLD
      ) {
        markEngaged();
      }
    };

    frame.addEventListener('wheel', onWheel, { passive: true });
    return () => frame.removeEventListener('wheel', onWheel);
  }, [invited, markEngaged, reduced]);

  const showInvitation = invited && !dismissed;
  const embedSrc = '/demo?embed=1';
  const embedTitle =
    mode === 'web'
      ? 'CodeCard live demo desktop workspace preview'
      : 'CodeCard live demo mobile workspace preview';
  const view = layout.inner;

  return (
    <div
      ref={sectionRef}
      className={
        showInvitation
          ? 'cc-ed-demo-preview cc-ed-demo-preview--invited'
          : 'cc-ed-demo-preview'
      }
      data-testid="editorial-live-demo-preview"
      data-peek-zoomed={peeking && !reduced ? 'true' : 'false'}
    >
      <motion.div
        className="cc-ed-demo-preview__zoom"
        animate={{ scale: zoom.scale, y: zoom.y }}
        transition={peekTransition}
      >
      <div className="cc-ed-demo-preview__chrome">
        <div
          className="cc-ed-demo-preview__toolbar"
          role="tablist"
          aria-label="Demo preview mode"
        >
          <ModeToggle
            mode={mode}
            target="web"
            icon={Monitor}
            label="Desktop"
            hint="Desktop workspace"
            onSelect={setMode}
          />
          <ModeToggle
            mode={mode}
            target="mobile"
            icon={Smartphone}
            label="Mobile"
            hint="Mobile workspace"
            onSelect={setMode}
          />
        </div>

        <div
          ref={frameRef}
          className={
            peeking
              ? 'cc-ed-demo-preview__stage cc-ed-demo-preview__stage--peeking'
              : 'cc-ed-demo-preview__stage'
          }
          onPointerEnter={() => {
            hoverStartRef.current = performance.now();
          }}
          onPointerLeave={() => {
            hoverStartRef.current = null;
          }}
          onFocus={() => {
            hoverStartRef.current = performance.now();
          }}
          onBlur={() => {
            hoverStartRef.current = null;
          }}
        >
          <div ref={viewportRef} className="cc-ed-demo-preview__viewport">
            <div
              className={
                mode === 'mobile'
                  ? 'cc-ed-demo-preview__device cc-ed-demo-preview__device--phone'
                  : 'cc-ed-demo-preview__device cc-ed-demo-preview__device--web'
              }
              data-preview-mode={mode}
              style={{ width: `${layout.width}px`, height: `${layout.height}px` }}
            >
              <div
                className="cc-ed-demo-preview__device-shell"
                style={{
                  width: `${layout.width}px`,
                  height: `${layout.height}px`,
                }}
              >
                <div
                  className="cc-ed-demo-preview__scale"
                  style={{
                    width: `${view.width}px`,
                    height: `${view.height}px`,
                    transform: `scale(${layout.scale})`,
                  }}
                >
                <iframe
                  key={mode}
                  src={embedSrc}
                  title={embedTitle}
                  className={
                    mode === 'mobile'
                      ? 'cc-ed-demo-preview__embed cc-ed-demo-preview__embed--mobile'
                      : 'cc-ed-demo-preview__embed'
                  }
                  width={view.width}
                  height={view.height}
                  loading="lazy"
                  allow="clipboard-write"
                  tabIndex={peeking ? 0 : -1}
                />
              </div>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {peeking ? null : (
              <motion.div
                key="peek-layer"
                className="cc-ed-demo-preview__peek-layer"
                initial={false}
                exit={reduced ? undefined : { opacity: 0, scale: 0.94 }}
                transition={peekTransition}
              >
                <EditorialLivePeekButton
                  scrollToDemo={false}
                  onActivate={openPeek}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {showInvitation ? (
          <div
            className="cc-ed-demo-preview__invitation-bar"
            data-testid="editorial-live-demo-invitation"
          >
            <p className="cc-ed-demo-preview__invitation-title">
              OPEN THE FULL WORKSPACE
            </p>
            <div className="cc-ed-demo-preview__invitation-actions">
              <button
                type="button"
                className="cc-ed-demo-preview__invitation-dismiss"
                onClick={() => setDismissed(true)}
              >
                Stay in the preview
              </button>
              <LiveDemoLink className="cc-ed-demo-preview__invitation-cta cc-instant-press">
                View live demo
              </LiveDemoLink>
            </div>
          </div>
        ) : null}
      </div>
      </motion.div>
    </div>
  );
}

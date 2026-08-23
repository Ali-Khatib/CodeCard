'use client';

import { Monitor, Smartphone } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type PreviewMode = 'web' | 'mobile';

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

  const markEngaged = useCallback(() => {
    setInvited(true);
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
          className="cc-ed-demo-preview__stage"
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
                />
              </div>
              </div>
            </div>
          </div>
        </div>

        {showInvitation ? (
          <div
            className="cc-ed-demo-preview__invitation-bar"
            data-testid="editorial-live-demo-invitation"
          >
            <p className="cc-ed-demo-preview__invitation-title">
              EXPLORE THE FULL EXPERIENCE
            </p>
            <div className="cc-ed-demo-preview__invitation-actions">
              <button
                type="button"
                className="cc-ed-demo-preview__invitation-dismiss"
                onClick={() => setDismissed(true)}
              >
                Keep exploring
              </button>
              <LiveDemoLink className="cc-ed-demo-preview__invitation-cta cc-instant-press">
                Open Live Demo →
              </LiveDemoLink>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

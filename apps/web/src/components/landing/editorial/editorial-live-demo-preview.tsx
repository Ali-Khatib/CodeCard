'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type PreviewMode = 'web' | 'mobile';

const MIN_VISIBLE_MS = 18_000;
const DWELL_MS = 28_000;
const HOVER_MS = 14_000;
const PREVIEW_SCROLL_THRESHOLD = 320;

/**
 * Full live demo preview with web/mobile toggle. Invitation appears only after
 * sustained engagement and never covers the embedded interface.
 */
export function EditorialLiveDemoPreview() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const hoverStartRef = useRef<number | null>(null);
  const visibleSinceRef = useRef<number | null>(null);
  const scrollAccRef = useRef(0);
  const [mode, setMode] = useState<PreviewMode>('web');
  const [invited, setInvited] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const markEngaged = useCallback(() => {
    setInvited(true);
  }, []);

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
  const embedSrc = mode === 'web' ? '/demo?embed=1' : '/demo/card?embed=1';
  const embedTitle =
    mode === 'web'
      ? 'CodeCard live demo workspace preview'
      : 'CodeCard live demo mobile profile preview';

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
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'web'}
            className={
              mode === 'web'
                ? 'cc-ed-demo-preview__toggle cc-ed-demo-preview__toggle--active'
                : 'cc-ed-demo-preview__toggle'
            }
            onClick={() => setMode('web')}
          >
            Web app
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'mobile'}
            className={
              mode === 'mobile'
                ? 'cc-ed-demo-preview__toggle cc-ed-demo-preview__toggle--active'
                : 'cc-ed-demo-preview__toggle'
            }
            onClick={() => setMode('mobile')}
          >
            Mobile app
          </button>
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
          {mode === 'mobile' ? (
            <div className="cc-ed-demo-preview__phone">
              <iframe
                key="mobile"
                src={embedSrc}
                title={embedTitle}
                className="cc-ed-demo-preview__embed cc-ed-demo-preview__embed--mobile"
                loading="lazy"
                allow="clipboard-write"
              />
            </div>
          ) : (
            <iframe
              key="web"
              src={embedSrc}
              title={embedTitle}
              className="cc-ed-demo-preview__embed"
              loading="lazy"
              allow="clipboard-write"
            />
          )}
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

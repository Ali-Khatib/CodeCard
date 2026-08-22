'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const DWELL_MS = 4200;
const HOVER_MS = 1800;
const PREVIEW_SCROLL_THRESHOLD = 48;

/**
 * Square workspace preview — engagement reveals a centered invitation to the full demo.
 */
export function EditorialLiveDemoPreview() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const hoverStartRef = useRef<number | null>(null);
  const dwellStartRef = useRef<number | null>(null);
  const scrollAccRef = useRef(0);
  const [invited, setInvited] = useState(false);

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
          dwellStartRef.current = performance.now();
          return;
        }
        dwellStartRef.current = null;
      },
      { threshold: 0.45 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (reduced || invited) return;

    const tick = window.setInterval(() => {
      const now = performance.now();
      if (hoverStartRef.current != null && now - hoverStartRef.current >= HOVER_MS) {
        markEngaged();
        return;
      }
      if (dwellStartRef.current != null && now - dwellStartRef.current >= DWELL_MS) {
        markEngaged();
      }
    }, 250);

    return () => window.clearInterval(tick);
  }, [invited, markEngaged, reduced]);

  useEffect(() => {
    if (reduced || invited) return;
    const frame = frameRef.current;
    if (!frame) return;

    const onWheel = (event: WheelEvent) => {
      scrollAccRef.current += Math.abs(event.deltaY);
      if (scrollAccRef.current >= PREVIEW_SCROLL_THRESHOLD) {
        markEngaged();
      }
    };

    frame.addEventListener('wheel', onWheel, { passive: true });
    return () => frame.removeEventListener('wheel', onWheel);
  }, [invited, markEngaged, reduced]);

  return (
    <div
      ref={sectionRef}
      className={
        invited
          ? 'cc-ed-demo-preview cc-ed-demo-preview--invited'
          : 'cc-ed-demo-preview'
      }
      data-testid="editorial-live-demo-preview"
    >
      <div
        ref={frameRef}
        className="cc-ed-demo-preview__frame"
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
        <iframe
          src="/demo?embed=1"
          title="CodeCard live demo workspace preview"
          className="cc-ed-demo-preview__embed"
          loading="lazy"
          allow="clipboard-write"
        />
        <div className="cc-ed-demo-preview__veil" aria-hidden />
        <div
          className="cc-ed-demo-preview__invitation"
          aria-hidden={!invited}
          data-testid="editorial-live-demo-invitation"
        >
          <p className="cc-ed-demo-preview__invitation-title">
            EXPLORE THE FULL EXPERIENCE
          </p>
          <LiveDemoLink className="cc-ed-demo-preview__invitation-cta cc-ed__btn-primary cc-instant-press">
            Open Live Demo →
          </LiveDemoLink>
        </div>
      </div>
    </div>
  );
}

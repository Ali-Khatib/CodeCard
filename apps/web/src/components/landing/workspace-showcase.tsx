'use client';

import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { TYPE } from '@/lib/design/tokens';
import { ScrollReveal } from './scroll-reveal';
import { SectionCounter } from './section-counter';
import { useEffect, useRef, useState } from 'react';

/**
 * Workspace preview iframe — mount only when near viewport so `/` LCP is not
 * competed with by a full dashboard document fetch (Phase 0C evidence).
 */
function DeferredDashboardPreview() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="cc-workspace-showcase-embed">
      {show ? (
        <iframe
          src="/demo"
          title="CodeCard live demo workspace"
          className="cc-workspace-showcase-embed__frame"
          loading="lazy"
        />
      ) : (
        <div className="cc-workspace-showcase-embed__frame" aria-hidden />
      )}
    </div>
  );
}

export function WorkspaceShowcase() {
  return (
    <section id="workspace" className="scroll-mt-28 py-20 md:py-[100px]">
      <div className="cc-container">
        <ScrollReveal>
          <SectionCounter label="Your workspace" index="" />
          <h2 className={`mt-4 ${TYPE.sectionHeading} text-ink`}>
            Everything behind your CodeCard.
          </h2>
          <p className={`mt-4 max-w-[600px] ${TYPE.subheading}`}>
            This is the real dashboard — same UI as the live demo. Click a tab or explore inside.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <LiveDemoLink className="cc-btn-pill-demo cc-instant-press inline-flex h-11 px-8 text-[15px]">
              Open live demo workspace →
            </LiveDemoLink>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08} scale={0.99} className="mt-8">
          <DeferredDashboardPreview />
        </ScrollReveal>
      </div>
    </section>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { DEMO_PROFILE } from '@/lib/projects/demo-data';

/**
 * Deferred iframe of the real /demo workspace — mounts near viewport for LCP.
 */
function DeferredDemoFrame() {
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
    <div ref={hostRef} className="cc-ed-demo-embed__chrome">
      {show ? (
        <iframe
          src="/demo"
          title="CodeCard live demo workspace"
          className="cc-ed-demo-embed__frame"
          loading="lazy"
        />
      ) : (
        <div className="cc-ed-demo-embed__frame cc-ed-demo-embed__frame--placeholder" aria-hidden />
      )}
    </div>
  );
}

/** Full minimized live workspace on the marketing page — no side product mock. */
export function EditorialLiveDemoBox() {
  return (
    <section
      id="live-demo"
      className="cc-ed__section cc-ed-demo-embed"
      data-chapter-section="demo"
      data-testid="editorial-live-demo-box"
      aria-labelledby="editorial-live-demo-heading"
    >
      <div className="cc-ed-demo-embed__intro">
        <p className="cc-ed__eyebrow">Live workspace</p>
        <h2 id="editorial-live-demo-heading" className="cc-ed__display mt-3">
          <span className="cc-ed__lead">TRY THE REAL</span>
          <span className="cc-ed__sub">DEMO WORKSPACE.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-4">
          Explore {DEMO_PROFILE.display_name}’s full CodeCard inside the page, the
          same workspace as the live demo.
        </p>
        <p className="mt-5">
          <LiveDemoLink className="cc-ed__link">Open Live Demo →</LiveDemoLink>
        </p>
      </div>
      <DeferredDemoFrame />
    </section>
  );
}

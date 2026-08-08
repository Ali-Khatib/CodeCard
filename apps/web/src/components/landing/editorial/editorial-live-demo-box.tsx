'use client';

import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { DEMO_PROFILE } from '@/lib/projects/demo-data';

/**
 * Always-preloaded iframe of the real /demo workspace on the marketing page.
 */
function PreloadedDemoFrame() {
  return (
    <div className="cc-ed-demo-embed__chrome">
      <iframe
        src="/demo?embed=1"
        title="CodeCard live demo workspace"
        className="cc-ed-demo-embed__frame"
        loading="eager"
        allow="clipboard-write"
      />
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
      {/* Dark → cream wash; chapter flips to lilac a beat later on the intro */}
      <div className="cc-ed-walk__bridge cc-ed-walk__bridge--out" aria-hidden />
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
        <p className="mt-5 text-center">
          <LiveDemoLink className="cc-ed__link">Open Live Demo →</LiveDemoLink>
        </p>
      </div>
      <PreloadedDemoFrame />
    </section>
  );
}

'use client';

import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { DEMO_PROFILE } from '@/lib/projects/demo-data';
import { EditorialLiveDemoPreview } from './editorial-live-demo-preview';

/** Square workspace preview with engagement-based invitation to the full demo. */
export function EditorialLiveDemoBox() {
  return (
    <section
      id="live-demo"
      className="cc-ed__section cc-ed-demo-embed"
      data-chapter-section="demo"
      data-testid="editorial-live-demo-box"
      aria-labelledby="editorial-live-demo-heading"
    >
      <div className="cc-ed-walk__bridge cc-ed-walk__bridge--out" aria-hidden />
      <div className="cc-ed-demo-embed__intro">
        <p className="cc-ed__eyebrow">Live workspace</p>
        <h2 id="editorial-live-demo-heading" className="cc-ed__display mt-3">
          <span className="cc-ed__lead">TRY THE REAL</span>
          <span className="cc-ed__sub">DEMO WORKSPACE.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-4">
          Inspect {DEMO_PROFILE.display_name}&apos;s CodeCard here. When you are
          ready, step into the full workspace.
        </p>
        <p className="mt-5 text-center">
          <LiveDemoLink className="cc-ed__link">Open Live Demo →</LiveDemoLink>
        </p>
      </div>
      <EditorialLiveDemoPreview />
    </section>
  );
}

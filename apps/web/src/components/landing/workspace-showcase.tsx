'use client';

import { ScrollReveal } from './scroll-reveal';
import { SectionCounter } from './section-counter';
import { TYPE } from '@/lib/design/tokens';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';

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
          <LiveDemoLink className="cc-btn-pill-demo cc-instant-press mt-8 inline-flex h-11 px-8 text-[15px]">
            Open live demo workspace →
          </LiveDemoLink>
        </ScrollReveal>

        <ScrollReveal delay={0.08} scale={0.99} className="mt-8">
          <div className="cc-workspace-showcase-embed">
            <iframe
              src="/dashboard/preview"
              title="CodeCard dashboard preview"
              className="cc-workspace-showcase-embed__frame"
              loading="eager"
            />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

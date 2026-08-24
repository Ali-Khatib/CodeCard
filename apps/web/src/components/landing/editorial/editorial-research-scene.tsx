'use client';

import { useRef } from 'react';
import { EditorialResearchStory } from '@/components/ui/editorial-research-story';

export function EditorialResearchScene() {
  const rootRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={rootRef}
      id="why-research"
      className="cc-ed__section cc-ed-proof cc-ed-research-scene"
      data-chapter-section="proof"
      data-testid="editorial-research-proof"
      aria-labelledby="editorial-research-proof-heading"
      data-motion-pattern="reveal-editorial"
      data-motion-owner="motion"
    >
      <div className="cc-ed-research-scene__label">
        <span className="cc-ed-research-scene__label-mark" aria-hidden />
        <p className="cc-ed__eyebrow" id="editorial-research-proof-heading">
          The research
        </p>
      </div>

      <EditorialResearchStory />
    </section>
  );
}

'use client';

import { Timeline } from '@/components/ui/timeline';
import { LANDING_PERSONAS } from '@/lib/marketing/landing-personas';

/**
 * Who CodeCard is for — pinned horizontal journey.
 * Photos and matching colors stand in for dates.
 */
export function EditorialAudience() {
  return (
    <section
      id="audience"
      className="cc-ed__section cc-ed-audience"
      data-chapter-section="audience"
      data-testid="editorial-audience"
      data-chrome-surface="dark"
      aria-labelledby="editorial-audience-heading"
    >
      <h2 id="editorial-audience-heading" className="sr-only">
        Who CodeCard is for
      </h2>
      <Timeline
        title="Who it's for"
        periodLabel="Five people. One card."
        backgroundColor="#000000"
        textColor="#f5f5f5"
        mutedTextColor="rgba(245,245,245,0.62)"
        activeColor="#ff5f00"
        items={LANDING_PERSONAS.map((persona) => ({
          id: persona.id,
          number: persona.number,
          title: persona.title,
          body: persona.body,
          imageSrc: persona.imageSrc,
          imageAlt: persona.imageAlt,
          imagePosition: persona.imagePosition,
          accent: persona.accent,
        }))}
      />
    </section>
  );
}

'use client';

import { Timeline } from '@/components/ui/timeline';
import { LANDING_PERSONAS } from '@/lib/marketing/landing-personas';

/**
 * The life of a CodeCard — sequential create / meet / share / connect / meet again.
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
        The life of a CodeCard
      </h2>
      <Timeline
        title="The life of a CodeCard"
        periodLabel="Create. Meet. Share. Connect. Meet again."
        backgroundColor="#080a09"
        textColor="#efe7d4"
        mutedTextColor="rgba(239,231,212,0.64)"
        activeColor="#86b54a"
        items={LANDING_PERSONAS.map((persona) => ({
          id: persona.id,
          number: persona.number,
          title: persona.title,
          lead: persona.lead,
          body: persona.body,
          imageSrc: persona.imageSrc,
          imageAlt: persona.imageAlt,
          imagePosition: persona.imagePosition,
          accent: persona.accent,
          rail: persona.rail,
        }))}
      />
    </section>
  );
}

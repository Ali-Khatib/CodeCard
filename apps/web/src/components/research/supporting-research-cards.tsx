'use client';

import { SourceInfoIcon } from './source-drawer';
import { ScrollReveal } from '@/components/landing/scroll-reveal';

const CARDS = [
  {
    title: 'Pedigree changes opportunity',
    body: 'School prestige, employer prestige and class-coded signals can affect early screening before capability is directly assessed.',
    sourceId: 'rivera-tilcsik',
  },
  {
    title: 'Visible proof reduces inference',
    body: 'Project cards, outcome metrics, technology logos, demonstrations and working links help visitors recognize evidence instead of reconstructing it from prose.',
    sourceId: 'nng-recognition',
  },
  {
    title: 'Detail should be earned',
    body: 'Progressive disclosure keeps the opening view decisive while education, experience, methodology and long-form evidence remain available on demand.',
    sourceId: 'springer-disclosure',
  },
] as const;

export function SupportingResearchCards() {
  return (
    <section className="cc-container py-16 md:py-24" aria-label="Supporting research">
      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {CARDS.map((card, i) => (
          <ScrollReveal key={card.title} delay={i * 0.08}>
            <article className="cc-surface-card relative h-full p-7 md:p-8">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-[20px] font-medium leading-snug text-lilac-white">
                  {card.title}
                </h3>
                <SourceInfoIcon sourceId={card.sourceId} />
              </div>
              <p className="mt-4 text-[16px] leading-[1.5] text-ash">{card.body}</p>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

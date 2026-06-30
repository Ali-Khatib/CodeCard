'use client';

import { EVIDENCE_RAIL_STATS } from '@/lib/research/sources';
import { SourceInfoIcon } from './source-drawer';
import { ScrollReveal } from '@/components/landing/scroll-reveal';

export function EvidenceRail() {
  return (
    <section aria-label="Research evidence highlights" className="relative py-12 md:py-16">
      <div className="cc-content relative grid gap-4 md:grid-cols-3 md:gap-5">
        {EVIDENCE_RAIL_STATS.map((stat, i) => (
          <ScrollReveal key={stat.id} delay={i * 0.1}>
            <article className="cc-surface-card group relative overflow-hidden p-6 md:p-7">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-[44px] font-medium leading-none tracking-[-0.3px] cc-stat-reactor md:text-[52px]">
                  {stat.figure}
                </p>
                <SourceInfoIcon sourceId={stat.sourceId} label={`Source details for ${stat.figure}`} />
              </div>
              <p className="mt-4 text-[16px] leading-[1.5] text-lichen md:text-[17px]">{stat.label}</p>
              <p className="cc-tag-dot mt-3 text-[12px] font-medium uppercase tracking-[0.1em] text-graphite">
                {stat.contextNote}
              </p>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

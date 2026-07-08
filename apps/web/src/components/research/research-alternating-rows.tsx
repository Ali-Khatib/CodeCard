'use client';

import { ALTERNATING_RESEARCH } from '@/lib/research/alternating-insights';
import { ScrollReveal } from '@/components/landing/scroll-reveal';
import { SourceInfoIcon } from './source-drawer';

const ACCENT_CLASS: Record<(typeof ALTERNATING_RESEARCH)[number]['accent'], string> = {
  lavender: 'cc-research-card--lavender',
  peach: 'cc-research-card--peach',
  mint: 'cc-research-card--mint',
};

function ResearchCard({
  item,
  index,
}: {
  item: (typeof ALTERNATING_RESEARCH)[number];
  index: number;
}) {
  return (
    <ScrollReveal y={40} delay={index * 0.08} scale={0.98}>
      <article className={`cc-research-card ${ACCENT_CLASS[item.accent]}`}>
        <div className="cc-research-card__widget" aria-hidden>
          <div className="cc-research-card__widget-inner">
            <span className="cc-research-card__widget-label">Study finding</span>
            <blockquote className="cc-research-card__widget-quote">
              &ldquo;{item.paperQuote}&rdquo;
            </blockquote>
            <footer className="cc-research-card__widget-cite">{item.citation}</footer>
          </div>
        </div>

        <div className="cc-research-card__content">
          <div className="flex items-center justify-between gap-3">
            <span className="cc-research-card__pill">{item.category}</span>
            <SourceInfoIcon sourceId={item.sourceId} className="h-7 w-7 text-[15px]" />
          </div>

          <h3 className="cc-research-card__title">{item.humanHeadline}</h3>
          <p className="cc-research-card__body">{item.humanBody}</p>
        </div>
      </article>
    </ScrollReveal>
  );
}

export function ResearchAlternatingRows() {
  return (
    <div className="cc-research-masonry">
      {ALTERNATING_RESEARCH.map((item, index) => (
        <ResearchCard key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}

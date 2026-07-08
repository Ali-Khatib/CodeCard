'use client';

import { useState } from 'react';
import { ALTERNATING_RESEARCH } from '@/lib/research/alternating-insights';
import { ScrollSequence } from '@/components/landing/scroll-sequence';
import { SourceInfoIcon } from './source-drawer';

const ACCENT_CLASS: Record<(typeof ALTERNATING_RESEARCH)[number]['accent'], string> = {
  lavender: 'cc-research-card--lavender',
  peach: 'cc-research-card--peach',
  mint: 'cc-research-card--mint',
};

function ResearchCardContent({
  item,
  compact = false,
}: {
  item: (typeof ALTERNATING_RESEARCH)[number];
  compact?: boolean;
}) {
  return (
    <article className={`cc-research-card ${ACCENT_CLASS[item.accent]} ${compact ? 'cc-research-card--compact' : ''}`}>
      {!compact && (
        <div className="cc-research-card__widget" aria-hidden>
          <div className="cc-research-card__widget-inner">
            <span className="cc-research-card__widget-label">Study finding</span>
            <blockquote className="cc-research-card__widget-quote">
              &ldquo;{item.paperQuote}&rdquo;
            </blockquote>
            <footer className="cc-research-card__widget-cite">{item.citation}</footer>
          </div>
        </div>
      )}

      <div className="cc-research-card__content">
        <div className="flex items-center justify-between gap-3">
          <span className="cc-research-card__pill">{item.category}</span>
          <SourceInfoIcon sourceId={item.sourceId} className="h-7 w-7 text-[15px]" />
        </div>
        <h3 className="cc-research-card__title">{item.humanHeadline}</h3>
        <p className="cc-research-card__body">{item.humanBody}</p>
      </div>
    </article>
  );
}

export function ResearchAlternatingRows() {
  const [active, setActive] = useState(0);
  const showGrid = active >= ALTERNATING_RESEARCH.length - 1;

  return (
    <div className="cc-research-sequence">
      <ScrollSequence
        items={ALTERNATING_RESEARCH}
        stepVh={62}
        className={`cc-research-sequence__runway ${showGrid ? 'cc-research-sequence__runway--done' : ''}`}
        stageClassName="cc-research-sequence__stage"
        onActiveChange={setActive}
        renderItem={(item, _i, isActive) => (
          <div className="cc-research-sequence__focus" data-active={isActive}>
            <ResearchCardContent item={item} />
          </div>
        )}
      />

      <div className={`cc-research-sequence__grid ${showGrid ? 'cc-research-sequence__grid--visible' : ''}`}>
        {ALTERNATING_RESEARCH.map((item) => (
          <ResearchCardContent key={item.id} item={item} compact />
        ))}
      </div>
    </div>
  );
}

'use client';

import { ALTERNATING_RESEARCH } from '@/lib/research/alternating-insights';
import { ScrollReveal } from '@/components/landing/scroll-reveal';
import { SourceInfoIcon } from './source-drawer';

function ResearchQuoteBox({
  quote,
  citation,
  sourceId,
}: {
  quote: string;
  citation: string;
  sourceId: string;
}) {
  return (
    <div className="cc-research-alt-quote">
      <blockquote className="font-display text-[20px] font-normal leading-[1.45] tracking-[-0.02em] text-ink md:text-[24px] md:leading-[1.4]">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <footer className="mt-6 flex items-center justify-between gap-4 border-t border-border/60 pt-5">
        <cite className="font-eyebrow text-[11px] not-italic uppercase tracking-[0.08em] text-smoke">
          {citation}
        </cite>
        <SourceInfoIcon sourceId={sourceId} />
      </footer>
    </div>
  );
}

function HumanProblem({
  headline,
  body,
}: {
  headline: string;
  body: string;
}) {
  return (
    <div className="cc-research-alt-human">
      <h3 className="font-display text-[28px] font-normal leading-[1.2] tracking-[-0.03em] text-ink md:text-[36px] md:leading-[1.15]">
        {headline}
      </h3>
      <p className="mt-5 text-[17px] leading-[1.6] text-ink md:text-[19px] md:leading-[1.55]">
        {body}
      </p>
    </div>
  );
}

export function ResearchAlternatingRows() {
  return (
    <div className="cc-research-alt-stack">
      {ALTERNATING_RESEARCH.map((item, index) => {
        const boxOnRight = index % 2 === 0;

        return (
          <ScrollReveal key={item.id} y={48} delay={index * 0.06}>
            <article
              className={`cc-research-alt-row ${boxOnRight ? 'cc-research-alt-row--box-right' : 'cc-research-alt-row--box-left'}`}
            >
              <div className="cc-research-alt-row__human">
                <HumanProblem headline={item.humanHeadline} body={item.humanBody} />
              </div>
              <div className="cc-research-alt-row__quote">
                <ResearchQuoteBox
                  quote={item.paperQuote}
                  citation={item.citation}
                  sourceId={item.sourceId}
                />
              </div>
            </article>
          </ScrollReveal>
        );
      })}
    </div>
  );
}

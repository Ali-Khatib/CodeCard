'use client';

import { motion } from 'motion/react';
import { ALTERNATING_RESEARCH } from '@/lib/research/alternating-insights';
import { SourceInfoIcon } from './source-drawer';

const ITEMS = ALTERNATING_RESEARCH;

function ResearchPair({
  item,
  index,
}: {
  item: (typeof ITEMS)[number];
  index: number;
}) {
  return (
    <motion.article
      className="cc-research-crossfade__item"
      initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
      whileInView={{
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
      }}
      viewport={{ amount: 0.38, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="cc-research-crossfade__source">
        <div className="cc-research-crossfade__rule" aria-hidden />
        <p className="cc-research-crossfade__eyebrow">Study finding</p>
        <blockquote>&ldquo;{item.paperQuote}&rdquo;</blockquote>
        <p className="cc-research-crossfade__cite">{item.citation}</p>
      </div>

      <div className="cc-research-crossfade__explain">
        <div className="flex items-center justify-between gap-3">
          <span className="cc-research-crossfade__pill">{item.category}</span>
          <SourceInfoIcon sourceId={item.sourceId} className="h-7 w-7 text-[15px]" />
        </div>
        <p className="cc-research-crossfade__count">{String(index + 1).padStart(2, '0')}</p>
        <h3>{item.humanHeadline}</h3>
        <p>{item.humanBody}</p>
      </div>
    </motion.article>
  );
}

export function ResearchAlternatingRows() {
  return (
    <div className="cc-research-alt-stack">
      {ITEMS.map((item, index) => (
        <ResearchPair key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}

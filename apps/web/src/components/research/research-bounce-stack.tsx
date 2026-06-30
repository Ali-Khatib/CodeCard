'use client';

import dynamic from 'next/dynamic';
import { SourceInfoIcon } from './source-drawer';
import { CARD_BORDER_GLOW } from '@/lib/design/border-glow-preset';
import { RESEARCH_INSIGHTS } from '@/lib/research/insights';

const BounceCards = dynamic(() => import('@/components/react-bits/bounce-cards/bounce-cards'), {
  ssr: false,
});

const BorderGlow = dynamic(() => import('@/components/react-bits/border-glow/border-glow'), {
  ssr: false,
});

function ResearchCard({
  title,
  stat,
  finding,
  sourceId,
}: {
  title: string;
  stat: string;
  finding: string;
  sourceId: string;
}) {
  return (
    <BorderGlow {...CARD_BORDER_GLOW} className="cc-research-bounce-card h-full w-full">
      <p className="font-display text-[17px] font-medium leading-snug text-vellum md:text-[18px]">{title}</p>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <span className="font-display text-[32px] font-medium leading-none text-reactor">{stat}</span>
        <SourceInfoIcon sourceId={sourceId} />
      </div>
      <p className="cc-research-card-finding mt-3 text-[13px] leading-[1.5]">{finding}</p>
    </BorderGlow>
  );
}

export function ResearchBounceStack() {
  const items = RESEARCH_INSIGHTS.map((insight) => ({
    content: (
      <ResearchCard
        title={insight.title}
        stat={insight.stat}
        finding={insight.finding}
        sourceId={insight.sourceId}
      />
    ),
    ariaLabel: insight.title,
  }));

  return (
    <div className="flex justify-center py-4">
      <BounceCards
        className="mx-auto"
        items={items}
        orientation="vertical"
        containerWidth={340}
        containerHeight={420}
        cardWidth={300}
        animationDelay={0.2}
        animationStagger={0.1}
        easeType="elastic.out(1, 0.5)"
        enableHover
      />
    </div>
  );
}

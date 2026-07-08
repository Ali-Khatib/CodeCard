'use client';

import dynamic from 'next/dynamic';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { SourceInfoIcon } from './source-drawer';
import { CARD_BORDER_GLOW } from '@/lib/design/border-glow-preset';
import { RESEARCH_INSIGHTS } from '@/lib/research/insights';

const ScrollStack = dynamic(() => import('@/components/react-bits/scroll-stack/scroll-stack'), {
  ssr: false,
});

const ScrollStackItem = dynamic(
  () =>
    import('@/components/react-bits/scroll-stack/scroll-stack').then((mod) => ({
      default: mod.ScrollStackItem,
    })),
  { ssr: false },
);

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
    <BorderGlow {...CARD_BORDER_GLOW} className="cc-research-scroll-card h-full w-full">
      <p className="font-display text-[22px] font-normal leading-snug tracking-[-0.02em] text-ink md:text-[26px]">{title}</p>
      <div className="mt-6 flex flex-wrap items-end gap-2.5">
        <span className="font-display text-[40px] font-medium leading-none text-reactor md:text-[48px]">{stat}</span>
        <SourceInfoIcon sourceId={sourceId} />
      </div>
      <p className="cc-research-card-finding mt-5 text-[16px] leading-[1.6] md:text-[17px]">{finding}</p>
    </BorderGlow>
  );
}

function StaticResearchCards() {
  return (
    <div className="cc-container cc-research-scroll-stack-fallback">
      {RESEARCH_INSIGHTS.map((insight) => (
        <ResearchCard
          key={insight.id}
          title={insight.title}
          stat={insight.stat}
          finding={insight.finding}
          sourceId={insight.sourceId}
        />
      ))}
    </div>
  );
}

export function ResearchScrollStack() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <StaticResearchCards />;
  }

  return (
    <div className="cc-container cc-research-scroll-stack">
      <ScrollStack
        useWindowScroll
        className="cc-research-scroll-stack__scroller"
        itemDistance={96}
        itemStackDistance={24}
        stackPosition="22%"
        scaleEndPosition="12%"
        baseScale={0.9}
        itemScale={0.04}
        blurAmount={1.5}
      >
        {RESEARCH_INSIGHTS.map((insight) => (
          <ScrollStackItem key={insight.id} itemClassName="cc-scroll-stack-card">
            <ResearchCard
              title={insight.title}
              stat={insight.stat}
              finding={insight.finding}
              sourceId={insight.sourceId}
            />
          </ScrollStackItem>
        ))}
      </ScrollStack>
    </div>
  );
}

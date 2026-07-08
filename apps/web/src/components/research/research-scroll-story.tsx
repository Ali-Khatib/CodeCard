'use client';

import dynamic from 'next/dynamic';
import { AuroraDivider } from '@/components/landing/aurora-divider';
import { ScrollReveal } from '@/components/landing/scroll-reveal';

const ResearchScrollStack = dynamic(
  () => import('./research-scroll-stack').then((mod) => mod.ResearchScrollStack),
  {
    ssr: false,
    loading: () => (
      <div className="cc-container cc-research-scroll-stack-fallback" aria-hidden>
        <div className="cc-research-scroll-card-fallback" />
        <div className="cc-research-scroll-card-fallback" />
        <div className="cc-research-scroll-card-fallback" />
      </div>
    ),
  },
);

export function ResearchScrollStory() {
  return (
    <section className="relative py-4 md:py-8">
      <ResearchScrollStack />
      <div className="cc-research-takeaway cc-container mt-12 md:mt-16">
        <ScrollReveal>
          <p className="text-center font-eyebrow text-[12px] uppercase tracking-[0.1em] text-iris">
            In other words
          </p>
          <p className="mx-auto mt-5 max-w-[700px] text-balance text-center font-display text-[28px] font-normal leading-[1.3] tracking-[-0.02em] text-ink md:text-[36px] md:leading-[1.25]">
            They check schools and titles first. Work buried at the bottom may never get seen.
          </p>
        </ScrollReveal>
      </div>
      <AuroraDivider className="cc-container my-12" />
    </section>
  );
}

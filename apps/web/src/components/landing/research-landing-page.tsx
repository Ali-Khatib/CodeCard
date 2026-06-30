'use client';

import { ResearchProvider } from '@/components/research/research-provider';
import { ResearchScrollStory } from '@/components/research/research-scroll-story';
import { ResearchThesisCard } from '@/components/research/research-thesis-card';
import { ResearchWhyCodecard } from '@/components/research/research-why-codecard';
import Link from 'next/link';
import { TYPE } from '@/lib/design/tokens';

export function ResearchLandingPage() {
  return (
    <ResearchProvider>
      <div className="pb-8">
        <section className="cc-container pb-6 pt-[96px]">
          <p className={TYPE.eyebrow}>Research</p>
          <h1 className={`mt-3 ${TYPE.sectionHeading} text-phosphor`}>Why order matters.</h1>
          <p className="mt-6 max-w-[680px] text-[18px] leading-relaxed text-lichen">
            Studies show people skim for seconds and fix on schools and titles first. The research
            cards below cite the sources.
          </p>
        </section>

        <ResearchScrollStory />
        <ResearchThesisCard />
        <ResearchWhyCodecard />

        <section className="cc-container py-12">
          <div className="cc-surface-card p-8 text-center">
            <p className="text-[17px] text-lichen">Full bibliography with source details and limitations.</p>
            <Link
              href="/research/references"
              className="mt-4 inline-flex text-[15px] font-medium text-reactor hover:text-phosphor"
            >
              View all references →
            </Link>
          </div>
        </section>
      </div>
    </ResearchProvider>
  );
}

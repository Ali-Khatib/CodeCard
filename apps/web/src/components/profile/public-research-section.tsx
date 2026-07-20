import type { ResearchPaper } from '@/lib/research/research';
import { ResearchPaperCard } from '@/components/research/research-paper-card';
import { HUME_MOTION } from '@/lib/motion/hume-motion';

/** Isolated so profiles without research do not pull this client chunk into LCP path. */
export function PublicResearchSection({
  profileSlug,
  profileId,
  researchPapers,
}: {
  profileSlug: string;
  profileId?: string;
  researchPapers: ResearchPaper[];
}) {
  return (
    <section id="research" className="mt-16 scroll-mt-24">
      <p className="cc-app-mono">Research</p>
      <h2 className="mt-3 text-[24px] font-medium tracking-[-0.025em] text-[var(--app-ink)]">
        Papers &amp; publications
      </h2>
      <p className="mt-2 max-w-lg text-[15px] text-[var(--app-smoke)]">
        Abstracts, citations, PDFs, and related technical work in the same CodeCard.
      </p>

      <div className="mt-8 flex flex-col gap-8">
        {researchPapers.map((paper, index) => (
          <ResearchPaperCard
            key={paper.id}
            paper={paper}
            href={`/${profileSlug}/research/${paper.slug}`}
            profileId={profileId}
            delay={index * HUME_MOTION.stagger}
          />
        ))}
      </div>
    </section>
  );
}

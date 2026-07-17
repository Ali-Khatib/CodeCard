'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { HiOutlineDocumentText } from 'react-icons/hi2';
import type { ResearchPaper } from '@/lib/research/research';
import { estimateReadTimeSeconds } from '@/lib/research/research';
import { HUME_EASE, HUME_MOTION } from '@/lib/motion/hume-motion';
import { AppReveal } from '@/components/ui/app-reveal';
import { CitationCopyButton } from '@/components/research/citation-copy-button';
import { ResearchPdfReadButton } from '@/components/research/research-pdf-reader';
import { trackResearchEvent } from './research-analytics';

function formatReadTime(seconds?: number) {
  const sec = seconds ?? 0;
  const min = Math.max(1, Math.round(sec / 60));
  return `${min} min read`;
}

function abstractPreview(abstract: string | null) {
  if (!abstract) return 'Research abstract coming soon.';
  return abstract.length > 220 ? `${abstract.slice(0, 220).trim()}...` : abstract;
}

export function ResearchPaperCard({
  paper,
  href,
  profileId,
  delay = 0,
}: {
  paper: ResearchPaper;
  href: string;
  profileId?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const readTime = paper.avgReadTimeSec ?? estimateReadTimeSeconds(paper);

  return (
    <AppReveal delay={delay}>
      <motion.article
        layout
        className="cc-app-project-card"
        whileTap={reduced ? undefined : { scale: 0.985 }}
        transition={{ duration: HUME_MOTION.press, ease: HUME_EASE }}
      >
        <Link
          href={href}
          className="cc-app-project-card__media cc-app-project-card__media--public group block outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-iris)]"
          aria-label={`Open research paper: ${paper.title}`}
        >
          {paper.coverImageUrl ? (
            <Image
              src={paper.coverImageUrl}
              alt=""
              fill
              className="cc-app-project-card__media-inner transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 920px) 100vw, 920px"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(147,130,255,0.28),transparent_30%),linear-gradient(135deg,#10093a,#030014)]" />
          )}
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-lilac-white backdrop-blur-md">
            <HiOutlineDocumentText className="h-4 w-4" aria-hidden />
            Research
          </div>
        </Link>

        <div className="cc-app-project-card__body">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link href={href} className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-iris)]">
                <h3 className="cc-fit-title cc-work-title cc-work-title--compact">
                  {paper.title}
                </h3>
              </Link>
              <p className="mt-2 text-[14px] text-[var(--app-smoke)]">
                {paper.authors.length > 0 ? paper.authors.join(', ') : 'Authors coming soon'}
              </p>
            </div>
            <span className="cc-app-badge cc-app-badge--mint">
              {paper.year ?? 'Year TBA'}
            </span>
          </div>

          <p className="mt-3 max-w-[720px] text-[15px] leading-relaxed text-[var(--app-smoke)]">
            {abstractPreview(paper.abstract)}
          </p>

          <p className="mt-3 text-[14px] text-[var(--app-smoke)]">
            {[paper.venue, paper.publicationStatus].filter(Boolean).join(' · ') || 'Publication details pending'}
          </p>

          {paper.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {paper.tags.slice(0, 7).map((tag) => (
                <span key={tag} className="cc-app-tech-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="mt-4 text-[14px] text-[var(--app-smoke)]">
            {paper.downloadCount != null && (
              <>
                <strong className="font-medium text-[var(--app-ink)]">{paper.downloadCount}</strong> downloads ·{' '}
              </>
            )}
            <strong className="font-medium text-[var(--app-ink)]">{formatReadTime(readTime)}</strong>
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={href} className="cc-app-btn cc-app-btn--primary">
              Open research
            </Link>
            {paper.pdfUrl && (
              <ResearchPdfReadButton
                paper={paper}
                profileId={profileId}
                className="cc-app-btn cc-app-btn--ghost"
                onOpenTrack={() =>
                  trackResearchEvent({
                    eventType: 'paper_download',
                    profileId,
                    researchPaperId: paper.id,
                  })
                }
              />
            )}
            {paper.citationText && (
              <CitationCopyButton
                citationText={paper.citationText}
                compactLabel="Citation"
                onCopied={() =>
                  trackResearchEvent({
                    eventType: 'citation_copy',
                    profileId,
                    researchPaperId: paper.id,
                  })
                }
              />
            )}
            {paper.relatedProjectHref && (
              <Link
                href={paper.relatedProjectHref}
                className="cc-app-btn cc-app-btn--ghost"
                onClick={() =>
                  trackResearchEvent({
                    eventType: 'related_project_click',
                    profileId,
                    researchPaperId: paper.id,
                  })
                }
              >
                Related project
              </Link>
            )}
          </div>
        </div>
      </motion.article>
    </AppReveal>
  );
}

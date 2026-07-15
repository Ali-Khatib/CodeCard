'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineDocumentText,
  HiOutlineLink,
} from 'react-icons/hi2';
import type { ResearchPaper } from '@/lib/research/research';
import { estimateReadTimeSeconds } from '@/lib/research/research';
import { describeExternalPdfSource } from '@/lib/research/research-external-pdf';
import { TYPE } from '@/lib/design/tokens';
import { ProjectWorkAtmosphere } from '@/components/featured-work/project-work-atmosphere';
import { CitationCopyButton } from '@/components/research/citation-copy-button';
import { trackResearchEvent } from './research-analytics';

function metadataLine(paper: ResearchPaper) {
  return [paper.venue, paper.publicationStatus, paper.year].filter(Boolean).join(' · ');
}

function formatReadTime(seconds: number) {
  const min = Math.max(1, Math.round(seconds / 60));
  return `${min} min read`;
}

export function ResearchPaperDetail({
  paper,
  profileSlug,
  profileId,
  displayName,
}: {
  paper: ResearchPaper;
  profileSlug: string;
  profileId?: string;
  displayName: string;
}) {
  const [abstractExpanded, setAbstractExpanded] = useState(false);
  const backHref = profileSlug === 'demo' ? '/demo' : `/${profileSlug}`;
  const readTime = paper.avgReadTimeSec ?? estimateReadTimeSeconds(paper);

  useEffect(() => {
    const startedAt = Date.now();
    trackResearchEvent({
      eventType: 'research_view',
      profileId,
      researchPaperId: paper.id,
    });

    return () => {
      const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      trackResearchEvent({
        eventType: 'time_spent_on_research',
        profileId,
        researchPaperId: paper.id,
        metadata: { seconds },
      });
    };
  }, [paper.id, profileId]);

  const abstract = paper.abstract ?? 'Abstract coming soon.';
  const abstractPreview = abstract.length > 520 ? `${abstract.slice(0, 520).trim()}...` : abstract;
  const externalPdfLabel = describeExternalPdfSource(paper.pdfUrl);

  return (
    <div className="relative min-h-[100dvh] text-text-primary">
      <ProjectWorkAtmosphere variant="page" />

      <div className="relative z-[1]">
        <header className="cc-container sticky top-0 z-20 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between rounded-full border border-border/40 bg-midnight/75 px-4 py-2.5 shadow-rim">
            <Link
              href={backHref}
              className="cc-instant-press flex items-center gap-2 rounded-full px-2 py-1 text-[15px] text-text-secondary transition-colors hover:text-text-primary active:opacity-80"
              aria-label={`Back to ${displayName}`}
            >
              <HiOutlineArrowLeft className="text-lg" aria-hidden />
              <span className="hidden sm:inline">{displayName}</span>
            </Link>

            <div className="flex gap-2">
              {paper.pdfUrl && (
                <a
                  href={paper.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cc-app-btn cc-app-btn--primary !h-10"
                  aria-label="Open external paper"
                  title={externalPdfLabel ?? 'Open external paper'}
                  onClick={() =>
                    trackResearchEvent({
                      eventType: 'paper_download',
                      profileId,
                      researchPaperId: paper.id,
                    })
                  }
                >
                  <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                  Open paper
                </a>
              )}
              {paper.doiUrl && (
                <a href={paper.doiUrl} target="_blank" rel="noopener noreferrer" className="cc-app-btn cc-app-btn--ghost !h-10">
                  <HiOutlineLink className="h-4 w-4" aria-hidden />
                  DOI
                </a>
              )}
            </div>
          </div>
        </header>

        <section className="cc-container cc-on-cream-surface pb-12 pt-10 md:pb-16 md:pt-14">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className={TYPE.eyebrow}>Research paper</p>
              <h1 className={TYPE.contentHeroTitle}>
                {paper.title}
              </h1>
              <p className="mt-5 text-[17px] leading-relaxed text-ash md:text-[19px]">
                {paper.authors.length > 0 ? paper.authors.join(', ') : 'Authors coming soon'}
              </p>
              <p className="mt-2 text-[15px] text-text-secondary">
                {metadataLine(paper) || 'Publication details pending'} · {formatReadTime(readTime)}
              </p>
              {externalPdfLabel && (
                <p className="mt-3 text-[13px] text-text-secondary">
                  {externalPdfLabel}. CodeCard does not host or verify this file.
                </p>
              )}
            </div>

            <div className="relative aspect-[16/11] overflow-hidden rounded-card border border-border/40 bg-midnight shadow-rim">
              {paper.coverImageUrl ? (
                <Image src={paper.coverImageUrl} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 520px" priority />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(147,130,255,0.28),transparent_32%),linear-gradient(135deg,#10093a,#030014)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-void-canvas/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-[18px] border border-white/12 bg-black/30 p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-lilac-white">
                  <HiOutlineDocumentText className="h-4 w-4" aria-hidden />
                  Publication preview
                </div>
              </div>
            </div>
          </div>
        </section>

        <article className="cc-container cc-content cc-on-cream-surface pb-24">
          <section className="rounded-card border border-border/40 bg-midnight/50 p-8 shadow-rim md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className={TYPE.eyebrow}>Abstract</p>
              {abstract.length > 520 && (
                <button
                  type="button"
                  className="cc-app-btn cc-app-btn--ghost !h-9"
                  onClick={() => {
                    setAbstractExpanded((open) => !open);
                    trackResearchEvent({
                      eventType: 'abstract_expand',
                      profileId,
                      researchPaperId: paper.id,
                    });
                  }}
                >
                  {abstractExpanded ? 'Collapse' : 'Expand abstract'}
                </button>
              )}
            </div>
            <p className="mt-5 text-[19px] leading-[1.65] text-ash md:text-[21px]">
              {abstractExpanded ? abstract : abstractPreview}
            </p>
          </section>

          {paper.tags.length > 0 && (
            <section className="mt-10 border-t border-border/40 pt-10">
              <p className={TYPE.eyebrow}>Keywords</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {paper.tags.map((tag) => (
                  <span key={tag} className="rounded-badge border border-lavender/30 bg-midnight/10 px-3 py-1 text-[13px] text-ink">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {(paper.citationText || paper.relatedProjectHref) && (
            <section className="mt-12 grid gap-4 md:grid-cols-2">
              {paper.citationText && (
                <div className="rounded-card border border-border/40 bg-midnight/50 p-6 shadow-rim">
                  <p className={TYPE.eyebrow}>Citation</p>
                  <p className="mt-4 text-[15px] leading-relaxed text-ash">{paper.citationText}</p>
                  <CitationCopyButton
                    citationText={paper.citationText}
                    className="cc-app-btn cc-app-btn--primary mt-5"
                    onCopied={() =>
                      trackResearchEvent({
                        eventType: 'citation_copy',
                        profileId,
                        researchPaperId: paper.id,
                      })
                    }
                  />
                </div>
              )}

              {paper.relatedProjectHref && (
                <div className="rounded-card border border-border/40 bg-midnight/50 p-6 shadow-rim">
                  <p className={TYPE.eyebrow}>Related project</p>
                  <h2 className="mt-4 font-display text-[28px] tracking-[-0.03em] text-ink">
                    {paper.relatedProjectTitle ?? 'Open related project'}
                  </h2>
                  <Link
                    href={paper.relatedProjectHref}
                    className="cc-app-btn cc-app-btn--ghost mt-5"
                    onClick={() =>
                      trackResearchEvent({
                        eventType: 'related_project_click',
                        profileId,
                        researchPaperId: paper.id,
                      })
                    }
                  >
                    View project
                  </Link>
                </div>
              )}
            </section>
          )}

          {paper.figures.length > 0 && (
            <section className="mt-16 border-t border-border/40 pt-14">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className={TYPE.eyebrow}>Figures</p>
                  <h2 className={TYPE.contentSectionTitle}>
                    Evidence &amp; previews
                  </h2>
                </div>
                <p className="text-[17px] text-ash">
                  {paper.figures.length} {paper.figures.length === 1 ? 'figure' : 'figures'}
                </p>
              </div>
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {paper.figures.map((figure, index) => (
                  <figure
                    key={figure.imageUrl + index}
                    className="overflow-hidden rounded-card border border-border/40 bg-midnight shadow-rim"
                    onMouseEnter={() =>
                      trackResearchEvent({
                        eventType: 'figure_view',
                        profileId,
                        researchPaperId: paper.id,
                        sectionName: `figure-${index + 1}`,
                      })
                    }
                  >
                    <div className="relative aspect-[16/10]">
                      <Image src={figure.imageUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 520px" />
                    </div>
                    {figure.caption && (
                      <figcaption className="border-t border-border/40 p-4 text-[14px] leading-relaxed text-ash">
                        {figure.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </div>
  );
}

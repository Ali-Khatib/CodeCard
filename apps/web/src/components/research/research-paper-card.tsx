'use client';

import Image from 'next/image';
import type { ResearchPaper } from '@/lib/research/research';
import { ContentOpeningLink } from '@/components/navigation/content-opening-transition';
import { ProjectTechLine } from '@/components/projects/project-tech-line';

/** Gallery card: cover, title, and a compact topic line. Details live on the paper page. */
export function ResearchPaperCard({
  paper,
  href,
}: {
  paper: ResearchPaper;
  href: string;
  profileId?: string;
  delay?: number;
}) {
  return (
    <article className="cc-app-project-card">
      <ContentOpeningLink
        href={href}
        kind="research"
        itemTitle={paper.title}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-iris)]"
        aria-label={`Open research paper: ${paper.title}`}
      >
        <div className="cc-app-project-card__media relative">
          {paper.coverImageUrl ? (
            <Image
              src={paper.coverImageUrl}
              alt=""
              fill
              className="cc-app-project-card__media-inner object-contain"
              quality={90}
              sizes="(max-width: 920px) 100vw, 920px"
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#2a1206,#1a0f08)]" />
          )}
        </div>
        <div className="cc-app-project-card__body">
          <h3 className="cc-fit-title cc-work-title break-words">{paper.title}</h3>
          <ProjectTechLine technologies={paper.tags} className="mt-1.5" />
        </div>
      </ContentOpeningLink>
    </article>
  );
}

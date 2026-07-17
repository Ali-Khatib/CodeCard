'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { HiOutlineDocumentText } from 'react-icons/hi2';
import type { ResearchPaper } from '@/lib/research/research';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export function ResearchBubbleGrid({
  papers,
  basePath = '/dashboard',
}: {
  papers: ResearchPaper[];
  basePath?: string;
}) {
  const reduced = useReducedMotion();
  const count = papers.length;
  const colMin =
    count <= 2 ? 'minmax(200px, 1fr)' : count === 3 ? 'minmax(160px, 1fr)' : 'minmax(140px, 1fr)';

  return (
    <motion.div
      className="cc-projects-bubble-grid"
      layout
      style={{
        gridTemplateColumns: `repeat(auto-fit, ${colMin})`,
      }}
      initial={reduced ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {papers.map((paper, index) => {
        const isPublished = paper.isPublished === true;
        const editHref = `${basePath}/research/${paper.id}/edit`;
        return (
          <motion.div
            key={paper.id}
            layout
            initial={reduced ? false : { opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={editHref}
              className="cc-projects-bubble group"
              title={paper.title}
              aria-label={`Edit ${paper.title}`}
            >
              <div className="cc-projects-bubble__thumb">
                {paper.coverImageUrl ? (
                  <Image
                    src={paper.coverImageUrl}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 45vw, 220px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_25%_20%,rgba(147,130,255,0.28),transparent_30%),linear-gradient(135deg,#10093a,#030014)]">
                    <HiOutlineDocumentText className="h-10 w-10 text-lilac-white/80" aria-hidden />
                  </div>
                )}
              </div>
              <div className="cc-projects-bubble__meta">
                <p className="cc-fit-title cc-projects-bubble__title">{paper.title}</p>
                <span
                  className={`cc-projects-bubble__badge ${isPublished ? 'cc-projects-bubble__badge--live' : ''}`}
                >
                  {isPublished ? 'Live' : 'Draft'}
                </span>
              </div>
              <div className="cc-projects-bubble__tech-stack" aria-label={`${paper.title} details`}>
                <span className="cc-projects-bubble__tech-chip">
                  {paper.year ?? 'Year TBA'}
                </span>
                {paper.venue ? (
                  <span className="cc-projects-bubble__tech-chip">{paper.venue}</span>
                ) : null}
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { ContentOpeningLink } from '@/components/navigation/content-opening-transition';
import { ProjectTechLine } from '@/components/projects/project-tech-line';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export type RichProjectCard = {
  key: string;
  title: string;
  tagline?: string;
  subtitle: string;
  href: string;
  posterUrl?: string;
  videoUrl?: string;
  technologies?: string[];
  views?: number;
  stars?: number;
  updatedAt?: string;
  liveUrl?: string;
  repoUrl?: string;
};

export function ProjectCardRich({ card, index = 0 }: { card: RichProjectCard; index?: number }) {
  const reduced = useReducedMotion();

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: reduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="cc-dash-project-card group"
    >
      <ContentOpeningLink
        href={card.href}
        kind="project"
        itemTitle={card.title}
        aria-label={`Open project: ${card.title}`}
        className="block overflow-hidden rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-iris)]"
      >
        <div className="cc-dash-project-card__media relative aspect-[16/10] overflow-hidden bg-midnight">
          {card.posterUrl ? (
            <Image
              src={card.posterUrl}
              alt=""
              fill
              className="object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.02] motion-reduce:group-hover:scale-100"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          ) : null}
        </div>

        <div className="cc-dash-project-card__body px-3.5 py-3">
          <h3 className="break-words font-display text-[17px] leading-snug text-vellum">
            {card.title}
          </h3>
          <ProjectTechLine technologies={card.technologies ?? []} className="mt-1 text-lichen" />
        </div>
      </ContentOpeningLink>
    </motion.article>
  );
}

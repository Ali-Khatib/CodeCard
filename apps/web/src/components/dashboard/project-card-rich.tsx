'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
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
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="cc-dash-project-card group"
    >
      <Link href={card.href} className="block overflow-hidden rounded-[14px]">
        <div className="cc-dash-project-card__media relative aspect-[16/10] overflow-hidden">
          {card.posterUrl ? (
            <Image
              src={card.posterUrl}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-reactor/30 via-midnight to-void-canvas" />
          )}
          {card.videoUrl && !reduced && (
            <video
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100"
              src={card.videoUrl}
              muted
              loop
              playsInline
              preload="none"
              onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
              onFocus={(e) => void e.currentTarget.play().catch(() => {})}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-void-canvas via-void-canvas/20 to-transparent opacity-80" />
          <div className="absolute inset-0 bg-reactor/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />

          <div className="absolute left-3 top-3 flex gap-2">
            <span className="cc-dash-chip cc-dash-chip--status">{card.subtitle}</span>
            {card.updatedAt && (
              <span className="cc-dash-chip">{card.updatedAt}</span>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 translate-y-3 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
            <div className="flex flex-wrap gap-2">
              {card.liveUrl && (
                <span className="cc-dash-chip cc-dash-chip--action">Live demo</span>
              )}
              {card.repoUrl && (
                <span className="cc-dash-chip cc-dash-chip--action">GitHub</span>
              )}
              <span className="cc-dash-chip cc-dash-chip--action">Edit</span>
            </div>
          </div>
        </div>

        <div className="cc-dash-project-card__body p-4">
          <h3 className="break-words font-display text-[20px] leading-tight text-vellum transition-colors group-hover:text-reactorBright">
            {card.title}
          </h3>
          {card.tagline && (
            <p className="mt-1 break-words text-[14px] leading-snug text-lichen">{card.tagline}</p>
          )}

          {card.technologies && card.technologies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {card.technologies.slice(0, 5).map((tech) => (
                <span key={tech} className="cc-dash-tech-chip">
                  {tech}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-4 text-[12px] text-graphite">
            {card.views != null && <span>{card.views.toLocaleString()} views</span>}
            {card.stars != null && <span>★ {card.stars}</span>}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

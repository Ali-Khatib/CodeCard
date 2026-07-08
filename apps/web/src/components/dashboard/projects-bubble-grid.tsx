'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { PortfolioProject } from '@/lib/dashboard/portfolio';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const FALLBACK =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80';

export function ProjectsBubbleGrid({
  projects,
  basePath = '/dashboard',
}: {
  projects: PortfolioProject[];
  basePath?: string;
}) {
  const reduced = useReducedMotion();
  const count = projects.length;
  const colMin = count <= 2 ? 'minmax(200px, 1fr)' : count === 3 ? 'minmax(160px, 1fr)' : 'minmax(140px, 1fr)';

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
      {projects.map((project, index) => {
        const isPublished = project.isPublished !== false;
        return (
          <motion.div
            key={project.id}
            layout
            initial={reduced ? false : { opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={`${basePath}/projects/${project.id}`}
              className="cc-projects-bubble group"
              title={project.title}
            >
              <div className="cc-projects-bubble__thumb">
                <Image
                  src={project.posterUrl ?? FALLBACK}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 45vw, 220px"
                />
              </div>
              <div className="cc-projects-bubble__meta">
                <p className="cc-projects-bubble__title">{project.title}</p>
                <span
                  className={`cc-projects-bubble__badge ${isPublished ? 'cc-projects-bubble__badge--live' : ''}`}
                >
                  {isPublished ? 'Live' : 'Draft'}
                </span>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

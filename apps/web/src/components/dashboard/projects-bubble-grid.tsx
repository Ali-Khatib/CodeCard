'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { PortfolioProject } from '@/lib/dashboard/portfolio';
import { FadeInView } from './fade-in-view';

const FALLBACK =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80';

export function ProjectsBubbleGrid({
  projects,
  basePath = '/dashboard',
}: {
  projects: PortfolioProject[];
  basePath?: string;
}) {
  return (
    <div className="cc-projects-bubble-grid">
      {projects.map((project, index) => {
        const isPublished = project.isPublished !== false;
        return (
          <FadeInView key={project.id} delay={index * 0.04}>
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
                  sizes="(max-width: 640px) 33vw, 160px"
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
          </FadeInView>
        );
      })}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ProjectMedia } from '@/components/profile/project-media';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { TYPE } from '@/lib/design/tokens';
import type { PortfolioProject } from '@/lib/dashboard/portfolio';

type DashboardProjectShowcaseProps = {
  project: PortfolioProject;
  index?: number;
};

export function DashboardProjectShowcase({ project, index = 0 }: DashboardProjectShowcaseProps) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const showVideo = hovered && videoReady && project.videoUrl && !reduced;

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-[1100px]"
      onMouseEnter={() => {
        setHovered(true);
        if (project.videoUrl && videoRef.current && !reduced) {
          void videoRef.current.play().catch(() => {});
        }
      }}
      onMouseLeave={() => {
        setHovered(false);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
    >
      <Link
        href={project.href}
        className="group cc-instant-press block outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-void-canvas active:scale-[0.99]"
      >
        <div
          className={`relative overflow-hidden bg-midnight shadow-rim transition-shadow duration-300 ${
            hovered ? 'shadow-[0_0_0_1px_rgba(139,92,246,0.28),0_32px_80px_-24px_rgba(0,0,0,0.55)]' : ''
          }`}
          style={{ borderRadius: '16px' }}
        >
          <div
            className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/10]"
            style={{ borderRadius: '16px' }}
          >
            <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.02]">
              {project.posterUrl && (
                <ProjectMedia
                  src={project.posterUrl}
                  className="transition-opacity duration-500"
                  style={{ opacity: showVideo ? 0 : 1 }}
                  sizes="(max-width: 768px) 100vw, 1100px"
                  priority={index === 0}
                />
              )}
              {!project.posterUrl && (
                <div className="absolute inset-0 bg-gradient-to-br from-reactor/35 via-midnight to-void-canvas" />
              )}
              {project.videoUrl && (
                <video
                  ref={videoRef}
                  src={project.videoUrl}
                  muted
                  loop
                  playsInline
                  preload={index === 0 ? 'auto' : 'metadata'}
                  className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500"
                  style={{ opacity: showVideo ? 1 : 0 }}
                  onLoadedData={() => setVideoReady(true)}
                />
              )}
            </div>

            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-[linear-gradient(0deg,rgba(5,3,15,0.94)_0%,rgba(5,3,15,0.74)_38%,rgba(5,3,15,0.28)_72%,transparent_100%)]"
              style={{ borderRadius: '16px' }}
            />

            <div className="absolute inset-x-0 bottom-0 z-10 p-6 md:p-10">
              <div className="flex flex-wrap items-end gap-3">
                <h3 className={`cc-fit-title ${TYPE.projectTitle} text-lilac-white`}>{project.title}</h3>
                {project.isPublished === false && (
                  <span className="mb-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-200">
                    Draft
                  </span>
                )}
              </div>
              {project.tagline && (
                <p className="mt-3 max-w-[680px] text-[17px] font-medium leading-relaxed text-white/92 drop-shadow-[0_2px_12px_rgba(0,0,0,0.58)] md:text-[18px]">{project.tagline}</p>
              )}
              {project.technologies.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.technologies.slice(0, 6).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/35 bg-black/38 px-3 py-1.5 text-[12px] font-semibold text-white/90 shadow-[0_10px_26px_rgba(0,0,0,0.24)] backdrop-blur-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

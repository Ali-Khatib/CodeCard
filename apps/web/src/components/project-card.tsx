'use client';

import Image from 'next/image';
import { ContentOpeningLink } from '@/components/navigation/content-opening-transition';
import { ProjectTechLine } from '@/components/projects/project-tech-line';

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    tagline: string | null;
    technologies: string[];
    project_media_assets?: { type: string; storage_path: string }[];
  };
  profileSlug: string;
}

export function ProjectCard({ project, profileSlug }: ProjectCardProps) {
  const poster = project.project_media_assets?.find((asset) => asset.type === 'poster');
  const href = `/${profileSlug}/projects/${project.id}`;

  return (
    <ContentOpeningLink
      href={href}
      kind="project"
      itemTitle={project.title}
      aria-label={`Open project: ${project.title}`}
      className="group block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 outline-none transition-colors duration-200 hover:border-zinc-600 focus-visible:ring-2 focus-visible:ring-violet-400"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-800">
        {poster ? (
          <Image
            src={poster.storage_path}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
          />
        ) : null}
      </div>
      <div className="px-3.5 py-3">
        <h3 className="break-words text-[17px] font-medium leading-snug">{project.title}</h3>
        <ProjectTechLine technologies={project.technologies} className="mt-1 text-zinc-400" />
      </div>
    </ContentOpeningLink>
  );
}

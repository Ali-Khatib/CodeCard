import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@codecard/ui';

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
  const poster = project.project_media_assets?.find((a) => a.type === 'poster');
  const heroVideo = project.project_media_assets?.find((a) => a.type === 'hero_video');

  return (
    <Link
      href={`/${profileSlug}/projects/${project.id}`}
      className="group block animate-slide-up overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 transition-all duration-300 hover:border-zinc-600 hover:shadow-lg hover:shadow-violet-500/5"
    >
      {(poster || heroVideo) && (
        <div className="relative aspect-video overflow-hidden bg-zinc-800">
          {poster && (
            <Image
              src={poster.storage_path}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          )}
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold transition-colors group-hover:text-violet-300">
          {project.title}
        </h3>
        {project.tagline && (
          <p className="mt-2 text-sm text-zinc-400">{project.tagline}</p>
        )}
        {project.technologies.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.technologies.slice(0, 6).map((tech) => (
              <Badge key={tech}>{tech}</Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

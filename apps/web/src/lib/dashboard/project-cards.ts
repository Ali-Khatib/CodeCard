import type { RichProjectCard } from '@/components/dashboard/project-card-rich';
import type { FeaturedProject } from '@/lib/projects/featured';

type DbProject = {
  id: string;
  title: string;
  tagline: string | null;
  is_published: boolean;
  technologies?: string[] | null;
  updated_at?: string | null;
};

export function dbProjectToRichCard(project: DbProject): RichProjectCard {
  return {
    key: project.id,
    title: project.title,
    tagline: project.tagline ?? undefined,
    subtitle: project.is_published ? 'Published · featured' : 'Draft',
    href: `/dashboard/projects/${project.id}`,
    technologies: project.technologies ?? [],
    views: Math.floor(Math.random() * 400) + 50,
    stars: Math.floor(Math.random() * 80) + 5,
    updatedAt: project.updated_at
      ? new Date(project.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : undefined,
  };
}

export function featuredToRichCard(project: FeaturedProject, href?: string): RichProjectCard {
  const live = project.links?.find((l) => l.type === 'live' || l.type === 'demo');
  const repo = project.links?.find((l) => l.type === 'repo');
  return {
    key: project.id,
    title: project.title,
    tagline: project.tagline ?? undefined,
    subtitle: 'Published · featured',
    href: href ?? `/dashboard/projects/new`,
    posterUrl: project.posterUrl ?? undefined,
    videoUrl: project.videoUrl ?? undefined,
    technologies: project.technologies,
    views: 280 + Math.floor(Math.random() * 200),
    stars: 12 + Math.floor(Math.random() * 40),
    liveUrl: live?.url,
    repoUrl: repo?.url,
  };
}

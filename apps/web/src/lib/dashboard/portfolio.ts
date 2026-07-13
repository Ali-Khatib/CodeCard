import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { parseHeadline } from '@/lib/profile/lanyard-badge-images';
import { firstSafeProjectLink } from '@/lib/projects/safe-project-link-url';
import type { FeaturedProject } from '@/lib/projects/featured';
import { normalizeFeaturedProject } from '@/lib/projects/featured';

export type PortfolioCreator = {
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  role: string;
  company: string | null;
  location?: string | null;
  followers?: number;
  links: ProfileLinkItem[];
  profileSlug?: string | null;
};

export type PortfolioProject = {
  id: string;
  title: string;
  tagline?: string;
  description?: string;
  href: string;
  posterUrl?: string;
  videoUrl?: string;
  technologies: string[];
  views?: number;
  saves?: number;
  liveUrl?: string;
  repoUrl?: string;
  screenshots?: string[];
  isPublished?: boolean;
};

type DbProfile = {
  display_name: string;
  headline: string | null;
  avatar_url: string | null;
  slug?: string | null;
  location?: string | null;
};

type DbProject = {
  id: string;
  title: string;
  tagline: string | null;
  description?: string | null;
  is_published: boolean;
  technologies?: string[] | null;
  case_study_sections?: unknown;
  project_media_assets?: { type: string; storage_path: string; sort_order?: number }[];
  project_links?: { type: string; label: string | null; url: string }[];
};

export function profileToPortfolioCreator(
  profile: DbProfile,
  links: ProfileLinkItem[],
  extras?: Partial<Pick<PortfolioCreator, 'location' | 'followers'>>,
): PortfolioCreator {
  const { role, company } = parseHeadline(profile.headline);
  return {
    displayName: profile.display_name,
    headline: profile.headline,
    avatarUrl: profile.avatar_url,
    role,
    company,
    links,
    profileSlug: profile.slug ?? null,
    location: extras?.location ?? profile.location ?? null,
    followers: extras?.followers ?? 0,
  };
}

export function dbProjectToPortfolioProject(
  project: DbProject,
  options?: {
    resolveStoragePath?: (storagePath: string) => string;
  },
): PortfolioProject {
  const featured = normalizeFeaturedProject(
    {
      ...project,
      description: project.description ?? null,
      technologies: project.technologies ?? [],
    },
    options,
  );
  const live = firstSafeProjectLink(featured.links, ['live', 'demo']);
  const repo = firstSafeProjectLink(featured.links, ['repo']);

  return {
    id: project.id,
    title: project.title,
    tagline: project.tagline ?? undefined,
    description: project.description ?? featured.description ?? undefined,
    href: `/dashboard/projects/${project.id}`,
    posterUrl: featured.posterUrl ?? undefined,
    videoUrl: featured.videoUrl ?? undefined,
    technologies: featured.technologies,
    views: 120 + Math.floor(Math.random() * 280),
    saves: 8 + Math.floor(Math.random() * 40),
    liveUrl: live?.url,
    repoUrl: repo?.url,
    screenshots: featured.screenshots,
    isPublished: project.is_published,
  };
}

export function featuredToPortfolioProject(
  project: FeaturedProject,
  href?: string,
): PortfolioProject {
  const live = firstSafeProjectLink(project.links, ['live', 'demo']);
  const repo = firstSafeProjectLink(project.links, ['repo']);

  return {
    id: project.id,
    title: project.title,
    tagline: project.tagline ?? undefined,
    description: project.description ?? undefined,
    href: href ?? `/dashboard/projects/${project.id}`,
    posterUrl: project.posterUrl ?? undefined,
    videoUrl: project.videoUrl ?? undefined,
    technologies: project.technologies,
    views: 280 + Math.floor(Math.random() * 200),
    saves: 12 + Math.floor(Math.random() * 40),
    liveUrl: live?.url,
    repoUrl: repo?.url,
    screenshots: project.screenshots,
    isPublished: true,
  };
}

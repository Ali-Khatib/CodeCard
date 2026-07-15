import { parseCaseStudySections, type CaseStudySections } from '@/lib/projects/case-study-sections.shared';
import { toSafeProjectLinkItems } from '@/lib/projects/safe-project-link-url';

export type { CaseStudySections };

export interface FeaturedProjectLink {
  type: string;
  label: string | null;
  url: string;
}

export interface FeaturedProject {
  id: string;
  title: string;
  tagline: string | null;
  description: string | null;
  technologies: string[];
  domains: string[];
  focusAreas: string[];
  posterUrl: string | null;
  videoUrl: string | null;
  links: FeaturedProjectLink[];
  screenshots: string[];
  caseStudySections: CaseStudySections;
}

export function normalizeFeaturedProject(
  project: {
  id: string;
  title: string;
  tagline: string | null;
  description: string | null;
  technologies: string[];
  case_study_sections?: unknown;
  project_domains?: { name: string }[];
  project_focus_areas?: { name: string }[];
  project_media_assets?: {
    type: string;
    storage_path: string;
    sort_order?: number;
  }[];
  project_links?: { type: string; label: string | null; url: string; sort_order?: number }[];
},
  options?: {
    resolveStoragePath?: (storagePath: string) => string;
  },
): FeaturedProject {
  const resolveStoragePath = options?.resolveStoragePath ?? ((path: string) => path);
  const resolve = (path: string) => {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    return resolveStoragePath(path);
  };
  const assets = project.project_media_assets ?? [];
  const posterAsset = assets.find((a) => a.type === 'poster');
  const screenshotAssets = assets
    .filter((a) => a.type === 'screenshot')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return {
    id: project.id,
    title: project.title,
    tagline: project.tagline,
    description: project.description,
    technologies: project.technologies ?? [],
    domains: (project.project_domains ?? []).map((d) => d.name),
    focusAreas: (project.project_focus_areas ?? []).map((f) => f.name),
    posterUrl: posterAsset?.storage_path ? resolve(posterAsset.storage_path) : null,
    videoUrl: assets.find((a) => a.type === 'hero_video')?.storage_path
      ? resolve(assets.find((a) => a.type === 'hero_video')!.storage_path)
      : null,
    links: toSafeProjectLinkItems(
      [...(project.project_links ?? [])]
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((l) => ({
          type: l.type,
          label: l.label,
          url: l.url,
        })),
    ),
    screenshots: screenshotAssets
      .map((a) => a.storage_path)
      .filter(Boolean)
      .map((path) => resolve(path)),
    caseStudySections: parseCaseStudySections(project.case_study_sections),
  };
}

export function collectFilterOptions(projects: FeaturedProject[]) {
  const domains = new Set<string>();
  const focusAreas = new Set<string>();
  for (const p of projects) {
    p.domains.forEach((d) => domains.add(d));
    p.focusAreas.forEach((f) => focusAreas.add(f));
  }
  return {
    domains: [...domains].sort(),
    focusAreas: [...focusAreas].sort(),
  };
}

export function filterProjects(
  projects: FeaturedProject[],
  domain: string | null,
  focusArea: string | null,
): FeaturedProject[] {
  return projects.filter((p) => {
    if (domain && !p.domains.includes(domain)) return false;
    if (focusArea && !p.focusAreas.includes(focusArea)) return false;
    return true;
  });
}

/** Linear interpolate */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/** Proximity to viewport vertical center (0 = far, 1 = centered) */
export function centerProximity(rect: DOMRect, viewportHeight: number): number {
  const cardCenter = rect.top + rect.height / 2;
  const viewportCenter = viewportHeight / 2;
  const distance = Math.abs(cardCenter - viewportCenter);
  const falloff = viewportHeight * 0.55;
  return Math.max(0, 1 - distance / falloff);
}

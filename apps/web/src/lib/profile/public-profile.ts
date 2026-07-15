import { SLUG_REGEX } from '@codecard/validation';
import type { Metadata } from 'next';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { normalizeFeaturedProject, type FeaturedProject } from '@/lib/projects/featured';
import { createProjectMediaUrlResolver } from '@/lib/projects/project-media-url';
import {
  loadProfileProjectOrderings,
  sortProjectsByEffectiveOrder,
} from '@/lib/projects/project-order-core';
import {
  buildPublicProfileMetadata,
  buildUnavailablePublicMetadata,
} from '@/lib/profile/public-metadata';
import { toSafeProfileLinkItems } from '@/lib/profile/safe-profile-link-url';
import {
  normalizeResearchPaper,
  type ResearchPaper,
} from '@/lib/research/research';
import { sortResearchBySortOrder } from '@/lib/research/research-order-core';
import { createResearchFigureUrlResolver } from '@/lib/research/research-figure-url';

/** Explicit public profile columns — never select `profiles.*` for visitor pages. */
export const PUBLIC_PROFILE_SELECT =
  'id, slug, display_name, headline, bio, avatar_url, location, is_public';

export const PUBLIC_PROFILE_LINK_SELECT = 'type, label, url, sort_order';

export const PUBLIC_PROFILE_PROJECT_SELECT = `
  id, title, tagline, description, technologies, case_study_sections, sort_order, created_at, is_published,
  project_domains(name),
  project_focus_areas(name),
  project_media_assets(type, storage_path, sort_order),
  project_links(type, label, url, sort_order)
`;

export const PUBLIC_PROFILE_RESEARCH_SELECT = `
  id, slug, title, abstract, authors, venue, publication_status, year, pdf_url, doi_url, citation_text, tags, cover_image_url, related_project_id, sort_order, created_at, is_published,
  research_figures(id, image_url, storage_path, caption, sort_order),
  related_project:related_project_id(id, title, is_published)
`;

export const FORBIDDEN_PUBLIC_PROFILE_KEYS = [
  'tenant_id',
  'owner_user_id',
  'email',
  'plan',
  'stripe_customer_id',
  'role',
  'membership_role',
  'is_admin',
  'skills',
] as const;

export type PublicProfilePayload = {
  profileId: string;
  profileSlug: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  links: ProfileLinkItem[];
  projects: FeaturedProject[];
  researchPapers: ResearchPaper[];
};

/** Normalize a public slug candidate. Returns null when the slug cannot be a public handle. */
export function normalizePublicProfileSlug(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().toLowerCase();
  if (!normalized || normalized.length < 3 || !SLUG_REGEX.test(normalized)) return null;
  return normalized;
}

export function assertNoForbiddenPublicKeys(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return [];
  const found: string[] = [];
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if ((FORBIDDEN_PUBLIC_PROFILE_KEYS as readonly string[]).includes(key)) {
        found.push(key);
      }
      visit(child);
    }
  };
  visit(payload);
  return found;
}

type DbProjectRow = Parameters<typeof normalizeFeaturedProject>[0] & {
  is_published: boolean;
  created_at: string;
  sort_order: number;
};

type DbResearchRow = Parameters<typeof normalizeResearchPaper>[0] & {
  is_published: boolean;
  sort_order: number;
  created_at?: string | null;
};

/**
 * Load a visitor-safe public profile payload.
 * Draft projects/research are excluded before mapping. Explicit selects avoid `*`.
 */
export async function loadPublicProfileBySlug(
  supabase: SupabaseClient,
  rawSlug: string,
): Promise<PublicProfilePayload | null> {
  const slug = normalizePublicProfileSlug(rawSlug);
  if (!slug) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      `
      ${PUBLIC_PROFILE_SELECT},
      profile_links(${PUBLIC_PROFILE_LINK_SELECT}),
      projects(${PUBLIC_PROFILE_PROJECT_SELECT}),
      research_papers(${PUBLIC_PROFILE_RESEARCH_SELECT})
    `,
    )
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle();

  if (error || !profile || profile.is_public !== true) {
    return null;
  }

  const orderings = await loadProfileProjectOrderings(supabase, profile.id);
  const publishedProjects = sortProjectsByEffectiveOrder(
    ((profile.projects ?? []) as unknown as DbProjectRow[]).filter(
      (project) => project.is_published === true,
    ),
    orderings,
  );

  const resolveMediaUrl = createProjectMediaUrlResolver(supabase);
  const projects = publishedProjects.map((project) =>
    normalizeFeaturedProject(project, { resolveStoragePath: resolveMediaUrl }),
  );

  const resolveFigureUrl = createResearchFigureUrlResolver(supabase);
  const researchPapers = sortResearchBySortOrder(
    ((profile.research_papers ?? []) as unknown as DbResearchRow[]).filter(
      (paper) => paper.is_published === true,
    ),
  ).map((paper) => normalizeResearchPaper(paper, slug, { resolveFigureUrl }));

  const links = toSafeProfileLinkItems(
    ((profile.profile_links ?? []) as Array<{
      type: string;
      label: string | null;
      url: string;
      sort_order?: number | null;
    }>)
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((link) => ({
        type: link.type,
        label: link.label,
        url: link.url,
      })),
  );

  return {
    profileId: profile.id,
    profileSlug: profile.slug,
    displayName: profile.display_name,
    headline: profile.headline ?? null,
    avatarUrl: profile.avatar_url ?? null,
    bio: profile.bio ?? null,
    location: profile.location ?? null,
    links,
    projects,
    researchPapers,
  };
}

export function mapPublicProfileMetadata(
  profile: {
    display_name: string;
    headline: string | null;
    bio?: string | null;
    slug: string;
  } | null,
): Metadata {
  if (!profile) {
    return buildUnavailablePublicMetadata('profile');
  }

  return buildPublicProfileMetadata({
    profileSlug: profile.slug,
    displayName: profile.display_name,
    headline: profile.headline,
    bio: profile.bio,
  });
}

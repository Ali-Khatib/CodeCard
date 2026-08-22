import type { MetadataRoute } from 'next';
import { buildPublicProjectDetailHref } from '@/lib/projects/project-navigation';
import { buildPublicResearchPath } from '@/lib/profile/public-metadata';
import { createPublicClient } from '@/lib/supabase/server';

function appOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return 'http://localhost:3000';
  try {
    return new URL(raw).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

const STATIC_PATHS = [
  '/',
  '/pricing',
  '/how-it-works',
  '/profiles',
  '/research',
  '/sign-up',
  '/legal/privacy',
  '/legal/terms',
  '/legal/acceptable-use',
  '/legal/dmca',
  '/legal/subscription',
  '/legal/contact',
] as const;

type PublicProfileJoin = {
  slug: string | null;
  is_public: boolean | null;
};

function normalizePublicSlug(value: string | null | undefined): string | null {
  const slug = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!slug || slug === 'demo') return null;
  return slug;
}

async function loadPublishedProjectEntries(
  origin: string,
  now: Date,
): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('projects')
      .select('id, updated_at, profiles!inner(slug, is_public)')
      .eq('is_published', true)
      .eq('profiles.is_public', true)
      .order('updated_at', { ascending: false })
      .limit(5000);

    return (data ?? [])
      .map((row) => {
        const profile = row.profiles as PublicProfileJoin | PublicProfileJoin[] | null;
        const profileRow = Array.isArray(profile) ? profile[0] : profile;
        const slug = normalizePublicSlug(profileRow?.slug);
        if (!slug || typeof row.id !== 'string') return null;
        const path = buildPublicProjectDetailHref(slug, row.id);
        return {
          url: `${origin}${path}`,
          lastModified: row.updated_at ? new Date(String(row.updated_at)) : now,
          changeFrequency: 'monthly' as const,
          priority: 0.65,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry != null);
  } catch {
    return [];
  }
}

async function loadPublishedResearchEntries(
  origin: string,
  now: Date,
): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('research_papers')
      .select('slug, updated_at, profiles!inner(slug, is_public)')
      .eq('is_published', true)
      .eq('profiles.is_public', true)
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(5000);

    return (data ?? [])
      .map((row) => {
        const profile = row.profiles as PublicProfileJoin | PublicProfileJoin[] | null;
        const profileRow = Array.isArray(profile) ? profile[0] : profile;
        const profileSlug = normalizePublicSlug(profileRow?.slug);
        const paperSlug = normalizePublicSlug(row.slug);
        if (!profileSlug || !paperSlug) return null;
        const path = buildPublicResearchPath(profileSlug, paperSlug);
        return {
          url: `${origin}${path}`,
          lastModified: row.updated_at ? new Date(String(row.updated_at)) : now,
          changeFrequency: 'monthly' as const,
          priority: 0.65,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry != null);
  } catch {
    return [];
  }
}

/**
 * Indexable public routes + published CodeCard profile URLs.
 * Private dashboards/admin/settings are intentionally omitted.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = appOrigin();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${origin}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path.startsWith('/legal') ? 0.3 : 0.6,
  }));

  let profileEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('profiles')
      .select('slug, updated_at')
      .eq('is_public', true)
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(5000);

    profileEntries = (data ?? [])
      .map((row) => {
        const slug = normalizePublicSlug(row.slug);
        if (!slug) return null;
        return {
          url: `${origin}/${slug}`,
          lastModified: row.updated_at ? new Date(String(row.updated_at)) : now,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry != null);
  } catch {
    // Build/preview without Supabase still ships static URLs.
    profileEntries = [];
  }

  const [projectEntries, researchEntries] = await Promise.all([
    loadPublishedProjectEntries(origin, now),
    loadPublishedResearchEntries(origin, now),
  ]);

  const seen = new Set<string>();
  const merged: MetadataRoute.Sitemap = [];
  for (const entry of [
    ...staticEntries,
    ...profileEntries,
    ...projectEntries,
    ...researchEntries,
  ]) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    merged.push(entry);
  }
  return merged;
}

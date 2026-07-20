import type { Metadata } from 'next';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/server';
import {
  loadPublicProfileBySlug,
  mapPublicProfileMetadata,
  normalizePublicProfileSlug,
} from '@/lib/profile/public-profile';
import { publicProfileCacheTag } from '@/lib/profile/public-cache';
import { PublicProfileExperience } from '@/components/profile/public-profile-experience';
import { ProfileAnalytics } from '@/components/profile-analytics';
import { VisitorConversionMarker } from '@/components/visitor-conversion/visitor-conversion-marker';
interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Slug-keyed data cache. Tags match `publicProfileCacheTag()` so
 * `revalidatePublicProfile` invalidates both HTML (revalidatePath) and payload.
 * `dynamicParams = true` keeps unknown slugs resolvable; only alex-chen is prerendered.
 */
async function loadCachedPublicProfileForSlug(slug: string) {
  const tag = publicProfileCacheTag(slug);
  if (!tag) return null;
  return unstable_cache(
    async () => loadPublicProfileBySlug(createPublicClient(), slug),
    ['public-profile-by-slug', slug],
    { revalidate: 60, tags: [tag] },
  )();
}

/** Per-request dedupe between generateMetadata and the page. */
const loadPublicProfileCached = cache(async (rawSlug: string) => {
  const slug = normalizePublicProfileSlug(rawSlug);
  if (!slug) return null;
  return loadCachedPublicProfileForSlug(slug);
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const payload = await loadPublicProfileCached(rawSlug);
  if (!payload) {
    return mapPublicProfileMetadata(null);
  }

  return mapPublicProfileMetadata({
    slug: payload.profileSlug,
    display_name: payload.displayName,
    headline: payload.headline,
    bio: payload.bio,
  });
}

/** Must be a literal for Next.js segment config; keep equal to PUBLIC_CACHE_SECONDS. */
export const revalidate = 60;

/** Prefer static HTML for anonymous public profiles (WS14-T019). */
export const dynamic = 'force-static';
export const dynamicParams = true;

export async function generateStaticParams() {
  // Representative staging showcase — other public slugs still on-demand static.
  return [{ slug: 'alex-chen' }];
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  // Anonymous ISR path: cookie-free public client + cached loader on the critical render.
  // Connection chrome resolves on the client after paint (WS14-T019).
  const payload = await loadPublicProfileCached(rawSlug);

  if (!payload) notFound();

  return (
    <>
      <ProfileAnalytics profileId={payload.profileId} />
      <VisitorConversionMarker
        context="public_profile"
        referrer={payload.profileSlug}
        profileId={payload.profileId}
      />
      <PublicProfileExperience
        profileSlug={payload.profileSlug}
        displayName={payload.displayName}
        headline={payload.headline}
        avatarUrl={payload.avatarUrl}
        bio={payload.bio}
        links={payload.links}
        projects={payload.projects}
        researchPapers={payload.researchPapers}
        profileId={payload.profileId}
        location={payload.location}
        connectionControl={null}
      />
    </>
  );
}

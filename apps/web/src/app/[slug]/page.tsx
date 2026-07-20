import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/server';
import {
  loadPublicProfileBySlug,
  mapPublicProfileMetadata,
  normalizePublicProfileSlug,
} from '@/lib/profile/public-profile';
import { PublicProfileExperience } from '@/components/profile/public-profile-experience';
import { ProfileAnalytics } from '@/components/profile-analytics';
import { VisitorConversionMarker } from '@/components/visitor-conversion/visitor-conversion-marker';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = normalizePublicProfileSlug(rawSlug);
  if (!slug) {
    return mapPublicProfileMetadata(null);
  }

  const supabase = createPublicClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('slug, display_name, headline, bio')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle();

  if (!profile) {
    return mapPublicProfileMetadata(null);
  }

  return mapPublicProfileMetadata(profile);
}

/** Must be a literal for Next.js segment config; keep equal to PUBLIC_CACHE_SECONDS. */
export const revalidate = 60;

/**
 * Public profile (WS14-T019): cookie-free data load so `revalidate` can cache
 * anonymous HTML. Connection/auth UI hydrates on the client.
 */
export default async function PublicProfilePage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const supabase = createPublicClient();
  const payload = await loadPublicProfileBySlug(supabase, rawSlug);

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
        connectionControl={{
          isOwnProfile: false,
          isAuthenticated: false,
          initiallyConnected: false,
          initialConnectionId: null,
        }}
      />
    </>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
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

  const supabase = await createClient();
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

/** Avoid sticky host-keyed notFound cache after failed public loads (WS14-T019). */
export const dynamic = 'force-dynamic';

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const supabase = await createClient();
  const payload = await loadPublicProfileBySlug(supabase, rawSlug);

  if (!payload) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let connectionControl: {
    isOwnProfile: boolean;
    isAuthenticated: boolean;
    initiallyConnected: boolean;
    initialConnectionId: string | null;
  } | null = null;

  if (user) {
    const { data: viewerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    const isOwnProfile = viewerProfile?.id === payload.profileId;
    let initiallyConnected = false;
    let initialConnectionId: string | null = null;

    if (!isOwnProfile) {
      const { data: existing } = await supabase
        .from('saved_connections')
        .select('id')
        .eq('owner_user_id', user.id)
        .eq('saved_profile_id', payload.profileId)
        .maybeSingle();
      initiallyConnected = Boolean(existing);
      initialConnectionId = existing?.id ?? null;
    }

    connectionControl = {
      isOwnProfile,
      isAuthenticated: true,
      initiallyConnected,
      initialConnectionId,
    };
  } else {
    connectionControl = {
      isOwnProfile: false,
      isAuthenticated: false,
      initiallyConnected: false,
      initialConnectionId: null,
    };
  }

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
        connectionControl={connectionControl}
      />
    </>
  );
}

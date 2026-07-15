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

export const revalidate = 60;

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const supabase = await createClient();
  const payload = await loadPublicProfileBySlug(supabase, rawSlug);

  if (!payload) notFound();

  return (
    <>
      <ProfileAnalytics profileId={payload.profileId} />
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
      />
    </>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { normalizeFeaturedProject } from '@/lib/projects/featured';
import { normalizeResearchPaper } from '@/lib/research/research';
import { PublicProfileExperience } from '@/components/profile/public-profile-experience';
import { ProfileAnalytics } from '@/components/profile-analytics';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';

interface PageProps {
  params: Promise<{ slug: string }>;
}

type ResearchPaperRow = Parameters<typeof normalizeResearchPaper>[0] & {
  is_published: boolean;
  sort_order: number;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, headline')
    .eq('slug', slug)
    .eq('is_public', true)
    .single();

  if (!profile) return { title: 'Profile not found' };

  return {
    title: profile.display_name,
    description: profile.headline ?? `${profile.display_name} on CodeCard`,
  };
}

export const revalidate = 60;

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      `
      *,
      profile_links(*),
      projects(
        *,
        project_domains(*),
        project_focus_areas(*),
        project_media_assets(*),
        project_links(*)
      ),
      research_papers(
        *,
        research_figures(*),
        related_project:related_project_id(id, title)
      )
    `,
    )
    .eq('slug', slug)
    .eq('is_public', true)
    .single();

  if (!profile) notFound();

  const publishedProjects = (profile.projects ?? [])
    .filter((p: { is_published: boolean }) => p.is_published)
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);

  const featuredProjects = publishedProjects.map(normalizeFeaturedProject);
  const researchRows = (profile.research_papers ?? []) as ResearchPaperRow[];
  const publishedResearch = researchRows
    .filter((p: ResearchPaperRow) => p.is_published)
    .sort((a: ResearchPaperRow, b: ResearchPaperRow) => a.sort_order - b.sort_order)
    .map((paper: ResearchPaperRow) => normalizeResearchPaper(paper, slug));

  const links: ProfileLinkItem[] = (profile.profile_links ?? [])
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .map((l: { type: string; label: string | null; url: string }) => ({
      type: l.type,
      label: l.label,
      url: l.url,
    }));

  return (
    <>
      <ProfileAnalytics profileId={profile.id} />
      <PublicProfileExperience
        profileSlug={slug}
        displayName={profile.display_name}
        headline={profile.headline}
        avatarUrl={profile.avatar_url}
        bio={profile.bio}
        links={links}
        projects={featuredProjects}
        researchPapers={publishedResearch}
        profileId={profile.id}
        location={profile.location}
      />
    </>
  );
}

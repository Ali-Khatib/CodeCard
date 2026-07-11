import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { buildSignInHref } from '@/lib/auth/session-expiry';
import { normalizeFeaturedProject } from '@/lib/projects/featured';
import { normalizeResearchPaper } from '@/lib/research/research';
import { PublicProfileExperience } from '@/components/profile/public-profile-experience';
import { ProfileAnalytics } from '@/components/profile-analytics';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Profile preview',
  robots: { index: false, follow: false },
};

type ResearchPaperRow = Parameters<typeof normalizeResearchPaper>[0] & {
  is_published: boolean;
  sort_order: number;
};

export default async function OwnerProfilePreviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildSignInHref('/dashboard/profile/preview', 'session_expired'));
  }

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
    .eq('owner_user_id', user.id)
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
    .map((paper: ResearchPaperRow) => normalizeResearchPaper(paper, profile.slug));

  const links: ProfileLinkItem[] = (profile.profile_links ?? [])
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .map((l: { type: string; label: string | null; url: string }) => ({
      type: l.type,
      label: l.label,
      url: l.url,
    }));

  return (
    <>
      <div className="border-b border-[var(--app-border)] bg-[var(--app-bone)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-[var(--app-smoke)]">
            <span className="font-medium text-[var(--app-ink)]">Preview</span>
            {' — '}
            {profile.is_public
              ? 'Showing your saved published profile.'
              : 'Only you can see this unpublished preview.'}
          </p>
          <Link href="/dashboard" className="text-sm font-medium text-[var(--app-ink)] underline">
            Back to dashboard
          </Link>
        </div>
      </div>
      {profile.is_public && <ProfileAnalytics profileId={profile.id} />}
      <PublicProfileExperience
        profileSlug={profile.slug}
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

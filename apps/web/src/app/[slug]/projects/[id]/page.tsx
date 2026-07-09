import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { normalizeFeaturedProject } from '@/lib/projects/featured';
import { ProjectDetailView } from '@/components/featured-work/project-detail-view';
import { ProfileAnalytics } from '@/components/profile-analytics';

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export const revalidate = 60;

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, slug')
    .eq('slug', slug)
    .eq('is_public', true)
    .single();

  if (!profile) notFound();

  const { data: projectRows } = await supabase
    .from('projects')
    .select(
      `
      *,
      project_domains(*),
      project_focus_areas(*),
      project_media_assets(*),
      project_links(*)
    `,
    )
    .eq('profile_id', profile.id)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  const project = projectRows?.find((row) => row.id === id);
  if (!project) notFound();

  const featured = normalizeFeaturedProject(project);
  const featuredProjects = (projectRows ?? []).map(normalizeFeaturedProject);

  return (
    <>
      <ProfileAnalytics profileId={profile.id} />
      <ProjectDetailView
        project={featured}
        profileSlug={slug}
        profileId={profile.id}
        displayName={profile.display_name}
        projects={featuredProjects}
      />
    </>
  );
}

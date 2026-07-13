import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { normalizeFeaturedProject } from '@/lib/projects/featured';
import { createProjectMediaUrlResolver } from '@/lib/projects/project-media-url';
import {
  loadProfileProjectOrderings,
  sortProjectsByEffectiveOrder,
} from '@/lib/projects/project-order-core';
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
    .eq('is_published', true);

  const orderings = await loadProfileProjectOrderings(supabase, profile.id);
  const orderedRows = sortProjectsByEffectiveOrder(projectRows ?? [], orderings);

  const project = orderedRows.find((row) => row.id === id);
  if (!project) notFound();

  const resolveMediaUrl = createProjectMediaUrlResolver(supabase);
  const featured = normalizeFeaturedProject(project, { resolveStoragePath: resolveMediaUrl });
  const featuredProjects = orderedRows.map((row) =>
    normalizeFeaturedProject(row, { resolveStoragePath: resolveMediaUrl }),
  );

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

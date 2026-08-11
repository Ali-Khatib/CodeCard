import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ProjectDetailView } from '@/components/featured-work/project-detail-view';
import { buildSignInHref } from '@/lib/auth/session-expiry';
import { normalizeFeaturedProject } from '@/lib/projects/featured';
import { loadOwnedProject } from '@/lib/projects/project-access-core';
import {
  loadProfileProjectOrderings,
  sortProjectsByEffectiveOrder,
} from '@/lib/projects/project-order-core';
import { createProjectMediaUrlResolver } from '@/lib/projects/project-media-url';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Project preview',
  robots: { index: false, follow: false },
};

export default async function OwnerProjectPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildSignInHref(`/dashboard/projects/${id}/preview`, 'session_expired'));
  }

  const owned = await loadOwnedProject(supabase, {
    userId: user.id,
    projectId: id,
  });

  if ('error' in owned) {
    notFound();
  }

  const { profile, project: ownedProject } = owned;

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('display_name, slug')
    .eq('id', profile.id)
    .single();

  const profileSlug = profileRow?.slug ?? profile.slug;
  if (!profileSlug) {
    notFound();
  }

  const { data: projectRows } = await supabase
    .from('projects')
    .select(
      `
      id, title, tagline, description, technologies, case_study_sections, sort_order, created_at, is_published,
      project_domains(name),
      project_focus_areas(name),
      project_media_assets(type, storage_path, sort_order),
      project_links(type, label, url, sort_order)
    `,
    )
    .eq('profile_id', profile.id)
    .eq('owner_user_id', user.id);

  const orderings = await loadProfileProjectOrderings(supabase, profile.id);
  const orderedRows = sortProjectsByEffectiveOrder(projectRows ?? [], orderings);
  const project = orderedRows.find((row) => row.id === id);
  if (!project) {
    notFound();
  }

  const resolveMediaUrl = createProjectMediaUrlResolver(supabase);
  const featured = normalizeFeaturedProject(project, { resolveStoragePath: resolveMediaUrl });

  const isLivePublic = ownedProject.is_published && profile.is_public;

  return (
    <>
      <div className="border-b border-[var(--app-border)] bg-[var(--app-bone)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-[var(--app-smoke)]">
            <span className="font-medium text-[var(--app-ink)]">Preview</span>
            {' — '}
            {isLivePublic
              ? 'This is how visitors see this project.'
              : 'Only you can see this preview until the project and profile are public.'}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/dashboard/projects/${id}/edit`}
              className="text-sm font-medium text-[var(--app-ink)] underline"
            >
              Edit project
            </Link>
            <Link href="/dashboard/projects" className="text-sm font-medium text-[var(--app-ink)] underline">
              Back to projects
            </Link>
          </div>
        </div>
      </div>
      <ProjectDetailView
        project={featured}
        profileSlug={profileSlug}
        profileId={profile.id}
        displayName={profileRow?.display_name ?? 'You'}
        projects={[featured]}
        backHref="/dashboard/projects"
      />
    </>
  );
}

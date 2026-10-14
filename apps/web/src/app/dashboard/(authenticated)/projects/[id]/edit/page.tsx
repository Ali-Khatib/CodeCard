import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProjectForm } from '@/components/dashboard/project-form';
import { ProjectLinksEditor } from '@/components/dashboard/project-links-editor';
import { ProjectMediaUpload } from '@/components/dashboard/project-media-upload';
import { ProjectPublishControls } from '@/components/dashboard/project-publish-controls';
import { ProjectDeleteDialog } from '@/components/dashboard/project-delete-dialog';
import { loadOwnedProjectWithRelations } from '@/lib/projects/project-access-core';
import { loadOwnedProjectLinksForProject } from '@/lib/projects/project-link-core';
import { loadOwnedProjectMediaAssets } from '@/lib/projects/project-media-core';
import { createProjectMediaUrlResolver } from '@/lib/projects/project-media-url';
import { projectRecordToFormValues } from '@/lib/projects/project-form';
import { createClient } from '@/lib/supabase/server';

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const fromFirstProject = from === 'first-project';
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const loaded = await loadOwnedProjectWithRelations(supabase, {
    userId: user.id,
    projectId: id,
  });

  if ('error' in loaded) {
    notFound();
  }

  const initialValues = projectRecordToFormValues(loaded.project, {
    domains: loaded.domains,
    focus_areas: loaded.focus_areas,
  });

  const linksResult = await loadOwnedProjectLinksForProject(supabase, {
    userId: user.id,
    projectId: id,
  });
  const projectLinks = 'error' in linksResult ? [] : linksResult;

  const mediaResult = await loadOwnedProjectMediaAssets(supabase, {
    userId: user.id,
    projectId: id,
  });
  const mediaAssets = 'error' in mediaResult ? [] : mediaResult.assets;
  const resolveMediaUrl = createProjectMediaUrlResolver(supabase);
  const cover = mediaAssets.find((asset) => asset.type === 'poster') ?? null;
  const screenshots = mediaAssets
    .filter((asset) => asset.type === 'screenshot')
    .sort((a, b) => a.sort_order - b.sort_order);
  const screenshotUrls = Object.fromEntries(
    screenshots.map((asset) => [asset.id, resolveMediaUrl(asset.storage_path)]),
  );

  return (
    <div className="cc-container cc-content py-8 md:py-12">
      <div className="cc-composer mb-8">
        <Link href="/dashboard/work" className="cc-composer__back">
          ← Back to Work
        </Link>
        <p className="cc-create-intro__kicker">Edit project</p>
        <h1 className="cc-composer__title">{loaded.project.title}</h1>
        <p className="cc-create-intro__after">
          {fromFirstProject
            ? 'This is your first project. Finish the details here, then open Work. Publishing your CodeCard is the next step.'
            : 'Cover and screenshots first, then the details. Save at the bottom.'}
        </p>
      </div>
      <ProjectMediaUpload
        projectId={id}
        projectTitle={loaded.project.title}
        projectTagline={loaded.project.tagline ?? ''}
        cover={cover}
        coverUrl={cover ? resolveMediaUrl(cover.storage_path) : null}
        screenshots={screenshots}
        screenshotUrls={screenshotUrls}
      />
      <ProjectLinksEditor projectId={id} links={projectLinks} />
      <ProjectPublishControls
        projectId={id}
        isPublished={loaded.project.is_published}
        profileIsPublic={loaded.profile.is_public}
      />
      <ProjectForm mode="edit" projectId={id} initialValues={initialValues} />
      <ProjectDeleteDialog projectId={id} projectTitle={loaded.project.title} />
    </div>
  );
}

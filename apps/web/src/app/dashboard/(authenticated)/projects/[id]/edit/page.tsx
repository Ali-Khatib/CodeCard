import { notFound } from 'next/navigation';
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      <div className="mb-8 max-w-[720px]">
        <p className="font-eyebrow text-[10px] uppercase tracking-[0.18em] text-lavender/80">
          Edit project
        </p>
        <h1 className="mt-3 text-[28px] font-medium tracking-[-0.03em] text-[var(--app-ink)] md:text-[36px]">
          {loaded.project.title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ash">
          Update your project details and save your changes.
        </p>
      </div>
      <ProjectForm mode="edit" projectId={id} initialValues={initialValues} />
      <ProjectMediaUpload
        projectId={id}
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
      <ProjectDeleteDialog projectId={id} projectTitle={loaded.project.title} />
    </div>
  );
}

import { notFound } from 'next/navigation';
import { ResearchEditForm } from '@/components/dashboard/research-edit-form';
import { ResearchDeleteDialog } from '@/components/dashboard/research-delete-dialog';
import { ResearchPublishControls } from '@/components/dashboard/research-publish-controls';
import { loadOwnedResearchPaper } from '@/lib/research/research-access-core';
import { researchRecordToFormValues } from '@/lib/research/research-form';
import { createClient } from '@/lib/supabase/server';

export default async function EditResearchPage({
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

  const loaded = await loadOwnedResearchPaper(supabase, {
    userId: user.id,
    researchPaperId: id,
  });

  if ('error' in loaded) {
    notFound();
  }

  const initialValues = researchRecordToFormValues(loaded.paper);

  return (
    <div className="cc-container cc-content py-8 md:py-12">
      <div className="mb-8 max-w-[720px]">
        <p className="font-eyebrow text-[10px] uppercase tracking-[0.18em] text-lavender/80">
          Edit research
        </p>
        <h1 className="mt-3 text-[28px] font-medium tracking-[-0.03em] text-[var(--app-ink)] md:text-[36px]">
          {loaded.paper.title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ash">
          Update core details for this paper. Use the visibility controls below to publish or
          unpublish.
        </p>
      </div>
      <ResearchEditForm
        researchPaperId={id}
        initialValues={initialValues}
        isPublished={loaded.paper.is_published}
      />
      <ResearchPublishControls
        researchPaperId={id}
        paperSlug={loaded.paper.slug}
        isPublished={loaded.paper.is_published}
        profileIsPublic={loaded.profile.is_public}
        profileSlug={loaded.profile.slug}
      />
      <ResearchDeleteDialog researchPaperId={id} paperTitle={loaded.paper.title} />
    </div>
  );
}

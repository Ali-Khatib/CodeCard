import { notFound } from 'next/navigation';
import { ProjectForm } from '@/components/dashboard/project-form';
import { loadOwnedProjectWithRelations } from '@/lib/projects/project-access-core';
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
    </div>
  );
}

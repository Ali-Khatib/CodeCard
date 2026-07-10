'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createProjectSchema } from '@codecard/validation';
import { createClient } from '@/lib/supabase/server';

export type CreateProjectState = {
  error?: string;
};

export async function createProjectAction(
  _prev: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in to create a project.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, slug')
    .eq('owner_user_id', user.id)
    .single();

  if (!profile) {
    return { error: 'Profile not found. Finish sign-up before creating a project.' };
  }

  const enabledSections = formData.getAll('enabled_section').map(String);
  const caseStudySections: Record<string, string> = {};

  for (const sectionId of enabledSections) {
    const body = String(formData.get(`section_${sectionId}`) ?? '').trim();
    if (body) caseStudySections[sectionId] = body;
  }

  const parsed = createProjectSchema.safeParse({
    title: formData.get('title'),
    tagline: formData.get('tagline') || null,
    description: formData.get('description') || null,
    technologies: String(formData.get('technologies') ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    is_published: formData.get('is_published') === 'on',
    case_study_sections: caseStudySections,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid project details.' };
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      tenant_id: profile.tenant_id,
      profile_id: profile.id,
      owner_user_id: user.id,
      title: parsed.data.title,
      tagline: parsed.data.tagline ?? null,
      description: parsed.data.description ?? null,
      technologies: parsed.data.technologies,
      is_published: parsed.data.is_published,
      case_study_sections: parsed.data.case_study_sections ?? {},
    })
    .select('id')
    .single();

  if (error || !project) {
    return { error: error?.message ?? 'Could not create project.' };
  }

  revalidatePath('/dashboard/projects');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
    revalidatePath(`/${profile.slug}/projects/${project.id}`);
  }

  redirect(`/dashboard/projects`);
}

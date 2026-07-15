'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createProjectSchema } from '@codecard/validation';
import {
  CASE_STUDY_SECTION_IDS,
  type CaseStudySectionContent,
} from '@/lib/projects/case-study-sections.shared';
import { buildSignInHref } from '@/lib/auth/session-expiry';
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
    redirect(buildSignInHref('/dashboard/projects/new', 'session_expired'));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, slug')
    .eq('owner_user_id', user.id)
    .single();

  if (!profile) {
    return { error: 'Profile not found. Finish sign-up before creating a project.' };
  }

  const enabledSections = new Set(formData.getAll('enabled_section').map(String));
  const caseStudySections: Record<string, CaseStudySectionContent> = {};

  for (const sectionId of CASE_STUDY_SECTION_IDS) {
    if (!enabledSections.has(sectionId)) continue;

    const text = String(formData.get(`section_text_${sectionId}`) ?? '').trim();
    const mediaUrl =
      String(formData.get(`section_media_upload_${sectionId}`) ?? '').trim() ||
      String(formData.get(`section_media_${sectionId}`) ?? '').trim();

    if (!text && !mediaUrl) continue;

    caseStudySections[sectionId] = {
      ...(text ? { text } : {}),
      ...(mediaUrl ? { mediaUrl } : {}),
    };
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
  if (profile.slug && parsed.data.is_published) {
    const { revalidatePublicProject } = await import('@/lib/profile/public-cache');
    revalidatePublicProject(profile.slug, project.id);
  }

  redirect(`/dashboard/projects`);
}

import {
  createProjectInputSchema,
  findForbiddenCreateProjectFields,
  findForbiddenCreateProjectFormData,
  PROJECT_SLUG_TAKEN_MESSAGE,
  type CreateProjectInputPayload,
} from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { evaluateProjectCreationQuota } from '@/lib/projects/project-plan-core';
import { parseCaseStudySectionsFromFormData } from '@/lib/projects/project-form';

export type ProjectCreateFieldErrors = Partial<
  Record<
    | 'title'
    | 'slug'
    | 'tagline'
    | 'description'
    | 'technologies'
    | 'domains'
    | 'focus_areas'
    | 'user_role'
    | 'started_at'
    | 'ended_at'
    | 'status'
    | 'case_study_sections',
    string
  >
>;

export type ProjectCreateState = {
  success?: boolean;
  projectId?: string;
  redirectTo?: string;
  error?: string;
  fieldErrors?: ProjectCreateFieldErrors;
  errorCode?: 'auth' | 'validation' | 'slug_taken' | 'limit' | 'server';
  upgradeTo?: string;
  usage?: { count: number; limit: number | null };
};

type AuthUser = { id: string };

type OwnedProfileRow = {
  id: string;
  tenant_id: string;
  owner_user_id: string;
};

export function parseCreateProjectFormData(formData: FormData) {
  const technologiesFromList = formData.getAll('technologies').map(String);
  const technologies =
    technologiesFromList.filter(Boolean).length > 0
      ? technologiesFromList
      : String(formData.get('technologies') ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

  return {
    title: String(formData.get('title') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    tagline: String(formData.get('tagline') ?? '') || null,
    description: String(formData.get('description') ?? '') || null,
    technologies,
    domains: formData.getAll('domains').map(String).filter(Boolean),
    focus_areas: formData.getAll('focus_areas').map(String).filter(Boolean),
    user_role: String(formData.get('user_role') ?? '') || null,
    started_at: String(formData.get('started_at') ?? '') || null,
    ended_at: String(formData.get('ended_at') ?? '') || null,
    status: String(formData.get('status') ?? '') || undefined,
    case_study_sections: parseCaseStudySectionsFromFormData(formData),
  };
}

export function validateCreateProjectPayload(
  payload: Record<string, unknown>,
): { success: true; data: CreateProjectInputPayload } | { success: false; state: ProjectCreateState } {
  const forbidden = findForbiddenCreateProjectFields(payload);
  if (forbidden) {
    return {
      success: false,
      state: { error: forbidden, errorCode: 'validation' },
    };
  }

  const parsed = createProjectInputSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    const field = first?.path[0];
    const message = first?.message ?? 'Invalid project details.';
    if (typeof field === 'string') {
      return {
        success: false,
        state: {
          fieldErrors: { [field]: message } as ProjectCreateFieldErrors,
          error: message,
          errorCode: 'validation',
        },
      };
    }
    return {
      success: false,
      state: { error: message, errorCode: 'validation' },
    };
  }

  return { success: true, data: parsed.data };
}

export function mapProjectCreateDbError(error: {
  code?: string;
  message?: string;
}): ProjectCreateState {
  if (error.code === '23505') {
    return {
      fieldErrors: { slug: PROJECT_SLUG_TAKEN_MESSAGE },
      error: PROJECT_SLUG_TAKEN_MESSAGE,
      errorCode: 'slug_taken',
    };
  }
  return {
    error: 'Could not create project. Please try again.',
    errorCode: 'server',
  };
}

async function rollbackOwnedProject(
  supabase: SupabaseClient,
  projectId: string,
  ownerUserId: string,
): Promise<void> {
  await supabase.from('projects').delete().eq('id', projectId).eq('owner_user_id', ownerUserId);
}

async function resolveNextSortOrder(
  supabase: SupabaseClient,
  profileId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId);

  if (error || count == null) {
    return 0;
  }

  return count;
}

export async function executeCreateProject(
  supabase: SupabaseClient,
  formData: FormData,
  options?: { user?: AuthUser | null },
): Promise<ProjectCreateState> {
  const forbiddenFormField = findForbiddenCreateProjectFormData(formData);
  if (forbiddenFormField) {
    return { error: forbiddenFormField, errorCode: 'validation' };
  }

  let user = options?.user;
  if (user === undefined) {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  }

  if (!user) {
    return {
      error: 'You must be signed in to create a project.',
      errorCode: 'auth',
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, tenant_id, owner_user_id')
    .eq('owner_user_id', user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: 'Profile not found. Finish sign-up before creating a project.',
      errorCode: 'auth',
    };
  }

  const ownedProfile = profile as OwnedProfileRow;

  const quota = await evaluateProjectCreationQuota(supabase, {
    tenantId: ownedProfile.tenant_id,
    profileId: ownedProfile.id,
  });

  if (!quota.allowed) {
    return {
      error: quota.error,
      errorCode: 'limit',
      upgradeTo: quota.upgradeTo,
      usage: quota.usage,
    };
  }

  const payload = parseCreateProjectFormData(formData);
  const validated = validateCreateProjectPayload(payload);
  if (!validated.success) {
    return validated.state;
  }

  const data = validated.data;
  const sortOrder = await resolveNextSortOrder(supabase, ownedProfile.id);

  const { data: project, error: insertError } = await supabase
    .from('projects')
    .insert({
      tenant_id: ownedProfile.tenant_id,
      profile_id: ownedProfile.id,
      owner_user_id: user.id,
      title: data.title,
      slug: data.slug,
      tagline: data.tagline ?? null,
      description: data.description ?? null,
      technologies: data.technologies,
      user_role: data.user_role ?? null,
      started_at: data.started_at ?? null,
      ended_at: data.ended_at ?? null,
      status: data.status ?? 'draft',
      is_published: false,
      case_study_sections: data.case_study_sections ?? {},
      sort_order: sortOrder,
    })
    .select('id')
    .single();

  if (insertError || !project) {
    return mapProjectCreateDbError(insertError ?? { message: 'insert failed' });
  }

  const projectId = project.id as string;

  if (data.domains.length > 0) {
    const { error: domainsError } = await supabase.from('project_domains').insert(
      data.domains.map((name: string) => ({
        tenant_id: ownedProfile.tenant_id,
        project_id: projectId,
        name,
      })),
    );

    if (domainsError) {
      await rollbackOwnedProject(supabase, projectId, user.id);
      return {
        error: 'Could not create project. Please try again.',
        errorCode: 'server',
      };
    }
  }

  if (data.focus_areas.length > 0) {
    const { error: focusError } = await supabase.from('project_focus_areas').insert(
      data.focus_areas.map((name: string) => ({
        tenant_id: ownedProfile.tenant_id,
        project_id: projectId,
        name,
      })),
    );

    if (focusError) {
      await rollbackOwnedProject(supabase, projectId, user.id);
      return {
        error: 'Could not create project. Please try again.',
        errorCode: 'server',
      };
    }
  }

  return {
    success: true,
    projectId,
    redirectTo: '/dashboard/projects',
  };
}

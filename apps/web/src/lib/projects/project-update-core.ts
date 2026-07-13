import {
  findForbiddenUpdateProjectFields,
  findForbiddenUpdateProjectFormData,
  PROJECT_SLUG_TAKEN_MESSAGE,
  updateProjectInputSchema,
  type UpdateProjectInputPayload,
} from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  loadOwnedProject,
  resolveAuthenticatedUser,
  type AuthUser,
  type OwnedProjectRecord,
} from '@/lib/projects/project-access-core';
import { mapProjectCreateDbError } from '@/lib/projects/project-create-core';

export type ProjectUpdateFieldErrors = Partial<
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
    | 'status',
    string
  >
>;

export type ProjectUpdateState = {
  success?: boolean;
  projectId?: string;
  error?: string;
  fieldErrors?: ProjectUpdateFieldErrors;
  errorCode?: 'auth' | 'validation' | 'slug_taken' | 'not_found' | 'server';
  previousSlug?: string;
  profileSlug?: string | null;
  isPublished?: boolean;
};

export function parseUpdateProjectFormData(formData: FormData) {
  const technologiesFromList = formData.getAll('technologies').map(String);
  const technologies =
    technologiesFromList.filter(Boolean).length > 0
      ? technologiesFromList
      : String(formData.get('technologies') ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

  return {
    project_id: String(formData.get('project_id') ?? ''),
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
  };
}

export function validateUpdateProjectPayload(
  payload: Record<string, unknown>,
): { success: true; data: UpdateProjectInputPayload } | { success: false; state: ProjectUpdateState } {
  const forbidden = findForbiddenUpdateProjectFields(payload);
  if (forbidden) {
    return {
      success: false,
      state: { error: forbidden, errorCode: 'validation' },
    };
  }

  const parsed = updateProjectInputSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    const field = first?.path[0];
    const message = first?.message ?? 'Invalid project details.';
    if (typeof field === 'string' && field !== 'project_id') {
      return {
        success: false,
        state: {
          fieldErrors: { [field]: message } as ProjectUpdateFieldErrors,
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

async function restoreRelationRows(
  supabase: SupabaseClient,
  project: OwnedProjectRecord,
  table: 'project_domains' | 'project_focus_areas',
  names: string[],
): Promise<void> {
  if (names.length === 0) return;
  await supabase.from(table).insert(
    names.map((name) => ({
      tenant_id: project.tenant_id,
      project_id: project.id,
      name,
    })),
  );
}

async function replaceProjectRelations(
  supabase: SupabaseClient,
  project: OwnedProjectRecord,
  domains: string[],
  focusAreas: string[],
): Promise<boolean> {
  const { data: existingDomains } = await supabase
    .from('project_domains')
    .select('name')
    .eq('project_id', project.id);
  const { data: existingFocusAreas } = await supabase
    .from('project_focus_areas')
    .select('name')
    .eq('project_id', project.id);

  const previousDomains = (existingDomains ?? []).map((row) => row.name as string);
  const previousFocusAreas = (existingFocusAreas ?? []).map((row) => row.name as string);

  const { error: deleteDomainsError } = await supabase
    .from('project_domains')
    .delete()
    .eq('project_id', project.id);
  if (deleteDomainsError) {
    return false;
  }

  const { error: deleteFocusError } = await supabase
    .from('project_focus_areas')
    .delete()
    .eq('project_id', project.id);
  if (deleteFocusError) {
    await restoreRelationRows(supabase, project, 'project_domains', previousDomains);
    return false;
  }

  if (domains.length > 0) {
    const { error: insertDomainsError } = await supabase.from('project_domains').insert(
      domains.map((name) => ({
        tenant_id: project.tenant_id,
        project_id: project.id,
        name,
      })),
    );
    if (insertDomainsError) {
      await restoreRelationRows(supabase, project, 'project_domains', previousDomains);
      await restoreRelationRows(supabase, project, 'project_focus_areas', previousFocusAreas);
      return false;
    }
  }

  if (focusAreas.length > 0) {
    const { error: insertFocusError } = await supabase.from('project_focus_areas').insert(
      focusAreas.map((name) => ({
        tenant_id: project.tenant_id,
        project_id: project.id,
        name,
      })),
    );
    if (insertFocusError) {
      await supabase.from('project_domains').delete().eq('project_id', project.id);
      await supabase.from('project_focus_areas').delete().eq('project_id', project.id);
      await restoreRelationRows(supabase, project, 'project_domains', previousDomains);
      await restoreRelationRows(supabase, project, 'project_focus_areas', previousFocusAreas);
      return false;
    }
  }

  return true;
}

export async function executeUpdateProject(
  supabase: SupabaseClient,
  formData: FormData,
  options?: { user?: AuthUser | null },
): Promise<ProjectUpdateState> {
  const forbiddenFormField = findForbiddenUpdateProjectFormData(formData);
  if (forbiddenFormField) {
    return { error: forbiddenFormField, errorCode: 'validation' };
  }

  const auth = await resolveAuthenticatedUser(supabase, options);
  if ('error' in auth) {
    return { error: auth.error, errorCode: auth.errorCode };
  }

  const payload = parseUpdateProjectFormData(formData);
  const validated = validateUpdateProjectPayload(payload);
  if (!validated.success) {
    return validated.state;
  }

  const owned = await loadOwnedProject(supabase, {
    userId: auth.user.id,
    projectId: validated.data.project_id,
  });
  if ('error' in owned) {
    return { error: owned.error, errorCode: owned.errorCode };
  }

  const { project, profile } = owned;
  const previousSlug = project.slug;
  const data = validated.data;

  const { error: updateError } = await supabase
    .from('projects')
    .update({
      title: data.title,
      slug: data.slug,
      tagline: data.tagline ?? null,
      description: data.description ?? null,
      technologies: data.technologies,
      user_role: data.user_role ?? null,
      started_at: data.started_at ?? null,
      ended_at: data.ended_at ?? null,
      status: data.status ?? 'draft',
    })
    .eq('id', project.id)
    .eq('owner_user_id', auth.user.id);

  if (updateError) {
    const mapped = mapProjectCreateDbError(updateError);
    return {
      ...mapped,
      errorCode:
        mapped.errorCode === 'limit' ? 'server' : (mapped.errorCode as ProjectUpdateState['errorCode']),
    };
  }

  const relationsUpdated = await replaceProjectRelations(
    supabase,
    project,
    data.domains,
    data.focus_areas,
  );

  if (!relationsUpdated) {
    return {
      error: 'Could not save your project. Please try again.',
      errorCode: 'server',
    };
  }

  return {
    success: true,
    projectId: project.id,
    previousSlug,
    profileSlug: profile.slug,
    isPublished: project.is_published,
  };
}

export { PROJECT_SLUG_TAKEN_MESSAGE };

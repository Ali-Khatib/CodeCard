import {
  findDuplicateProjectLink,
  PROJECT_LINKS_MAX_COUNT,
  projectLinkInputSchema,
} from '@codecard/validation';
import type { ProjectLink } from '@codecard/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  loadOwnedProject,
  resolveAuthenticatedUser,
  type AuthUser,
} from '@/lib/projects/project-access-core';

export type ProjectLinkRow = Pick<
  ProjectLink,
  'id' | 'type' | 'label' | 'url' | 'sort_order'
>;

export type ProjectLinkFieldErrors = Partial<Record<'type' | 'label' | 'url', string>>;

export type ProjectLinkMutationState = {
  success?: boolean;
  error?: string;
  fieldErrors?: ProjectLinkFieldErrors;
  link?: ProjectLinkRow;
};

const DUPLICATE_LINK_MESSAGE = 'This link already exists on this project.';
const PROJECT_NOT_FOUND_MESSAGE = 'Project not found.';

export function mapProjectLinkDbError(): ProjectLinkMutationState {
  return { error: 'Could not save your project link. Please try again.' };
}

async function loadOwnedProjectLinks(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectLinkRow[]> {
  const { data } = await supabase
    .from('project_links')
    .select('id, type, label, url, sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  return (data ?? []) as ProjectLinkRow[];
}

async function verifyOwnedLink(
  supabase: SupabaseClient,
  projectId: string,
  linkId: string,
): Promise<ProjectLinkRow | null> {
  const { data } = await supabase
    .from('project_links')
    .select('id, type, label, url, sort_order')
    .eq('project_id', projectId)
    .eq('id', linkId)
    .maybeSingle();

  return (data as ProjectLinkRow | null) ?? null;
}

function validationFailure(error: { path: (string | number)[]; message: string }): ProjectLinkMutationState {
  const field = error.path[0];
  if (typeof field === 'string') {
    return {
      error: error.message,
      fieldErrors: { [field]: error.message } as ProjectLinkFieldErrors,
    };
  }
  return { error: error.message };
}

async function resolveOwnedProjectContext(
  supabase: SupabaseClient,
  projectId: string,
  options?: { user?: AuthUser | null },
) {
  const userResult = await resolveAuthenticatedUser(supabase, options);
  if ('error' in userResult) {
    return { error: userResult.error };
  }

  const owned = await loadOwnedProject(supabase, {
    userId: userResult.user.id,
    projectId,
  });

  if ('error' in owned) {
    return { error: PROJECT_NOT_FOUND_MESSAGE };
  }

  return owned;
}

export async function executeCreateProjectLink(
  supabase: SupabaseClient,
  formData: FormData,
  options?: { user?: AuthUser | null },
): Promise<ProjectLinkMutationState> {
  const projectId = String(formData.get('project_id') ?? '');
  if (!projectId) {
    return { error: PROJECT_NOT_FOUND_MESSAGE };
  }

  const owned = await resolveOwnedProjectContext(supabase, projectId, options);
  if ('error' in owned) {
    return { error: owned.error };
  }

  const parsed = projectLinkInputSchema.safeParse({
    type: String(formData.get('type') ?? ''),
    label: String(formData.get('label') ?? '') || null,
    url: String(formData.get('url') ?? ''),
  });
  if (!parsed.success) {
    return validationFailure(parsed.error.errors[0]!);
  }

  const existing = await loadOwnedProjectLinks(supabase, owned.project.id);
  if (existing.length >= PROJECT_LINKS_MAX_COUNT) {
    return { error: `You can add at most ${PROJECT_LINKS_MAX_COUNT} project links.` };
  }
  if (findDuplicateProjectLink(existing, parsed.data)) {
    return { error: DUPLICATE_LINK_MESSAGE, fieldErrors: { url: DUPLICATE_LINK_MESSAGE } };
  }

  const nextSortOrder =
    existing.length === 0 ? 0 : Math.max(...existing.map((link) => link.sort_order)) + 1;

  const { data, error } = await supabase
    .from('project_links')
    .insert({
      tenant_id: owned.project.tenant_id,
      project_id: owned.project.id,
      type: parsed.data.type,
      label: parsed.data.label,
      url: parsed.data.url,
      sort_order: nextSortOrder,
    })
    .select('id, type, label, url, sort_order')
    .single();

  if (error || !data) {
    return mapProjectLinkDbError();
  }

  return { success: true, link: data as ProjectLinkRow };
}

export async function executeUpdateProjectLink(
  supabase: SupabaseClient,
  formData: FormData,
  options?: { user?: AuthUser | null },
): Promise<ProjectLinkMutationState> {
  const projectId = String(formData.get('project_id') ?? '');
  const linkId = String(formData.get('link_id') ?? '');
  if (!projectId || !linkId) {
    return { error: 'Project link not found.' };
  }

  const owned = await resolveOwnedProjectContext(supabase, projectId, options);
  if ('error' in owned) {
    return { error: owned.error };
  }

  const ownedLink = await verifyOwnedLink(supabase, owned.project.id, linkId);
  if (!ownedLink) {
    return { error: 'Project link not found.' };
  }

  const parsed = projectLinkInputSchema.safeParse({
    type: String(formData.get('type') ?? ''),
    label: String(formData.get('label') ?? '') || null,
    url: String(formData.get('url') ?? ''),
  });
  if (!parsed.success) {
    return validationFailure(parsed.error.errors[0]!);
  }

  const existing = await loadOwnedProjectLinks(supabase, owned.project.id);
  if (findDuplicateProjectLink(existing, { ...parsed.data, id: linkId })) {
    return { error: DUPLICATE_LINK_MESSAGE, fieldErrors: { url: DUPLICATE_LINK_MESSAGE } };
  }

  const { data, error } = await supabase
    .from('project_links')
    .update({
      type: parsed.data.type,
      label: parsed.data.label,
      url: parsed.data.url,
    })
    .eq('id', linkId)
    .eq('project_id', owned.project.id)
    .select('id, type, label, url, sort_order')
    .single();

  if (error || !data) {
    return mapProjectLinkDbError();
  }

  return { success: true, link: data as ProjectLinkRow };
}

export async function executeDeleteProjectLink(
  supabase: SupabaseClient,
  input: { projectId: string; linkId: string },
  options?: { user?: AuthUser | null },
): Promise<ProjectLinkMutationState> {
  const owned = await resolveOwnedProjectContext(supabase, input.projectId, options);
  if ('error' in owned) {
    return { error: owned.error };
  }

  const ownedLink = await verifyOwnedLink(supabase, owned.project.id, input.linkId);
  if (!ownedLink) {
    return { error: 'Project link not found.' };
  }

  const { error } = await supabase
    .from('project_links')
    .delete()
    .eq('id', input.linkId)
    .eq('project_id', owned.project.id);

  if (error) {
    return mapProjectLinkDbError();
  }

  const remaining = (await loadOwnedProjectLinks(supabase, owned.project.id)).filter(
    (link) => link.id !== input.linkId,
  );
  await persistProjectLinkOrder(supabase, owned.project.id, remaining.map((link) => link.id));

  return { success: true };
}

async function persistProjectLinkOrder(
  supabase: SupabaseClient,
  projectId: string,
  orderedIds: string[],
) {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('project_links')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('project_id', projectId),
    ),
  );
}

export async function loadOwnedProjectLinksForProject(
  supabase: SupabaseClient,
  input: { userId: string; projectId: string },
): Promise<ProjectLinkRow[] | { error: string }> {
  const owned = await loadOwnedProject(supabase, input);
  if ('error' in owned) {
    return { error: PROJECT_NOT_FOUND_MESSAGE };
  }

  return loadOwnedProjectLinks(supabase, owned.project.id);
}

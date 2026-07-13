'use server';

import { createClient } from '@/lib/supabase/server';
import { loadOwnedProject } from '@/lib/projects/project-access-core';
import { revalidateOwnedProjectPaths } from '@/lib/projects/project-revalidate';
import {
  executeCreateProjectLink,
  executeDeleteProjectLink,
  executeUpdateProjectLink,
  type ProjectLinkMutationState,
} from '@/lib/projects/project-link-core';

export type { ProjectLinkMutationState };

async function revalidateProjectLinkPaths(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const owned = await loadOwnedProject(supabase, { userId: user.id, projectId });
  if ('error' in owned) return;

  revalidateOwnedProjectPaths({
    projectId,
    profileSlug: owned.profile.slug,
    isPublished: owned.project.is_published,
    touchPublicRoutes: owned.project.is_published,
  });
}

export async function createProjectLinkAction(
  _prev: ProjectLinkMutationState,
  formData: FormData,
): Promise<ProjectLinkMutationState> {
  const supabase = await createClient();
  const result = await executeCreateProjectLink(supabase, formData);
  const projectId = String(formData.get('project_id') ?? '');
  if (result.success && projectId) {
    await revalidateProjectLinkPaths(projectId);
  }
  return result;
}

export async function updateProjectLinkAction(
  _prev: ProjectLinkMutationState,
  formData: FormData,
): Promise<ProjectLinkMutationState> {
  const supabase = await createClient();
  const result = await executeUpdateProjectLink(supabase, formData);
  const projectId = String(formData.get('project_id') ?? '');
  if (result.success && projectId) {
    await revalidateProjectLinkPaths(projectId);
  }
  return result;
}

export async function deleteProjectLinkAction(input: {
  projectId: string;
  linkId: string;
}): Promise<ProjectLinkMutationState> {
  const supabase = await createClient();
  const result = await executeDeleteProjectLink(supabase, input);
  if (result.success) {
    await revalidateProjectLinkPaths(input.projectId);
  }
  return result;
}

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  executeCreateProject,
  type ProjectCreateState,
} from '@/lib/projects/project-create-core';
import {
  executeUpdateProject,
  type ProjectUpdateState,
} from '@/lib/projects/project-update-core';
import {
  executePublishProject,
  executeUnpublishProject,
  type ProjectPublishState,
} from '@/lib/projects/project-publish-core';
import {
  executeDeleteProject,
  type ProjectDeleteState,
} from '@/lib/projects/project-delete-core';
import {
  revalidateDeletedProjectPaths,
  revalidateOwnedProjectPaths,
} from '@/lib/projects/project-revalidate';

export type { ProjectCreateState, ProjectUpdateState, ProjectPublishState, ProjectDeleteState };

export async function createProjectAction(
  _prev: ProjectCreateState,
  formData: FormData,
): Promise<ProjectCreateState> {
  const supabase = await createClient();
  const result = await executeCreateProject(supabase, formData);

  if (result.success) {
    revalidatePath('/dashboard/projects');
  }

  return result;
}

export async function updateProjectAction(
  _prev: ProjectUpdateState,
  formData: FormData,
): Promise<ProjectUpdateState> {
  const supabase = await createClient();
  const result = await executeUpdateProject(supabase, formData);

  if (result.success && result.projectId) {
    revalidateOwnedProjectPaths({
      projectId: result.projectId,
      profileSlug: result.profileSlug,
      isPublished: result.isPublished,
    });
  }

  return result;
}

export async function publishProjectAction(
  projectId: string,
): Promise<ProjectPublishState> {
  const supabase = await createClient();
  const result = await executePublishProject(supabase, projectId);

  if (result.success && result.projectId) {
    revalidateOwnedProjectPaths({
      projectId: result.projectId,
      profileSlug: result.profileSlug,
      isPublished: true,
      touchPublicRoutes: true,
    });
  }

  return result;
}

export async function unpublishProjectAction(
  projectId: string,
): Promise<ProjectPublishState> {
  const supabase = await createClient();
  const result = await executeUnpublishProject(supabase, projectId);

  if (result.success && result.projectId) {
    revalidateOwnedProjectPaths({
      projectId: result.projectId,
      profileSlug: result.profileSlug,
      isPublished: false,
      touchPublicRoutes: true,
    });
  }

  return result;
}

export async function deleteProjectAction(
  projectId: string,
): Promise<ProjectDeleteState> {
  const supabase = await createClient();
  const result = await executeDeleteProject(supabase, projectId);

  if (result.success && result.projectId) {
    revalidateDeletedProjectPaths({
      projectId: result.projectId,
      profileSlug: result.profileSlug,
      wasPublished: result.wasPublished,
    });
  }

  return result;
}

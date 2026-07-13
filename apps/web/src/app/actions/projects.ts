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
import { revalidateOwnedProjectPaths } from '@/lib/projects/project-revalidate';

export type { ProjectCreateState, ProjectUpdateState };

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

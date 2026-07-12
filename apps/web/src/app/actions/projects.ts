'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  executeCreateProject,
  type ProjectCreateState,
} from '@/lib/projects/project-create-core';

export type { ProjectCreateState };

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

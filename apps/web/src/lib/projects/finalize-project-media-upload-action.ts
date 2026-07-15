'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  executeFinalizeProjectMediaUpload,
  type ProjectMediaFinalizeState,
} from '@/lib/projects/project-media-core';
import { revalidatePublicProject } from '@/lib/profile/public-cache';

export type { ProjectMediaFinalizeState };

export async function finalizeProjectMediaUploadAction(input: {
  projectId: string;
  mediaRole: 'poster' | 'screenshot';
  path: string;
}): Promise<ProjectMediaFinalizeState> {
  const supabase = await createClient();
  const result = await executeFinalizeProjectMediaUpload(supabase, {
    project_id: input.projectId,
    media_role: input.mediaRole,
    path: input.path,
  });

  if (result.success && result.projectId) {
    revalidatePath(`/dashboard/projects/${result.projectId}/edit`);
    revalidatePath('/dashboard/projects');
    revalidatePath('/dashboard/profile/preview');
    if (result.slug && result.isPublished && result.profileIsPublic) {
      revalidatePublicProject(result.slug, result.projectId);
    }
  }

  return result;
}

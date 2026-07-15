'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  executeDeleteProjectScreenshot,
  type ProjectMediaDeleteState,
} from '@/lib/projects/project-media-core';
import { revalidatePublicProject } from '@/lib/profile/public-cache';

export type { ProjectMediaDeleteState };

export async function deleteProjectScreenshotAction(input: {
  projectId: string;
  assetId: string;
}): Promise<ProjectMediaDeleteState> {
  const supabase = await createClient();
  const result = await executeDeleteProjectScreenshot(supabase, {
    projectId: input.projectId,
    assetId: input.assetId,
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

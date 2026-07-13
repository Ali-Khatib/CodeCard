'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  executeReorderProjects,
  type ProjectReorderState,
} from '@/lib/projects/project-order-core';
import { resolveOwnedProfile } from '@/lib/projects/project-access-core';
import { revalidatePublicProjectNavigation } from '@/lib/projects/project-revalidate';

export type { ProjectReorderState };

export async function reorderProjectsAction(
  projectIds: string[],
): Promise<ProjectReorderState> {
  const supabase = await createClient();
  const result = await executeReorderProjects(supabase, projectIds);

  if (result.success) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const profileResult = await resolveOwnedProfile(supabase, user.id);
      revalidatePath('/dashboard/projects');
      if (!('error' in profileResult) && profileResult.profile.slug) {
        revalidatePublicProjectNavigation({
          profileSlug: profileResult.profile.slug,
          projectIds,
        });
      }
    }
  }

  return result;
}

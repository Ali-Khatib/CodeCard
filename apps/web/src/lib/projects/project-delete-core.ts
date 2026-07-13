import type { SupabaseClient } from '@supabase/supabase-js';
import {
  loadOwnedProject,
  resolveAuthenticatedUser,
  type AuthUser,
} from '@/lib/projects/project-access-core';

export type ProjectDeleteState = {
  success?: boolean;
  error?: string;
  errorCode?: 'auth' | 'not_found' | 'server';
  projectId?: string;
  profileSlug?: string | null;
  wasPublished?: boolean;
  redirectTo?: string;
};

export async function executeDeleteProject(
  supabase: SupabaseClient,
  projectId: string,
  options?: { user?: AuthUser | null },
): Promise<ProjectDeleteState> {
  const auth = await resolveAuthenticatedUser(supabase, options);
  if ('error' in auth) {
    return { error: auth.error, errorCode: auth.errorCode };
  }

  const owned = await loadOwnedProject(supabase, {
    userId: auth.user.id,
    projectId,
  });
  if ('error' in owned) {
    return { error: owned.error, errorCode: owned.errorCode };
  }

  const { project, profile } = owned;

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', project.id)
    .eq('owner_user_id', auth.user.id);

  if (error) {
    return {
      error: 'Could not delete this project. Please try again.',
      errorCode: 'server',
    };
  }

  return {
    success: true,
    projectId: project.id,
    profileSlug: profile.slug,
    wasPublished: project.is_published,
    redirectTo: '/dashboard/projects',
  };
}

/**
 * Database rows in project_domains, project_focus_areas, project_links,
 * project_media_assets, and project_orderings cascade on project delete.
 * Storage objects referenced by project_media_assets are not removed here (WS04-T010).
 */
export const PROJECT_DELETE_STORAGE_DEFERRED = true;

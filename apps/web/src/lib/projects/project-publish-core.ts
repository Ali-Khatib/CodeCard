import type { SupabaseClient } from '@supabase/supabase-js';
import { isCurrentAccountSuspended } from '@/lib/account/suspension-guard';
import {
  loadOwnedProject,
  resolveAuthenticatedUser,
  type AuthUser,
} from '@/lib/projects/project-access-core';
import { emitProjectPublishedActivity } from '@/lib/circle/circle-emit-core';

export type ProjectPublishState = {
  success?: boolean;
  error?: string;
  errorCode?: 'auth' | 'not_found' | 'server';
  projectId?: string;
  is_published?: boolean;
  profileSlug?: string | null;
  profileIsPublic?: boolean;
};

export async function executeSetProjectPublished(
  supabase: SupabaseClient,
  input: { projectId: string; isPublished: boolean },
  options?: { user?: AuthUser | null },
): Promise<ProjectPublishState> {
  const auth = await resolveAuthenticatedUser(supabase, options);
  if ('error' in auth) {
    return { error: auth.error, errorCode: auth.errorCode };
  }

  const owned = await loadOwnedProject(supabase, {
    userId: auth.user.id,
    projectId: input.projectId,
  });
  if ('error' in owned) {
    return { error: owned.error, errorCode: owned.errorCode };
  }

  const { project, profile } = owned;
  const wasPublished = project.is_published;

  if (project.is_published === input.isPublished) {
    return {
      success: true,
      projectId: project.id,
      is_published: project.is_published,
      profileSlug: profile.slug,
      profileIsPublic: profile.is_public,
    };
  }

  if (input.isPublished && (await isCurrentAccountSuspended(supabase))) {
    return {
      error: 'Your account is suspended and cannot publish content.',
      errorCode: 'server',
    };
  }

  const { error } = await supabase
    .from('projects')
    .update({ is_published: input.isPublished })
    .eq('id', project.id)
    .eq('owner_user_id', auth.user.id);

  if (error) {
    return {
      error: 'Could not update project visibility. Please try again.',
      errorCode: 'server',
    };
  }

  if (!wasPublished && input.isPublished) {
    // Best-effort: publication already succeeded; unique dedupe prevents duplicates.
    await emitProjectPublishedActivity(supabase, {
      tenantId: project.tenant_id,
      actorProfileId: project.profile_id,
      projectId: project.id,
    });
  }

  return {
    success: true,
    projectId: project.id,
    is_published: input.isPublished,
    profileSlug: profile.slug,
    profileIsPublic: profile.is_public,
  };
}

export async function executePublishProject(
  supabase: SupabaseClient,
  projectId: string,
  options?: { user?: AuthUser | null },
): Promise<ProjectPublishState> {
  return executeSetProjectPublished(
    supabase,
    { projectId, isPublished: true },
    options,
  );
}

export async function executeUnpublishProject(
  supabase: SupabaseClient,
  projectId: string,
  options?: { user?: AuthUser | null },
): Promise<ProjectPublishState> {
  return executeSetProjectPublished(
    supabase,
    { projectId, isPublished: false },
    options,
  );
}

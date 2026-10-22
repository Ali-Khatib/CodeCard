import { revalidatePath } from 'next/cache';
import { apiError } from '@/lib/api-utils';
import {
  ownedMutationJson,
  readOwnedFormPost,
  statusForOwnedMutation,
} from '@/lib/dashboard/owned-form-request';
import {
  executeCreateProject,
  type ProjectCreateState,
} from '@/lib/projects/project-create-core';
import { revalidateOwnedProjectPaths } from '@/lib/projects/project-revalidate';
import {
  executeUpdateProject,
  type ProjectUpdateState,
} from '@/lib/projects/project-update-core';

export const dynamic = 'force-dynamic';

function createBody(result: ProjectCreateState) {
  return {
    success: Boolean(result.success),
    projectId: result.projectId,
    redirectTo: result.redirectTo,
    error: result.error,
    fieldErrors: result.fieldErrors,
    errorCode: result.errorCode,
    upgradeTo: result.upgradeTo,
    usage: result.usage,
  };
}

function updateBody(result: ProjectUpdateState) {
  return {
    success: Boolean(result.success),
    projectId: result.projectId,
    error: result.error,
    fieldErrors: result.fieldErrors,
    errorCode: result.errorCode,
  };
}

/**
 * Create or save a project without rendering the editor page in the response.
 */
export async function POST(request: Request) {
  const opened = await readOwnedFormPost(request);
  if (!opened.ok) return opened.response;

  const op = new URL(request.url).searchParams.get('op');
  const { supabase, user, formData } = opened;

  if (op === 'create') {
    const result = await executeCreateProject(supabase, formData, { user });
    if (result.success) {
      revalidatePath('/dashboard/projects');
    }
    return ownedMutationJson(createBody(result), statusForOwnedMutation(result));
  }

  if (op === 'update') {
    const result = await executeUpdateProject(supabase, formData, { user });
    if (result.success && result.projectId) {
      revalidateOwnedProjectPaths({
        projectId: result.projectId,
        profileSlug: result.profileSlug,
        isPublished: result.isPublished,
      });
      if (result.isPublished) {
        revalidatePath('/dashboard/circle');
      }
    }
    return ownedMutationJson(updateBody(result), statusForOwnedMutation(result));
  }

  return apiError('Unknown project action.', 400);
}

export async function GET() {
  return apiError('Method not allowed', 405);
}

import { revalidatePath } from 'next/cache';
import { apiError } from '@/lib/api-utils';
import {
  ownedMutationJson,
  readOwnedFormPost,
  statusForOwnedMutation,
} from '@/lib/dashboard/owned-form-request';
import {
  executeCreateResearch,
  type ResearchCreateState,
} from '@/lib/research/research-create-core';
import { revalidateOwnedResearchPaths } from '@/lib/research/research-revalidate';
import {
  executeUpdateResearch,
  type ResearchUpdateState,
} from '@/lib/research/research-update-core';

export const dynamic = 'force-dynamic';

function createBody(result: ResearchCreateState) {
  return {
    success: Boolean(result.success),
    researchPaperId: result.researchPaperId,
    slug: result.slug,
    redirectTo: result.redirectTo,
    error: result.error,
    fieldErrors: result.fieldErrors,
    errorCode: result.errorCode,
  };
}

function updateBody(result: ResearchUpdateState) {
  return {
    success: Boolean(result.success),
    researchPaperId: result.researchPaperId,
    slug: result.slug,
    error: result.error,
    fieldErrors: result.fieldErrors,
    errorCode: result.errorCode,
  };
}

/**
 * Create or save a research paper without rendering the editor page in the response.
 */
export async function POST(request: Request) {
  const opened = await readOwnedFormPost(request);
  if (!opened.ok) return opened.response;

  const op = new URL(request.url).searchParams.get('op');
  const { supabase, user, formData } = opened;

  if (op === 'create') {
    const result = await executeCreateResearch(supabase, formData, { user });
    if (result.success) {
      revalidatePath('/dashboard/research');
    }
    return ownedMutationJson(createBody(result), statusForOwnedMutation(result));
  }

  if (op === 'update') {
    const result = await executeUpdateResearch(supabase, formData, { user });
    if (result.success && result.researchPaperId) {
      revalidateOwnedResearchPaths({
        researchPaperId: result.researchPaperId,
        paperSlug: result.slug ?? result.previousSlug,
        previousPaperSlug: result.previousSlug,
        profileSlug: result.profileSlug,
        isPublished: result.isPublished,
      });
      if (result.isPublished) {
        revalidatePath('/dashboard/circle');
      }
    }
    return ownedMutationJson(updateBody(result), statusForOwnedMutation(result));
  }

  return apiError('Unknown research action.', 400);
}

export async function GET() {
  return apiError('Method not allowed', 405);
}

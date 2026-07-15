'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  executeCreateResearch,
  type ResearchCreateState,
} from '@/lib/research/research-create-core';
import {
  executeUpdateResearch,
  type ResearchUpdateState,
} from '@/lib/research/research-update-core';
import {
  executeDeleteResearch,
  type ResearchDeleteState,
} from '@/lib/research/research-delete-core';
import {
  revalidateDeletedResearchPaths,
  revalidateOwnedResearchPaths,
} from '@/lib/research/research-revalidate';

export type { ResearchCreateState, ResearchUpdateState, ResearchDeleteState };

export async function createResearchAction(
  _prev: ResearchCreateState,
  formData: FormData,
): Promise<ResearchCreateState> {
  const supabase = await createClient();
  const result = await executeCreateResearch(supabase, formData);

  if (result.success) {
    revalidatePath('/dashboard/research');
  }

  return result;
}

export async function updateResearchAction(
  _prev: ResearchUpdateState,
  formData: FormData,
): Promise<ResearchUpdateState> {
  const supabase = await createClient();
  const result = await executeUpdateResearch(supabase, formData);

  if (result.success && result.researchPaperId) {
    revalidateOwnedResearchPaths({
      researchPaperId: result.researchPaperId,
      paperSlug: result.slug ?? result.previousSlug,
      profileSlug: result.profileSlug,
      isPublished: result.isPublished,
    });
    if (
      result.previousSlug &&
      result.slug &&
      result.previousSlug !== result.slug &&
      result.profileSlug &&
      result.isPublished
    ) {
      revalidatePath(`/${result.profileSlug}/research/${result.previousSlug}`);
    }
  }

  return result;
}

export async function deleteResearchAction(
  researchPaperId: string,
): Promise<ResearchDeleteState> {
  const supabase = await createClient();
  const result = await executeDeleteResearch(supabase, researchPaperId);

  if (result.success && result.researchPaperId && !result.alreadyDeleted) {
    revalidateDeletedResearchPaths({
      researchPaperId: result.researchPaperId,
      paperSlug: result.paperSlug,
      profileSlug: result.profileSlug,
      wasPublished: result.wasPublished,
    });
  }

  if (result.success && result.alreadyDeleted) {
    revalidatePath('/dashboard/research');
  }

  return result;
}

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
  executePublishResearch,
  executeUnpublishResearch,
  type ResearchPublishState,
} from '@/lib/research/research-publish-core';
import {
  executeReorderResearch,
  type ResearchReorderState,
} from '@/lib/research/research-order-core';
import {
  revalidateDeletedResearchPaths,
  revalidateOwnedResearchPaths,
  revalidateResearchOrderPaths,
} from '@/lib/research/research-revalidate';

export type {
  ResearchCreateState,
  ResearchUpdateState,
  ResearchDeleteState,
  ResearchPublishState,
  ResearchReorderState,
};

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
      previousPaperSlug: result.previousSlug,
      profileSlug: result.profileSlug,
      isPublished: result.isPublished,
    });
  }

  return result;
}

export async function deleteResearchAction(
  researchPaperId: string,
): Promise<ResearchDeleteState> {
  const supabase = await createClient();
  const { createServiceClient } = await import('@/lib/supabase/server');
  const result = await executeDeleteResearch(supabase, researchPaperId, {
    createServiceClient,
  });

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

export async function publishResearchAction(
  researchPaperId: string,
): Promise<ResearchPublishState> {
  const supabase = await createClient();
  const result = await executePublishResearch(supabase, researchPaperId);

  if (result.success && result.researchPaperId) {
    revalidateOwnedResearchPaths({
      researchPaperId: result.researchPaperId,
      paperSlug: result.paperSlug,
      profileSlug: result.profileSlug,
      isPublished: true,
      touchPublicRoutes: true,
    });
  }

  return result;
}

export async function unpublishResearchAction(
  researchPaperId: string,
): Promise<ResearchPublishState> {
  const supabase = await createClient();
  const result = await executeUnpublishResearch(supabase, researchPaperId);

  if (result.success && result.researchPaperId) {
    revalidateOwnedResearchPaths({
      researchPaperId: result.researchPaperId,
      paperSlug: result.paperSlug,
      profileSlug: result.profileSlug,
      isPublished: false,
      touchPublicRoutes: true,
    });
  }

  return result;
}

export async function reorderResearchAction(
  researchPaperIds: string[],
): Promise<ResearchReorderState> {
  const supabase = await createClient();
  const result = await executeReorderResearch(supabase, researchPaperIds);

  if (result.success) {
    revalidateResearchOrderPaths({ profileSlug: result.profileSlug });
  }

  return result;
}

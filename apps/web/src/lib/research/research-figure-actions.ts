'use server';

import { createClient } from '@/lib/supabase/server';
import {
  executeDeleteResearchFigure,
  executeFinalizeResearchFigureUpload,
  executeReorderResearchFigures,
  executeUpdateResearchFigureCaption,
  type ResearchFigureFinalizeState,
  type ResearchFigureMutationState,
} from '@/lib/research/research-figure-core';
import { revalidateOwnedResearchPaths } from '@/lib/research/research-revalidate';

export type { ResearchFigureFinalizeState, ResearchFigureMutationState };

function revalidateFigurePaths(result: {
  researchPaperId?: string;
  paperSlug?: string | null;
  profileSlug?: string | null;
  isPublished?: boolean;
  profileIsPublic?: boolean;
}) {
  if (!result.researchPaperId) return;
  revalidateOwnedResearchPaths({
    researchPaperId: result.researchPaperId,
    paperSlug: result.paperSlug,
    profileSlug: result.profileSlug,
    isPublished: Boolean(result.isPublished && result.profileIsPublic),
    touchPublicRoutes: Boolean(result.isPublished && result.profileIsPublic),
  });
}

export async function finalizeResearchFigureUploadAction(input: {
  researchPaperId: string;
  path: string;
  replaceFigureId?: string;
}): Promise<ResearchFigureFinalizeState> {
  const supabase = await createClient();
  const result = await executeFinalizeResearchFigureUpload(supabase, {
    research_paper_id: input.researchPaperId,
    path: input.path,
    replace_figure_id: input.replaceFigureId,
  });

  if (result.success) {
    revalidateFigurePaths(result);
  }

  return result;
}

export async function updateResearchFigureCaptionAction(input: {
  researchPaperId: string;
  figureId: string;
  caption: string | null;
}): Promise<ResearchFigureMutationState> {
  const supabase = await createClient();
  const result = await executeUpdateResearchFigureCaption(supabase, {
    research_paper_id: input.researchPaperId,
    figure_id: input.figureId,
    caption: input.caption,
  });

  if (result.success) {
    revalidateFigurePaths(result);
  }

  return result;
}

export async function deleteResearchFigureAction(input: {
  researchPaperId: string;
  figureId: string;
}): Promise<ResearchFigureMutationState> {
  const supabase = await createClient();
  const result = await executeDeleteResearchFigure(supabase, {
    research_paper_id: input.researchPaperId,
    figure_id: input.figureId,
  });

  if (result.success) {
    revalidateFigurePaths(result);
  }

  return result;
}

export async function reorderResearchFiguresAction(input: {
  researchPaperId: string;
  orderedFigureIds: string[];
}): Promise<ResearchFigureMutationState> {
  const supabase = await createClient();
  const result = await executeReorderResearchFigures(supabase, {
    research_paper_id: input.researchPaperId,
    ordered_figure_ids: input.orderedFigureIds,
  });

  if (result.success) {
    revalidateFigurePaths(result);
  }

  return result;
}

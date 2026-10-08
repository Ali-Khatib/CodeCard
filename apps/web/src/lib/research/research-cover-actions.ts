'use server';

import { createClient } from '@/lib/supabase/server';
import {
  executeFinalizeResearchCoverUpload,
  type ResearchCoverFinalizeState,
} from '@/lib/research/research-cover-core';
import { revalidateOwnedResearchPaths } from '@/lib/research/research-revalidate';

export async function finalizeResearchCoverUploadAction(input: {
  researchPaperId: string;
  path: string;
}): Promise<ResearchCoverFinalizeState> {
  const supabase = await createClient();
  const result = await executeFinalizeResearchCoverUpload(supabase, {
    research_paper_id: input.researchPaperId,
    path: input.path,
  });

  if (result.success && result.researchPaperId) {
    revalidateOwnedResearchPaths({
      researchPaperId: result.researchPaperId,
      paperSlug: result.paperSlug,
      profileSlug: result.profileSlug,
      isPublished: Boolean(result.isPublished && result.profileIsPublic),
      touchPublicRoutes: Boolean(result.isPublished && result.profileIsPublic),
    });
  }

  return result;
}

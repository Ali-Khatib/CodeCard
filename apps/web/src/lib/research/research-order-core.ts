import { reorderResearchSchema } from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  resolveAuthenticatedUser,
  resolveOwnedProfile,
  type AuthUser,
} from '@/lib/research/research-access-core';

export type ResearchReorderState = {
  success?: boolean;
  error?: string;
  profileSlug?: string | null;
};

export type OrderableResearchPaper = {
  id: string;
  sort_order: number | null | undefined;
  created_at?: string | null;
  is_published?: boolean;
};

/**
 * Full-list reorder contract:
 * - Client submits the complete ordered list of the owner's research paper IDs.
 * - Server verifies the list is a permutation of all owned papers (no duplicates,
 *   no foreign IDs, no omissions).
 * - Server assigns deterministic sort_order values 0..n-1.
 *
 * Published and draft papers share one dashboard order. Public lists filter to
 * published papers while preserving relative sort_order.
 *
 * Persistence is a multi-row update without a DB transaction/RPC. Residual
 * concurrency risk: concurrent reorders or creates may interleave. On failure
 * the action returns an error and the UI refreshes to refetch authoritative order.
 */
export function sortResearchBySortOrder<T extends OrderableResearchPaper>(
  papers: T[],
): T[] {
  return [...papers].sort((left, right) => {
    const leftOrder = left.sort_order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.sort_order ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    const leftCreated = left.created_at ? Date.parse(left.created_at) : 0;
    const rightCreated = right.created_at ? Date.parse(right.created_at) : 0;
    if (leftCreated !== rightCreated) {
      return leftCreated - rightCreated;
    }

    return left.id.localeCompare(right.id);
  });
}

export async function executeReorderResearch(
  supabase: SupabaseClient,
  researchPaperIds: string[],
  options?: { user?: AuthUser | null },
): Promise<ResearchReorderState> {
  const auth = await resolveAuthenticatedUser(supabase, options);
  if ('error' in auth) {
    return { error: auth.error };
  }

  const profileResult = await resolveOwnedProfile(supabase, auth.user.id);
  if ('error' in profileResult) {
    return { error: 'Could not reorder research papers.' };
  }

  const parsed = reorderResearchSchema.safeParse({
    research_paper_ids: researchPaperIds,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? 'Invalid research order.',
    };
  }

  const unique = new Set(parsed.data.research_paper_ids);
  if (unique.size !== parsed.data.research_paper_ids.length) {
    return { error: 'Could not reorder research papers.' };
  }

  const { data: ownedPapers, error: papersError } = await supabase
    .from('research_papers')
    .select('id')
    .eq('profile_id', profileResult.profile.id)
    .eq('owner_user_id', auth.user.id)
    .eq('tenant_id', profileResult.profile.tenant_id);

  if (papersError || !ownedPapers) {
    return { error: 'Could not reorder research papers.' };
  }

  const ownedIds = new Set(ownedPapers.map((row) => row.id as string));
  if (parsed.data.research_paper_ids.length !== ownedIds.size) {
    return { error: 'Could not reorder research papers.' };
  }

  for (const paperId of parsed.data.research_paper_ids) {
    if (!ownedIds.has(paperId)) {
      return { error: 'Could not reorder research papers.' };
    }
  }

  const sortUpdates = await Promise.all(
    parsed.data.research_paper_ids.map((paperId, index) =>
      supabase
        .from('research_papers')
        .update({ sort_order: index })
        .eq('id', paperId)
        .eq('profile_id', profileResult.profile.id)
        .eq('owner_user_id', auth.user.id)
        .eq('tenant_id', profileResult.profile.tenant_id),
    ),
  );

  if (sortUpdates.some((result) => result.error)) {
    return { error: 'Could not reorder research papers.' };
  }

  return {
    success: true,
    profileSlug: profileResult.profile.slug,
  };
}

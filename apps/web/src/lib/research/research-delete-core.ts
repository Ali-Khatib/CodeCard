import type { SupabaseClient } from '@supabase/supabase-js';
import {
  loadOwnedResearchPaper,
  resolveAuthenticatedUser,
  type AuthUser,
} from '@/lib/research/research-access-core';

export type ResearchDeleteState = {
  success?: boolean;
  alreadyDeleted?: boolean;
  error?: string;
  errorCode?: 'auth' | 'not_found' | 'server';
  researchPaperId?: string;
  paperSlug?: string | null;
  profileSlug?: string | null;
  wasPublished?: boolean;
  redirectTo?: string;
};

/**
 * Deletes an owned research paper.
 *
 * Idempotency: if the paper is already gone or not visible to this owner,
 * return a safe already-removed success without revealing whether a foreign
 * paper exists. Related projects and external URLs are never deleted.
 * research_figures cascade via FK. CodeCard storage cleanup is N/A until
 * research PDF/figure uploads land (WS04-T007/T008).
 */
export async function executeDeleteResearch(
  supabase: SupabaseClient,
  researchPaperId: string,
  options?: { user?: AuthUser | null },
): Promise<ResearchDeleteState> {
  const auth = await resolveAuthenticatedUser(supabase, options);
  if ('error' in auth) {
    return { error: auth.error, errorCode: auth.errorCode };
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(researchPaperId)) {
    return {
      success: true,
      alreadyDeleted: true,
      redirectTo: '/dashboard/research',
    };
  }

  const owned = await loadOwnedResearchPaper(supabase, {
    userId: auth.user.id,
    researchPaperId,
  });

  if ('error' in owned) {
    if (owned.errorCode === 'not_found') {
      return {
        success: true,
        alreadyDeleted: true,
        researchPaperId,
        redirectTo: '/dashboard/research',
      };
    }
    return { error: owned.error, errorCode: owned.errorCode };
  }

  const { paper, profile } = owned;

  const { error } = await supabase
    .from('research_papers')
    .delete()
    .eq('id', paper.id)
    .eq('owner_user_id', auth.user.id);

  if (error) {
    return {
      error: 'Could not delete this research paper. Please try again.',
      errorCode: 'server',
    };
  }

  return {
    success: true,
    researchPaperId: paper.id,
    paperSlug: paper.slug,
    profileSlug: profile.slug,
    wasPublished: paper.is_published,
    redirectTo: '/dashboard/research',
  };
}

export const RESEARCH_DELETE_STORAGE_DEFERRED = true;

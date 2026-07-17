import type { SupabaseClient } from '@supabase/supabase-js';
import {
  loadOwnedResearchPaper,
  resolveAuthenticatedUser,
  type AuthUser,
  type OwnedResearchRecord,
} from '@/lib/research/research-access-core';
import { emitResearchPublishedActivity } from '@/lib/circle/circle-emit-core';

export type ResearchPublishState = {
  success?: boolean;
  error?: string;
  errorCode?: 'auth' | 'validation' | 'not_found' | 'server';
  fieldErrors?: Partial<Record<'title' | 'slug' | 'authors' | 'abstract', string>>;
  researchPaperId?: string;
  paperSlug?: string | null;
  is_published?: boolean;
  profileSlug?: string | null;
  profileIsPublic?: boolean;
};

export type ResearchPublishReadiness = {
  ready: boolean;
  fieldErrors: NonNullable<ResearchPublishState['fieldErrors']>;
  error?: string;
};

/**
 * Minimal publication readiness: title and slug must be present and non-empty.
 * Authors/abstract/PDF/DOI/related project are not required.
 */
export function evaluateResearchPublishReadiness(
  paper: Pick<OwnedResearchRecord, 'title' | 'slug' | 'authors' | 'abstract'>,
): ResearchPublishReadiness {
  const fieldErrors: NonNullable<ResearchPublishState['fieldErrors']> = {};

  const title = paper.title?.trim() ?? '';
  const slug = paper.slug?.trim() ?? '';

  if (!title) {
    fieldErrors.title = 'Add a title before publishing.';
  }
  if (!slug) {
    fieldErrors.slug = 'Add a URL slug before publishing.';
  }

  const keys = Object.keys(fieldErrors);
  if (keys.length > 0) {
    return {
      ready: false,
      fieldErrors,
      error: fieldErrors.title ?? fieldErrors.slug ?? 'Finish required fields before publishing.',
    };
  }

  return { ready: true, fieldErrors: {} };
}

export async function executeSetResearchPublished(
  supabase: SupabaseClient,
  input: { researchPaperId: string; isPublished: boolean },
  options?: { user?: AuthUser | null },
): Promise<ResearchPublishState> {
  const auth = await resolveAuthenticatedUser(supabase, options);
  if ('error' in auth) {
    return { error: auth.error, errorCode: auth.errorCode };
  }

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.researchPaperId,
    )
  ) {
    return { error: 'Research paper not found.', errorCode: 'not_found' };
  }

  const owned = await loadOwnedResearchPaper(supabase, {
    userId: auth.user.id,
    researchPaperId: input.researchPaperId,
  });
  if ('error' in owned) {
    return { error: owned.error, errorCode: owned.errorCode };
  }

  const { paper, profile } = owned;

  if (input.isPublished) {
    const readiness = evaluateResearchPublishReadiness(paper);
    if (!readiness.ready) {
      return {
        error: readiness.error,
        fieldErrors: readiness.fieldErrors,
        errorCode: 'validation',
        researchPaperId: paper.id,
        paperSlug: paper.slug,
        is_published: paper.is_published,
        profileSlug: profile.slug,
        profileIsPublic: profile.is_public,
      };
    }
  }

  const wasPublished = paper.is_published;

  if (paper.is_published === input.isPublished) {
    return {
      success: true,
      researchPaperId: paper.id,
      paperSlug: paper.slug,
      is_published: paper.is_published,
      profileSlug: profile.slug,
      profileIsPublic: profile.is_public,
    };
  }

  const { error } = await supabase
    .from('research_papers')
    .update({ is_published: input.isPublished })
    .eq('id', paper.id)
    .eq('owner_user_id', auth.user.id);

  if (error) {
    return {
      error: 'Could not update research visibility. Please try again.',
      errorCode: 'server',
    };
  }

  if (!wasPublished && input.isPublished) {
    await emitResearchPublishedActivity(supabase, {
      tenantId: paper.tenant_id,
      actorProfileId: paper.profile_id,
      researchPaperId: paper.id,
    });
  }

  return {
    success: true,
    researchPaperId: paper.id,
    paperSlug: paper.slug,
    is_published: input.isPublished,
    profileSlug: profile.slug,
    profileIsPublic: profile.is_public,
  };
}

export async function executePublishResearch(
  supabase: SupabaseClient,
  researchPaperId: string,
  options?: { user?: AuthUser | null },
): Promise<ResearchPublishState> {
  return executeSetResearchPublished(
    supabase,
    { researchPaperId, isPublished: true },
    options,
  );
}

export async function executeUnpublishResearch(
  supabase: SupabaseClient,
  researchPaperId: string,
  options?: { user?: AuthUser | null },
): Promise<ResearchPublishState> {
  return executeSetResearchPublished(
    supabase,
    { researchPaperId, isPublished: false },
    options,
  );
}

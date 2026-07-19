import {
  findForbiddenUpdateResearchFields,
  findForbiddenUpdateResearchFormData,
  RESEARCH_SLUG_TAKEN_MESSAGE,
  updateResearchSchema,
  type UpdateResearchPayload,
} from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  assertOwnedRelatedProject,
  loadOwnedResearchPaper,
  resolveAuthenticatedUser,
  type AuthUser,
} from '@/lib/research/research-access-core';
import {
  mapResearchCreateDbError,
  parseCreateResearchFormData,
} from '@/lib/research/research-create-core';
import { emitResearchUpdatedActivity } from '@/lib/circle/circle-emit-core';
import { researchHasMeaningfulChange } from '@/lib/circle/circle-fingerprint';

export type ResearchUpdateFieldErrors = Partial<
  Record<
    | 'title'
    | 'slug'
    | 'abstract'
    | 'authors'
    | 'venue'
    | 'publication_status'
    | 'year'
    | 'doi_url'
    | 'pdf_url'
    | 'citation_text'
    | 'tags'
    | 'related_project_id',
    string
  >
>;

export type ResearchUpdateState = {
  success?: boolean;
  researchPaperId?: string;
  slug?: string;
  error?: string;
  fieldErrors?: ResearchUpdateFieldErrors;
  errorCode?: 'auth' | 'validation' | 'slug_taken' | 'not_found' | 'server';
  previousSlug?: string;
  profileSlug?: string | null;
  isPublished?: boolean;
};

export function parseUpdateResearchFormData(formData: FormData) {
  const base = parseCreateResearchFormData(formData);
  // Preserve existing related_project_id unless the client explicitly posts the field.
  // T003 does not expose a picker yet (WS05-T008); omitting the field must not clear links.
  const hasRelatedKey = formData.has('related_project_id');
  return {
    research_paper_id: String(formData.get('research_paper_id') ?? ''),
    ...base,
    related_project_id: hasRelatedKey ? base.related_project_id : undefined,
  };
}

export function validateUpdateResearchPayload(
  payload: Record<string, unknown>,
):
  | { success: true; data: UpdateResearchPayload }
  | { success: false; state: ResearchUpdateState } {
  const forbidden = findForbiddenUpdateResearchFields(payload);
  if (forbidden) {
    return {
      success: false,
      state: { error: forbidden, errorCode: 'validation' },
    };
  }

  const parsed = updateResearchSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    const field = first?.path[0];
    const message = first?.message ?? 'Invalid research details.';
    if (typeof field === 'string' && field !== 'research_paper_id') {
      return {
        success: false,
        state: {
          fieldErrors: { [field]: message } as ResearchUpdateFieldErrors,
          error: message,
          errorCode: 'validation',
        },
      };
    }
    return {
      success: false,
      state: { error: message, errorCode: 'validation' },
    };
  }

  return { success: true, data: parsed.data };
}

function mapUpdateDbError(error: {
  code?: string;
  message?: string;
}): ResearchUpdateState {
  const mapped = mapResearchCreateDbError(error);
  if (mapped.errorCode === 'slug_taken') {
    return {
      fieldErrors: { slug: RESEARCH_SLUG_TAKEN_MESSAGE },
      error: RESEARCH_SLUG_TAKEN_MESSAGE,
      errorCode: 'slug_taken',
    };
  }
  return {
    error: 'Could not save research paper. Please try again.',
    errorCode: 'server',
  };
}

export async function executeUpdateResearch(
  supabase: SupabaseClient,
  formData: FormData,
  options?: { user?: AuthUser | null },
): Promise<ResearchUpdateState> {
  const forbiddenFormField = findForbiddenUpdateResearchFormData(formData);
  if (forbiddenFormField) {
    return { error: forbiddenFormField, errorCode: 'validation' };
  }

  const auth = await resolveAuthenticatedUser(supabase, options);
  if ('error' in auth) {
    return { error: auth.error, errorCode: auth.errorCode };
  }

  const payload = parseUpdateResearchFormData(formData);
  const validated = validateUpdateResearchPayload(payload);
  if (!validated.success) {
    return validated.state;
  }

  const owned = await loadOwnedResearchPaper(supabase, {
    userId: auth.user.id,
    researchPaperId: validated.data.research_paper_id,
  });
  if ('error' in owned) {
    return { error: owned.error, errorCode: owned.errorCode };
  }

  const { paper, profile } = owned;
  const data = validated.data;

  if (data.related_project_id) {
    const related = await assertOwnedRelatedProject(supabase, {
      projectId: data.related_project_id,
      ownerUserId: auth.user.id,
      profileId: profile.id,
      tenantId: profile.tenant_id,
    });
    if (!related.ok) {
      return {
        fieldErrors: { related_project_id: related.message },
        error: related.message,
        errorCode: 'validation',
      };
    }
  }

  const previousSlug = paper.slug;

  const { error: updateError } = await supabase
    .from('research_papers')
    .update({
      title: data.title,
      slug: data.slug,
      abstract: data.abstract ?? null,
      authors: data.authors ?? [],
      venue: data.venue ?? null,
      publication_status: data.publication_status ?? null,
      year: data.year ?? null,
      doi_url: data.doi_url ?? null,
      pdf_url: data.pdf_url ?? null,
      citation_text: data.citation_text ?? null,
      tags: data.tags ?? [],
      related_project_id:
        data.related_project_id === undefined
          ? paper.related_project_id
          : data.related_project_id,
    })
    .eq('id', paper.id)
    .eq('owner_user_id', auth.user.id);

  if (updateError) {
    return mapUpdateDbError(updateError);
  }

  if (paper.is_published) {
    const before = {
      title: paper.title,
      abstract: paper.abstract,
      slug: paper.slug,
      authors: paper.authors ?? [],
      venue: paper.venue,
      publication_status: paper.publication_status,
      pdf_url: paper.pdf_url,
      cover_image_url: paper.cover_image_url,
      year: paper.year,
    };
    const after = {
      title: data.title,
      abstract: data.abstract ?? null,
      slug: data.slug,
      authors: data.authors ?? [],
      venue: data.venue ?? null,
      publication_status: data.publication_status ?? null,
      pdf_url: data.pdf_url ?? null,
      cover_image_url: paper.cover_image_url,
      year: data.year ?? null,
    };
    if (researchHasMeaningfulChange(before, after)) {
      // Best-effort: a Circle emit failure must never roll back a successful update.
      try {
        await emitResearchUpdatedActivity(supabase, {
          tenantId: paper.tenant_id,
          actorProfileId: paper.profile_id,
          researchPaperId: paper.id,
          ...after,
        });
      } catch {
        // Intentionally ignored — mutation already succeeded.
      }
    }
  }

  return {
    success: true,
    researchPaperId: paper.id,
    slug: data.slug,
    previousSlug,
    profileSlug: profile.slug,
    isPublished: paper.is_published,
  };
}

export { RESEARCH_SLUG_TAKEN_MESSAGE };

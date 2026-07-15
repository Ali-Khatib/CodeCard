import {
  createResearchSchema,
  findForbiddenCreateResearchFields,
  findForbiddenCreateResearchFormData,
  RESEARCH_SLUG_TAKEN_MESSAGE,
  type CreateResearchPayload,
} from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ResearchCreateFieldErrors = Partial<
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

export type ResearchCreateState = {
  success?: boolean;
  researchPaperId?: string;
  slug?: string;
  redirectTo?: string;
  error?: string;
  fieldErrors?: ResearchCreateFieldErrors;
  errorCode?: 'auth' | 'validation' | 'slug_taken' | 'server';
};

type AuthUser = { id: string };

type OwnedProfileRow = {
  id: string;
  tenant_id: string;
  owner_user_id: string;
};

export function parseCreateResearchFormData(formData: FormData) {
  const authorsFromList = formData.getAll('authors').map(String);
  const authors =
    authorsFromList.filter((item) => item.trim()).length > 0
      ? authorsFromList
      : String(formData.get('authors') ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

  const tagsFromList = formData.getAll('tags').map(String);
  const tags =
    tagsFromList.filter((item) => item.trim()).length > 0
      ? tagsFromList
      : String(formData.get('tags') ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

  const relatedRaw = String(formData.get('related_project_id') ?? '').trim();
  const yearRaw = String(formData.get('year') ?? '').trim();

  return {
    title: String(formData.get('title') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    abstract: String(formData.get('abstract') ?? '') || null,
    authors,
    venue: String(formData.get('venue') ?? '') || null,
    publication_status: String(formData.get('publication_status') ?? '') || null,
    year: yearRaw === '' ? null : yearRaw,
    doi_url: String(formData.get('doi_url') ?? '') || null,
    pdf_url: String(formData.get('pdf_url') ?? '') || null,
    citation_text: String(formData.get('citation_text') ?? '') || null,
    tags,
    related_project_id: relatedRaw === '' ? null : relatedRaw,
  };
}

export function validateCreateResearchPayload(
  payload: Record<string, unknown>,
):
  | { success: true; data: CreateResearchPayload }
  | { success: false; state: ResearchCreateState } {
  const forbidden = findForbiddenCreateResearchFields(payload);
  if (forbidden) {
    return {
      success: false,
      state: { error: forbidden, errorCode: 'validation' },
    };
  }

  const parsed = createResearchSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    const field = first?.path[0];
    const message = first?.message ?? 'Invalid research details.';
    if (typeof field === 'string') {
      return {
        success: false,
        state: {
          fieldErrors: { [field]: message } as ResearchCreateFieldErrors,
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

export function mapResearchCreateDbError(error: {
  code?: string;
  message?: string;
}): ResearchCreateState {
  if (error.code === '23505') {
    return {
      fieldErrors: { slug: RESEARCH_SLUG_TAKEN_MESSAGE },
      error: RESEARCH_SLUG_TAKEN_MESSAGE,
      errorCode: 'slug_taken',
    };
  }
  return {
    error: 'Could not create research paper. Please try again.',
    errorCode: 'server',
  };
}

async function resolveNextResearchSortOrder(
  supabase: SupabaseClient,
  profileId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('research_papers')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId);

  if (error || count == null) {
    return 0;
  }

  return count;
}

async function assertOwnedRelatedProject(
  supabase: SupabaseClient,
  options: {
    projectId: string;
    ownerUserId: string;
    profileId: string;
    tenantId: string;
  },
): Promise<{ ok: true } | { ok: false; state: ResearchCreateState }> {
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, owner_user_id, profile_id, tenant_id')
    .eq('id', options.projectId)
    .eq('owner_user_id', options.ownerUserId)
    .maybeSingle();

  if (error || !project) {
    return {
      ok: false,
      state: {
        fieldErrors: { related_project_id: 'Select one of your projects.' },
        error: 'Select one of your projects.',
        errorCode: 'validation',
      },
    };
  }

  const row = project as {
    owner_user_id: string;
    profile_id: string;
    tenant_id: string;
  };

  if (
    row.owner_user_id !== options.ownerUserId ||
    row.profile_id !== options.profileId ||
    row.tenant_id !== options.tenantId
  ) {
    return {
      ok: false,
      state: {
        fieldErrors: { related_project_id: 'Select one of your projects.' },
        error: 'Select one of your projects.',
        errorCode: 'validation',
      },
    };
  }

  return { ok: true };
}

export async function executeCreateResearch(
  supabase: SupabaseClient,
  formData: FormData,
  options?: { user?: AuthUser | null },
): Promise<ResearchCreateState> {
  const forbiddenFormField = findForbiddenCreateResearchFormData(formData);
  if (forbiddenFormField) {
    return { error: forbiddenFormField, errorCode: 'validation' };
  }

  let user = options?.user;
  if (user === undefined) {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  }

  if (!user) {
    return {
      error: 'You must be signed in to create research.',
      errorCode: 'auth',
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, tenant_id, owner_user_id')
    .eq('owner_user_id', user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: 'Profile not found. Finish sign-up before creating research.',
      errorCode: 'auth',
    };
  }

  const ownedProfile = profile as OwnedProfileRow;

  const payload = parseCreateResearchFormData(formData);
  const validated = validateCreateResearchPayload(payload);
  if (!validated.success) {
    return validated.state;
  }

  const data = validated.data;

  if (data.related_project_id) {
    const related = await assertOwnedRelatedProject(supabase, {
      projectId: data.related_project_id,
      ownerUserId: user.id,
      profileId: ownedProfile.id,
      tenantId: ownedProfile.tenant_id,
    });
    if (!related.ok) {
      return related.state;
    }
  }

  const sortOrder = await resolveNextResearchSortOrder(supabase, ownedProfile.id);

  const { data: paper, error: insertError } = await supabase
    .from('research_papers')
    .insert({
      tenant_id: ownedProfile.tenant_id,
      profile_id: ownedProfile.id,
      owner_user_id: user.id,
      related_project_id: data.related_project_id ?? null,
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
      cover_image_url: null,
      is_published: false,
      sort_order: sortOrder,
    })
    .select('id, slug')
    .single();

  if (insertError || !paper) {
    return mapResearchCreateDbError(insertError ?? { message: 'insert failed' });
  }

  return {
    success: true,
    researchPaperId: paper.id as string,
    slug: paper.slug as string,
    redirectTo: '/dashboard/research',
  };
}

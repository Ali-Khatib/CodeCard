import type { SupabaseClient } from '@supabase/supabase-js';

export const RESEARCH_NOT_FOUND_MESSAGE = 'Research paper not found.';

export type AuthUser = { id: string };

export type OwnedProfileContext = {
  id: string;
  tenant_id: string;
  owner_user_id: string;
  slug: string | null;
  is_public: boolean;
};

export type OwnedResearchRecord = {
  id: string;
  tenant_id: string;
  profile_id: string;
  owner_user_id: string;
  related_project_id: string | null;
  slug: string;
  title: string;
  abstract: string | null;
  authors: string[];
  venue: string | null;
  publication_status: string | null;
  year: number | null;
  pdf_url: string | null;
  doi_url: string | null;
  citation_text: string | null;
  tags: string[];
  cover_image_url: string | null;
  is_published: boolean;
  sort_order: number;
};

type AccessError = {
  error: string;
  errorCode: 'auth' | 'not_found';
};

const RESEARCH_SELECT =
  'id, tenant_id, profile_id, owner_user_id, related_project_id, slug, title, abstract, authors, venue, publication_status, year, pdf_url, doi_url, citation_text, tags, cover_image_url, is_published, sort_order';

export async function resolveAuthenticatedUser(
  supabase: SupabaseClient,
  options?: { user?: AuthUser | null },
): Promise<{ user: AuthUser } | AccessError> {
  let user = options?.user;
  if (user === undefined) {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  }

  if (!user) {
    return {
      error: 'You must be signed in to continue.',
      errorCode: 'auth',
    };
  }

  return { user };
}

export async function resolveOwnedProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ profile: OwnedProfileContext } | AccessError> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, tenant_id, owner_user_id, slug, is_public')
    .eq('owner_user_id', userId)
    .single();

  if (error || !profile) {
    return {
      error: 'Profile not found.',
      errorCode: 'auth',
    };
  }

  return { profile: profile as OwnedProfileContext };
}

export async function loadOwnedResearchPaper(
  supabase: SupabaseClient,
  input: { userId: string; researchPaperId: string },
): Promise<
  | { paper: OwnedResearchRecord; profile: OwnedProfileContext }
  | AccessError
> {
  const profileResult = await resolveOwnedProfile(supabase, input.userId);
  if ('error' in profileResult) {
    return profileResult;
  }

  const { profile } = profileResult;
  const { data: paper, error } = await supabase
    .from('research_papers')
    .select(RESEARCH_SELECT)
    .eq('id', input.researchPaperId)
    .eq('owner_user_id', input.userId)
    .eq('profile_id', profile.id)
    .eq('tenant_id', profile.tenant_id)
    .maybeSingle();

  if (error || !paper) {
    return {
      error: RESEARCH_NOT_FOUND_MESSAGE,
      errorCode: 'not_found',
    };
  }

  return {
    paper: paper as OwnedResearchRecord,
    profile,
  };
}

export async function assertOwnedRelatedProject(
  supabase: SupabaseClient,
  options: {
    projectId: string;
    ownerUserId: string;
    profileId: string;
    tenantId: string;
  },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, owner_user_id, profile_id, tenant_id')
    .eq('id', options.projectId)
    .eq('owner_user_id', options.ownerUserId)
    .maybeSingle();

  if (error || !project) {
    return { ok: false, message: 'Select one of your projects.' };
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
    return { ok: false, message: 'Select one of your projects.' };
  }

  return { ok: true };
}

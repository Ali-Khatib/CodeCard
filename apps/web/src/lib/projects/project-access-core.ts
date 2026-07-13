import type { SupabaseClient } from '@supabase/supabase-js';

export const PROJECT_NOT_FOUND_MESSAGE = 'Project not found.';

export type AuthUser = { id: string };

export type OwnedProfileContext = {
  id: string;
  tenant_id: string;
  owner_user_id: string;
  slug: string | null;
  is_public: boolean;
};

export type OwnedProjectRecord = {
  id: string;
  tenant_id: string;
  profile_id: string;
  owner_user_id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  technologies: string[];
  user_role: string | null;
  started_at: string | null;
  ended_at: string | null;
  status: string | null;
  is_published: boolean;
  sort_order: number;
};

type AccessError = {
  error: string;
  errorCode: 'auth' | 'not_found';
};

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

export async function loadOwnedProject(
  supabase: SupabaseClient,
  input: { userId: string; projectId: string },
): Promise<
  | { project: OwnedProjectRecord; profile: OwnedProfileContext }
  | AccessError
> {
  const profileResult = await resolveOwnedProfile(supabase, input.userId);
  if ('error' in profileResult) {
    return profileResult;
  }

  const { profile } = profileResult;
  const { data: project, error } = await supabase
    .from('projects')
    .select(
      'id, tenant_id, profile_id, owner_user_id, slug, title, tagline, description, technologies, user_role, started_at, ended_at, status, is_published, sort_order',
    )
    .eq('id', input.projectId)
    .eq('owner_user_id', input.userId)
    .eq('profile_id', profile.id)
    .eq('tenant_id', profile.tenant_id)
    .maybeSingle();

  if (error || !project) {
    return {
      error: PROJECT_NOT_FOUND_MESSAGE,
      errorCode: 'not_found',
    };
  }

  return {
    project: project as OwnedProjectRecord,
    profile,
  };
}

export async function loadOwnedProjectWithRelations(
  supabase: SupabaseClient,
  input: { userId: string; projectId: string },
): Promise<
  | {
      project: OwnedProjectRecord;
      profile: OwnedProfileContext;
      domains: string[];
      focus_areas: string[];
    }
  | AccessError
> {
  const owned = await loadOwnedProject(supabase, input);
  if ('error' in owned) {
    return owned;
  }

  const { data: domainRows } = await supabase
    .from('project_domains')
    .select('name')
    .eq('project_id', owned.project.id);

  const { data: focusRows } = await supabase
    .from('project_focus_areas')
    .select('name')
    .eq('project_id', owned.project.id);

  return {
    ...owned,
    domains: (domainRows ?? []).map((row) => row.name as string),
    focus_areas: (focusRows ?? []).map((row) => row.name as string),
  };
}

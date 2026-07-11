import type { SupabaseClient } from '@supabase/supabase-js';

export type AuthUser = { id: string };

export type OwnedProfileContext = {
  id: string;
  tenant_id: string;
  owner_user_id: string;
  slug: string;
  is_public: boolean;
};

export type ResolveOwnedProfileResult =
  | { error: string }
  | { profile: OwnedProfileContext };

export async function resolveOwnedProfile(
  supabase: SupabaseClient,
  user: AuthUser | null,
): Promise<ResolveOwnedProfileResult> {
  if (!user) {
    return { error: 'You must be signed in.' };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, tenant_id, owner_user_id, slug, is_public')
    .eq('owner_user_id', user.id)
    .single();

  if (error || !profile) {
    return { error: 'Profile not found.' };
  }

  return { profile };
}

export async function getAuthenticatedUser(
  supabase: SupabaseClient,
  options?: { user?: AuthUser | null },
): Promise<AuthUser | null> {
  if (options?.user !== undefined) {
    return options.user;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

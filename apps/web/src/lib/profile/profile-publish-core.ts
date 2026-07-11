import type { SupabaseClient } from '@supabase/supabase-js';

export type ProfilePublishState = {
  success?: boolean;
  error?: string;
  is_public?: boolean;
  slug?: string;
};

type AuthUser = { id: string };

async function resolveOwnedProfile(supabase: SupabaseClient, user: AuthUser | null) {
  if (!user) {
    return { error: 'You must be signed in to change profile visibility.' as const };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, slug, is_public, owner_user_id')
    .eq('owner_user_id', user.id)
    .single();

  if (error || !profile) {
    return { error: 'Profile not found.' as const };
  }

  return { profile };
}

export async function executePublishProfile(
  supabase: SupabaseClient,
  options?: { user?: AuthUser | null },
): Promise<ProfilePublishState> {
  let user = options?.user;
  if (user === undefined) {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  }

  const resolved = await resolveOwnedProfile(supabase, user);
  if ('error' in resolved) {
    return { error: resolved.error };
  }

  const { profile } = resolved;
  if (profile.is_public) {
    return { success: true, is_public: true, slug: profile.slug };
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_public: true })
    .eq('id', profile.id);

  if (updateError) {
    return { error: 'Could not publish your profile. Please try again.' };
  }

  return { success: true, is_public: true, slug: profile.slug };
}

export async function executeUnpublishProfile(
  supabase: SupabaseClient,
  options?: { user?: AuthUser | null },
): Promise<ProfilePublishState> {
  let user = options?.user;
  if (user === undefined) {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  }

  const resolved = await resolveOwnedProfile(supabase, user);
  if ('error' in resolved) {
    return { error: resolved.error };
  }

  const { profile } = resolved;
  if (!profile.is_public) {
    return { success: true, is_public: false, slug: profile.slug };
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_public: false })
    .eq('id', profile.id);

  if (updateError) {
    return { error: 'Could not unpublish your profile. Please try again.' };
  }

  return { success: true, is_public: false, slug: profile.slug };
}

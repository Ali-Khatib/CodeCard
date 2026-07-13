import type { SupabaseClient } from '@supabase/supabase-js';
import {
  calculateProfileCompletion,
  deriveProfileCompletionInput,
  type ProfileCompletionResult,
} from '@/lib/profile/completion';

export type ProfileCompletionFlags = {
  hasProfileLink: boolean;
  hasPublishedProject: boolean;
  hasAnyProject: boolean;
};

export type LoadProfileCompletionResult =
  | {
      ok: true;
      completion: ProfileCompletionResult;
      hasAnyProject: boolean;
    }
  | {
      ok: false;
      error: string;
    };

export async function loadProfileCompletionFlags(
  supabase: SupabaseClient,
  profileId: string,
): Promise<ProfileCompletionFlags & { error?: string }> {
  const [linksResult, publishedResult, anyProjectResult] = await Promise.all([
    supabase
      .from('profile_links')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profileId),
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .eq('is_published', true),
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profileId),
  ]);

  if (linksResult.error || publishedResult.error || anyProjectResult.error) {
    return {
      hasProfileLink: false,
      hasPublishedProject: false,
      hasAnyProject: false,
      error: 'Could not load profile completion data.',
    };
  }

  return {
    hasProfileLink: (linksResult.count ?? 0) > 0,
    hasPublishedProject: (publishedResult.count ?? 0) > 0,
    hasAnyProject: (anyProjectResult.count ?? 0) > 0,
  };
}

export async function loadProfileCompletion(
  supabase: SupabaseClient,
  profile: {
    id: string;
    headline?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
  },
): Promise<LoadProfileCompletionResult> {
  const flags = await loadProfileCompletionFlags(supabase, profile.id);

  if (flags.error) {
    return { ok: false, error: flags.error };
  }

  const input = deriveProfileCompletionInput(profile, flags);
  const completion = calculateProfileCompletion(input, {
    hasAnyProject: flags.hasAnyProject,
  });

  return {
    ok: true,
    completion,
    hasAnyProject: flags.hasAnyProject,
  };
}

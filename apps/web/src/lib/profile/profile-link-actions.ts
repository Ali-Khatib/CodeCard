'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  executeCreateProfileLink,
  executeDeleteProfileLink,
  executeMoveProfileLink,
  executeUpdateProfileLink,
  type ProfileLinkMutationState,
} from '@/lib/profile/profile-link-core';
import { resolveOwnedProfile } from '@/lib/profile/profile-auth-core';

export type { ProfileLinkMutationState };

async function revalidateProfilePaths(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const resolved = await resolveOwnedProfile(supabase, user);
  if ('error' in resolved) return;
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profile');
  if (resolved.profile.slug) {
    revalidatePath(`/${resolved.profile.slug}`);
  }
}

export async function createProfileLinkAction(
  _prev: ProfileLinkMutationState,
  formData: FormData,
): Promise<ProfileLinkMutationState> {
  const supabase = await createClient();
  const result = await executeCreateProfileLink(supabase, formData);
  if (result.success) {
    await revalidateProfilePaths(supabase);
  }
  return result;
}

export async function updateProfileLinkAction(
  _prev: ProfileLinkMutationState,
  formData: FormData,
): Promise<ProfileLinkMutationState> {
  const supabase = await createClient();
  const result = await executeUpdateProfileLink(supabase, formData);
  if (result.success) {
    await revalidateProfilePaths(supabase);
  }
  return result;
}

export async function deleteProfileLinkAction(linkId: string): Promise<ProfileLinkMutationState> {
  const supabase = await createClient();
  const result = await executeDeleteProfileLink(supabase, linkId);
  if (result.success) {
    await revalidateProfilePaths(supabase);
  }
  return result;
}

export async function moveProfileLinkAction(
  linkId: string,
  direction: 'up' | 'down',
): Promise<ProfileLinkMutationState> {
  const supabase = await createClient();
  const result = await executeMoveProfileLink(supabase, linkId, direction);
  if (result.success) {
    await revalidateProfilePaths(supabase);
  }
  return result;
}

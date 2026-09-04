'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  GITHUB_LAST_IDENTITY_MESSAGE,
  GITHUB_NOT_CONNECTED_MESSAGE,
  canDisconnectGithub,
  findGithubIdentity,
} from '@/lib/auth/github-oauth';

export type DisconnectGithubResult =
  | { ok: true }
  | { ok: false; message: string };

export async function disconnectGithubIdentity(): Promise<DisconnectGithubResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: 'You need to sign in again.' };
  }

  const identities = user.identities ?? [];
  if (!canDisconnectGithub(identities)) {
    return {
      ok: false,
      message: hasOnlyGithub(identities)
        ? GITHUB_LAST_IDENTITY_MESSAGE
        : GITHUB_NOT_CONNECTED_MESSAGE,
    };
  }

  const githubIdentity = findGithubIdentity(identities);
  if (!githubIdentity) {
    return { ok: false, message: GITHUB_NOT_CONNECTED_MESSAGE };
  }

  const { error } = await supabase.auth.unlinkIdentity(githubIdentity);
  if (error) {
    return { ok: false, message: 'GitHub could not be disconnected. Try again.' };
  }

  revalidatePath('/dashboard/settings');
  return { ok: true };
}

function hasOnlyGithub(identities: { provider?: string }[]): boolean {
  return identities.length === 1 && identities[0]?.provider === 'github';
}

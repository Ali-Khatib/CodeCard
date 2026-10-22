'use server';

import { createClient } from '@/lib/supabase/server';
import {
  executeProfileUpdate,
  type ProfileUpdateState,
} from '@/lib/profile/profile-update-core';
import { revalidateOwnedProfileCaches } from '@/lib/profile/profile-update-revalidate';

export type { ProfileUpdateState };

export async function updateProfileAction(
  _prev: ProfileUpdateState,
  formData: FormData,
): Promise<ProfileUpdateState> {
  const started = performance.now();
  const supabase = await createClient();
  const result = await executeProfileUpdate(supabase, formData);
  const { diagnostics, ...clientResult } = result;

  console.info('[profile-update]', {
    requestId: crypto.randomUUID(),
    totalMs: Math.round(performance.now() - started),
    authMs: diagnostics?.authMs ?? null,
    readMs: diagnostics?.readMs ?? null,
    writeMs: diagnostics?.writeMs ?? null,
    ok: Boolean(result.success),
    unchanged: Boolean(result.unchanged),
    code: result.code ?? null,
  });

  if (result.success && !result.unchanged) {
    revalidateOwnedProfileCaches({
      previousSlug: result.previousSlug,
      nextSlug: result.nextSlug,
    });
  }

  return clientResult;
}

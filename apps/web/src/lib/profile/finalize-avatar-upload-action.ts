'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  executeFinalizeAvatarUpload,
  type AvatarFinalizeState,
} from '@/lib/profile/profile-avatar-core';
import { revalidatePublicProfile } from '@/lib/profile/public-cache';

export type { AvatarFinalizeState };

export async function finalizeAvatarUploadAction(input: {
  path: string;
}): Promise<AvatarFinalizeState> {
  const supabase = await createClient();
  const result = await executeFinalizeAvatarUpload(supabase, input);

  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard/profile/preview');
    if (result.slug) {
      revalidatePublicProfile(result.slug);
    }
  }

  return result;
}

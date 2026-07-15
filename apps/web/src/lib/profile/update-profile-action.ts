'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  executeProfileUpdate,
  type ProfileUpdateState,
} from '@/lib/profile/profile-update-core';
import { revalidatePublicProfileSlugChange } from '@/lib/profile/public-cache';

export type { ProfileUpdateState };

export async function updateProfileAction(
  _prev: ProfileUpdateState,
  formData: FormData,
): Promise<ProfileUpdateState> {
  const supabase = await createClient();
  const result = await executeProfileUpdate(supabase, formData);

  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard/profile/preview');
    revalidatePublicProfileSlugChange({
      previousSlug: result.previousSlug,
      nextSlug: result.nextSlug,
    });
  }

  return result;
}

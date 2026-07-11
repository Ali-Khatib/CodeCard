'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  executePublishProfile,
  executeUnpublishProfile,
  type ProfilePublishState,
} from '@/lib/profile/profile-publish-core';

export type { ProfilePublishState };

export async function publishProfileAction(): Promise<ProfilePublishState> {
  const supabase = await createClient();
  const result = await executePublishProfile(supabase);

  if (result.success && result.slug) {
    revalidatePath('/dashboard');
    revalidatePath(`/${result.slug}`);
  }

  return result;
}

export async function unpublishProfileAction(): Promise<ProfilePublishState> {
  const supabase = await createClient();
  const result = await executeUnpublishProfile(supabase);

  if (result.success && result.slug) {
    revalidatePath('/dashboard');
    revalidatePath(`/${result.slug}`);
  }

  return result;
}

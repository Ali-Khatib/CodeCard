'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  executeFinalizeResumeUpload,
  executeRemoveResume,
  type ResumeFinalizeState,
} from '@/lib/profile/resume-core';
import { revalidatePublicProfile } from '@/lib/profile/public-cache';

export type { ResumeFinalizeState };

export async function finalizeResumeUploadAction(input: {
  path: string;
}): Promise<ResumeFinalizeState> {
  const supabase = await createClient();
  const result = await executeFinalizeResumeUpload(supabase, input);

  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profile');
    if (result.slug) {
      revalidatePublicProfile(result.slug);
      revalidatePath(`/${result.slug}/resume`);
    }
  }

  return result;
}

export async function removeResumeAction(): Promise<ResumeFinalizeState> {
  const supabase = await createClient();
  const result = await executeRemoveResume(supabase);

  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profile');
    if (result.slug) {
      revalidatePublicProfile(result.slug);
      revalidatePath(`/${result.slug}/resume`);
    }
  }

  return result;
}

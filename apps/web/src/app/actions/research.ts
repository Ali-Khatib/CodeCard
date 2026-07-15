'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  executeCreateResearch,
  type ResearchCreateState,
} from '@/lib/research/research-create-core';

export type { ResearchCreateState };

export async function createResearchAction(
  _prev: ResearchCreateState,
  formData: FormData,
): Promise<ResearchCreateState> {
  const supabase = await createClient();
  const result = await executeCreateResearch(supabase, formData);

  if (result.success) {
    revalidatePath('/dashboard/research');
  }

  return result;
}

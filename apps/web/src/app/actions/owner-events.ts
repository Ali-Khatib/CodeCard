'use server';

import { revalidatePath } from 'next/cache';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import {
  executeCreateOwnerEvent,
  executeDeleteOwnerEvent,
  ownerEventErrorMessage,
  type OwnerEventMutationState,
} from '@/lib/schedule/owner-events-core';

export type { OwnerEventMutationState };

async function withRateLimit(userId: string): Promise<OwnerEventMutationState | null> {
  const rl = await rateLimit(`connections:user:${userId}`, 'connections');
  if (!rl.success) {
    return {
      error: ownerEventErrorMessage('TEMPORARY_FAILURE'),
      code: 'TEMPORARY_FAILURE',
    };
  }
  return null;
}

function revalidateSchedule() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/connections');
}

export async function createOwnerEventAction(input: {
  title: string;
  location?: string | null;
  startsAt: string;
  endsAt?: string | null;
  notes?: string | null;
}): Promise<OwnerEventMutationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: ownerEventErrorMessage('UNAUTHENTICATED'), code: 'UNAUTHENTICATED' };
  }
  const limited = await withRateLimit(user.id);
  if (limited) return limited;
  const result = await executeCreateOwnerEvent(supabase, input, { user });
  if (result.success) revalidateSchedule();
  return result;
}

export async function deleteOwnerEventAction(input: {
  eventId: string;
}): Promise<OwnerEventMutationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: ownerEventErrorMessage('UNAUTHENTICATED'), code: 'UNAUTHENTICATED' };
  }
  const limited = await withRateLimit(user.id);
  if (limited) return limited;
  const result = await executeDeleteOwnerEvent(supabase, input, { user });
  if (result.success) revalidateSchedule();
  return result;
}

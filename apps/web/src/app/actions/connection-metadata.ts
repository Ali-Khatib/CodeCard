'use server';

import { revalidatePath } from 'next/cache';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import {
  executeReadConnectionMetadata,
  executeUpdateConnectionMetadata,
  metadataErrorMessage,
  type MetadataMutationState,
  type MetadataReadResult,
} from '@/lib/connections/connection-metadata-core';

export type { MetadataMutationState, MetadataReadResult };

async function withRateLimit(userId: string): Promise<MetadataMutationState | null> {
  const rl = await rateLimit(`connections:user:${userId}`, 'connections');
  if (!rl.success) {
    return { error: metadataErrorMessage('TEMPORARY_FAILURE'), code: 'TEMPORARY_FAILURE' };
  }
  return null;
}

export async function getConnectionMetadataAction(input: {
  connectionId: string;
}): Promise<MetadataReadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return executeReadConnectionMetadata(supabase, input, { user: user ?? null });
}

export async function updateConnectionMetadataAction(input: {
  connectionId: string;
  privateNote?: string | null;
  context?: string | null;
  connectedAt?: string | null;
  metAt?: string | null;
  source?: 'qr' | 'nfc' | 'direct_link' | 'manual' | 'app';
}): Promise<MetadataMutationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: metadataErrorMessage('UNAUTHENTICATED'), code: 'UNAUTHENTICATED' };
  }
  const limited = await withRateLimit(user.id);
  if (limited) return limited;

  const result = await executeUpdateConnectionMetadata(supabase, input, { user });
  if (result.success) {
    revalidatePath('/dashboard/connections');
  }
  return result;
}

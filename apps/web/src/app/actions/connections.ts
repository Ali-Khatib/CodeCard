'use server';

import { revalidatePath } from 'next/cache';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import {
  connectionErrorMessage,
  executeAddConnection,
  executeConnectionStatus,
  executeRemoveConnection,
  listOwnerConnections,
  type ConnectionMutationState,
  type ConnectionStatusResult,
  type ListConnectionsResult,
} from '@/lib/connections/connections-core';

export type {
  ConnectionMutationState,
  ConnectionStatusResult,
  ListConnectionsResult,
};

async function withConnectionRateLimit(
  userId: string,
): Promise<ConnectionMutationState | null> {
  const rl = await rateLimit(`connections:user:${userId}`, 'connections');
  if (!rl.success) {
    return {
      error: connectionErrorMessage('RATE_LIMITED'),
      code: 'RATE_LIMITED',
    };
  }
  return null;
}

function revalidateConnectionPaths(targetSlug?: string | null) {
  revalidatePath('/dashboard/connections');
  if (targetSlug) {
    revalidatePath(`/${targetSlug}`);
  }
}

export async function addConnectionAction(input: {
  targetProfileId?: string;
  targetSlug?: string;
  source?: 'qr' | 'nfc' | 'direct_link' | 'manual' | 'app';
}): Promise<ConnectionMutationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: connectionErrorMessage('UNAUTHENTICATED'),
      code: 'UNAUTHENTICATED',
    };
  }

  const limited = await withConnectionRateLimit(user.id);
  if (limited) return limited;

  const result = await executeAddConnection(supabase, input, { user });
  if (result.success) {
    revalidateConnectionPaths(input.targetSlug ?? null);
  }
  return result;
}

export async function removeConnectionAction(input: {
  connectionId?: string;
  targetProfileId?: string;
  targetSlug?: string;
}): Promise<ConnectionMutationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: connectionErrorMessage('UNAUTHENTICATED'),
      code: 'UNAUTHENTICATED',
    };
  }

  const limited = await withConnectionRateLimit(user.id);
  if (limited) return limited;

  const result = await executeRemoveConnection(supabase, input, { user });
  if (result.success) {
    revalidateConnectionPaths(input.targetSlug ?? null);
  }
  return result;
}

export async function getConnectionStatusAction(input: {
  targetProfileId?: string;
  targetSlug?: string;
}): Promise<ConnectionStatusResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return executeConnectionStatus(supabase, input, { user: user ?? null });
}

export async function listConnectionsAction(): Promise<ListConnectionsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return listOwnerConnections(supabase, { user: user ?? null });
}

'use server';

import { revalidatePath } from 'next/cache';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import {
  collectionErrorMessage,
  executeAddConnectionToCollection,
  executeCreateCollection,
  executeDeleteCollection,
  executeRemoveConnectionFromCollection,
  executeUpdateCollection,
  listCollectionsForConnection,
  listOwnerCollections,
  type CollectionMutationState,
  type ConnectionCollectionsResult,
  type ListCollectionsResult,
} from '@/lib/connections/collections-core';

export type {
  CollectionMutationState,
  ConnectionCollectionsResult,
  ListCollectionsResult,
};

async function withRateLimit(userId: string): Promise<CollectionMutationState | null> {
  const rl = await rateLimit(`connections:user:${userId}`, 'connections');
  if (!rl.success) {
    return {
      error: collectionErrorMessage('TEMPORARY_FAILURE'),
      code: 'TEMPORARY_FAILURE',
    };
  }
  return null;
}

function revalidate() {
  revalidatePath('/dashboard/connections');
}

export async function createCollectionAction(input: {
  name: string;
  description?: string | null;
}): Promise<CollectionMutationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: collectionErrorMessage('UNAUTHENTICATED'), code: 'UNAUTHENTICATED' };
  }
  const limited = await withRateLimit(user.id);
  if (limited) return limited;
  const result = await executeCreateCollection(supabase, input, { user });
  if (result.success) revalidate();
  return result;
}

export async function updateCollectionAction(input: {
  collectionId: string;
  name?: string;
  description?: string | null;
}): Promise<CollectionMutationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: collectionErrorMessage('UNAUTHENTICATED'), code: 'UNAUTHENTICATED' };
  }
  const limited = await withRateLimit(user.id);
  if (limited) return limited;
  const result = await executeUpdateCollection(supabase, input, { user });
  if (result.success) revalidate();
  return result;
}

export async function deleteCollectionAction(input: {
  collectionId: string;
}): Promise<CollectionMutationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: collectionErrorMessage('UNAUTHENTICATED'), code: 'UNAUTHENTICATED' };
  }
  const limited = await withRateLimit(user.id);
  if (limited) return limited;
  const result = await executeDeleteCollection(supabase, input, { user });
  if (result.success) revalidate();
  return result;
}

export async function listCollectionsAction(): Promise<ListCollectionsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return listOwnerCollections(supabase, { user: user ?? null });
}

export async function addConnectionToCollectionAction(input: {
  collectionId: string;
  connectionId: string;
}): Promise<CollectionMutationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: collectionErrorMessage('UNAUTHENTICATED'), code: 'UNAUTHENTICATED' };
  }
  const limited = await withRateLimit(user.id);
  if (limited) return limited;
  const result = await executeAddConnectionToCollection(supabase, input, { user });
  if (result.success) revalidate();
  return result;
}

export async function removeConnectionFromCollectionAction(input: {
  collectionId: string;
  connectionId: string;
}): Promise<CollectionMutationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: collectionErrorMessage('UNAUTHENTICATED'), code: 'UNAUTHENTICATED' };
  }
  const limited = await withRateLimit(user.id);
  if (limited) return limited;
  const result = await executeRemoveConnectionFromCollection(supabase, input, { user });
  if (result.success) revalidate();
  return result;
}

export async function listConnectionCollectionsAction(input: {
  connectionId: string;
}): Promise<ConnectionCollectionsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return listCollectionsForConnection(supabase, input, { user: user ?? null });
}

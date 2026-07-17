import { LIMITS } from '@codecard/config';
import {
  collectionIdInputSchema,
  collectionMembershipInputSchema,
  connectionCollectionsInputSchema,
  createCollectionInputSchema,
  updateCollectionInputSchema,
} from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  COLLECTIONS_TABLE,
  COLLECTION_ITEMS_TABLE,
  CONNECTIONS_TABLE,
} from '@/lib/connections/connections-contract';
import {
  getAuthenticatedUser,
  resolveOwnedProfile,
  type AuthUser,
} from '@/lib/profile/profile-auth-core';

export type CollectionErrorCode =
  | 'UNAUTHENTICATED'
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'DUPLICATE_NAME'
  | 'ALREADY_MEMBER'
  | 'LIMIT_REACHED'
  | 'TEMPORARY_FAILURE';

export type OwnerCollection = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  connectionCount: number;
};

export type CollectionMutationState = {
  success?: boolean;
  alreadyMember?: boolean;
  error?: string;
  code?: CollectionErrorCode;
  collection?: OwnerCollection;
};

export type ListCollectionsResult = {
  collections: OwnerCollection[];
  error?: string;
  code?: CollectionErrorCode;
};

export type ConnectionCollectionsResult = {
  collectionIds: string[];
  collections: Array<{ id: string; name: string }>;
  error?: string;
  code?: CollectionErrorCode;
};

const ERROR_MESSAGES: Record<CollectionErrorCode, string> = {
  UNAUTHENTICATED: 'You must be signed in to manage collections.',
  INVALID_INPUT: 'That collection request is not valid.',
  NOT_FOUND: 'Collection not found.',
  DUPLICATE_NAME: 'You already have a collection with that name.',
  ALREADY_MEMBER: 'This Connection is already in that collection.',
  LIMIT_REACHED: 'You have reached the maximum number of collections.',
  TEMPORARY_FAILURE: 'Could not update collections. Please try again.',
};

export function collectionErrorMessage(code: CollectionErrorCode): string {
  return ERROR_MESSAGES[code];
}

function fail(code: CollectionErrorCode): CollectionMutationState {
  return { error: collectionErrorMessage(code), code };
}

async function loadCollectionWithCount(
  supabase: SupabaseClient,
  ownerUserId: string,
  collectionId: string,
): Promise<OwnerCollection | null> {
  const { data, error } = await supabase
    .from(COLLECTIONS_TABLE)
    .select('id, name, description, created_at, updated_at')
    .eq('id', collectionId)
    .eq('owner_user_id', ownerUserId)
    .maybeSingle();

  if (error || !data) return null;

  const { count } = await supabase
    .from(COLLECTION_ITEMS_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('collection_id', collectionId);

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    connectionCount: count ?? 0,
  };
}

export async function listOwnerCollections(
  supabase: SupabaseClient,
  options?: { user?: AuthUser | null },
): Promise<ListCollectionsResult> {
  const user = await getAuthenticatedUser(supabase, options);
  if (!user) {
    return {
      collections: [],
      error: collectionErrorMessage('UNAUTHENTICATED'),
      code: 'UNAUTHENTICATED',
    };
  }

  const { data, error } = await supabase
    .from(COLLECTIONS_TABLE)
    .select('id, name, description, created_at, updated_at')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    return {
      collections: [],
      error: collectionErrorMessage('TEMPORARY_FAILURE'),
      code: 'TEMPORARY_FAILURE',
    };
  }

  const collections = data ?? [];
  if (collections.length === 0) {
    return { collections: [] };
  }

  const ids = collections.map((c) => c.id);
  const { data: items } = await supabase
    .from(COLLECTION_ITEMS_TABLE)
    .select('collection_id')
    .in('collection_id', ids);

  const counts = new Map<string, number>();
  for (const item of items ?? []) {
    counts.set(item.collection_id, (counts.get(item.collection_id) ?? 0) + 1);
  }

  return {
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      connectionCount: counts.get(c.id) ?? 0,
    })),
  };
}

export async function executeCreateCollection(
  supabase: SupabaseClient,
  raw: unknown,
  options?: { user?: AuthUser | null },
): Promise<CollectionMutationState> {
  const parsed = createCollectionInputSchema.safeParse(raw);
  if (!parsed.success) {
    return fail('INVALID_INPUT');
  }

  const user = await getAuthenticatedUser(supabase, options);
  if (!user) return fail('UNAUTHENTICATED');

  const owned = await resolveOwnedProfile(supabase, user);
  if ('error' in owned) return fail('UNAUTHENTICATED');

  const { count } = await supabase
    .from(COLLECTIONS_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('owner_user_id', user.id);

  if ((count ?? 0) >= LIMITS.collections.max) {
    return fail('LIMIT_REACHED');
  }

  const { data, error } = await supabase
    .from(COLLECTIONS_TABLE)
    .insert({
      tenant_id: owned.profile.tenant_id,
      owner_user_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    .select('id, name, description, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === '23505') return fail('DUPLICATE_NAME');
    return fail('TEMPORARY_FAILURE');
  }

  return {
    success: true,
    collection: {
      id: data.id,
      name: data.name,
      description: data.description ?? null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      connectionCount: 0,
    },
  };
}

export async function executeUpdateCollection(
  supabase: SupabaseClient,
  raw: unknown,
  options?: { user?: AuthUser | null },
): Promise<CollectionMutationState> {
  const parsed = updateCollectionInputSchema.safeParse(raw);
  if (!parsed.success) return fail('INVALID_INPUT');

  const user = await getAuthenticatedUser(supabase, options);
  if (!user) return fail('UNAUTHENTICATED');

  const existing = await loadCollectionWithCount(supabase, user.id, parsed.data.collectionId);
  if (!existing) return fail('NOT_FOUND');

  const patch: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.description !== undefined) patch.description = parsed.data.description;

  if (Object.keys(patch).length === 0) {
    return { success: true, collection: existing };
  }

  const { error } = await supabase
    .from(COLLECTIONS_TABLE)
    .update(patch)
    .eq('id', parsed.data.collectionId)
    .eq('owner_user_id', user.id);

  if (error) {
    if (error.code === '23505') return fail('DUPLICATE_NAME');
    return fail('TEMPORARY_FAILURE');
  }

  const updated = await loadCollectionWithCount(supabase, user.id, parsed.data.collectionId);
  return { success: true, collection: updated ?? existing };
}

export async function executeDeleteCollection(
  supabase: SupabaseClient,
  raw: unknown,
  options?: { user?: AuthUser | null },
): Promise<CollectionMutationState> {
  const parsed = collectionIdInputSchema.safeParse(raw);
  if (!parsed.success) return fail('INVALID_INPUT');

  const user = await getAuthenticatedUser(supabase, options);
  if (!user) return fail('UNAUTHENTICATED');

  const existing = await loadCollectionWithCount(supabase, user.id, parsed.data.collectionId);
  if (!existing) {
    // Idempotent: already gone for this owner
    return { success: true, code: 'NOT_FOUND' };
  }

  const { error } = await supabase
    .from(COLLECTIONS_TABLE)
    .delete()
    .eq('id', parsed.data.collectionId)
    .eq('owner_user_id', user.id);

  if (error) return fail('TEMPORARY_FAILURE');
  return { success: true, collection: existing };
}

export async function executeAddConnectionToCollection(
  supabase: SupabaseClient,
  raw: unknown,
  options?: { user?: AuthUser | null },
): Promise<CollectionMutationState> {
  const parsed = collectionMembershipInputSchema.safeParse(raw);
  if (!parsed.success) return fail('INVALID_INPUT');

  const user = await getAuthenticatedUser(supabase, options);
  if (!user) return fail('UNAUTHENTICATED');

  const owned = await resolveOwnedProfile(supabase, user);
  if ('error' in owned) return fail('UNAUTHENTICATED');

  const collection = await loadCollectionWithCount(supabase, user.id, parsed.data.collectionId);
  if (!collection) return fail('NOT_FOUND');

  const { data: connection } = await supabase
    .from(CONNECTIONS_TABLE)
    .select('id')
    .eq('id', parsed.data.connectionId)
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (!connection) return fail('NOT_FOUND');

  const { data: existing } = await supabase
    .from(COLLECTION_ITEMS_TABLE)
    .select('id')
    .eq('collection_id', parsed.data.collectionId)
    .eq('saved_connection_id', parsed.data.connectionId)
    .maybeSingle();

  if (existing) {
    return {
      success: true,
      alreadyMember: true,
      code: 'ALREADY_MEMBER',
      collection: {
        ...collection,
        connectionCount: collection.connectionCount,
      },
    };
  }

  const { error } = await supabase.from(COLLECTION_ITEMS_TABLE).insert({
    tenant_id: owned.profile.tenant_id,
    collection_id: parsed.data.collectionId,
    saved_connection_id: parsed.data.connectionId,
    sort_order: collection.connectionCount,
  });

  if (error) {
    if (error.code === '23505') {
      return { success: true, alreadyMember: true, code: 'ALREADY_MEMBER', collection };
    }
    return fail('TEMPORARY_FAILURE');
  }

  return {
    success: true,
    collection: { ...collection, connectionCount: collection.connectionCount + 1 },
  };
}

export async function executeRemoveConnectionFromCollection(
  supabase: SupabaseClient,
  raw: unknown,
  options?: { user?: AuthUser | null },
): Promise<CollectionMutationState> {
  const parsed = collectionMembershipInputSchema.safeParse(raw);
  if (!parsed.success) return fail('INVALID_INPUT');

  const user = await getAuthenticatedUser(supabase, options);
  if (!user) return fail('UNAUTHENTICATED');

  const collection = await loadCollectionWithCount(supabase, user.id, parsed.data.collectionId);
  if (!collection) {
    return { success: true, code: 'NOT_FOUND' };
  }

  const { error } = await supabase
    .from(COLLECTION_ITEMS_TABLE)
    .delete()
    .eq('collection_id', parsed.data.collectionId)
    .eq('saved_connection_id', parsed.data.connectionId);

  if (error) return fail('TEMPORARY_FAILURE');

  return {
    success: true,
    collection: {
      ...collection,
      connectionCount: Math.max(0, collection.connectionCount - 1),
    },
  };
}

export async function listCollectionsForConnection(
  supabase: SupabaseClient,
  raw: unknown,
  options?: { user?: AuthUser | null },
): Promise<ConnectionCollectionsResult> {
  const parsed = connectionCollectionsInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      collectionIds: [],
      collections: [],
      error: collectionErrorMessage('INVALID_INPUT'),
      code: 'INVALID_INPUT',
    };
  }

  const user = await getAuthenticatedUser(supabase, options);
  if (!user) {
    return {
      collectionIds: [],
      collections: [],
      error: collectionErrorMessage('UNAUTHENTICATED'),
      code: 'UNAUTHENTICATED',
    };
  }

  const { data: connection } = await supabase
    .from(CONNECTIONS_TABLE)
    .select('id')
    .eq('id', parsed.data.connectionId)
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (!connection) {
    return {
      collectionIds: [],
      collections: [],
      error: collectionErrorMessage('NOT_FOUND'),
      code: 'NOT_FOUND',
    };
  }

  const { data: items, error } = await supabase
    .from(COLLECTION_ITEMS_TABLE)
    .select('collection_id, collections!inner(id, name, owner_user_id)')
    .eq('saved_connection_id', parsed.data.connectionId);

  if (error) {
    return {
      collectionIds: [],
      collections: [],
      error: collectionErrorMessage('TEMPORARY_FAILURE'),
      code: 'TEMPORARY_FAILURE',
    };
  }

  const collections = (items ?? [])
    .map((row) => {
      const col = row.collections as
        | { id: string; name: string; owner_user_id: string }
        | { id: string; name: string; owner_user_id: string }[]
        | null;
      const c = Array.isArray(col) ? col[0] : col;
      if (!c || c.owner_user_id !== user.id) return null;
      return { id: c.id, name: c.name };
    })
    .filter((c): c is { id: string; name: string } => Boolean(c));

  return {
    collectionIds: collections.map((c) => c.id),
    collections,
  };
}

export type OwnerMembershipMap = Record<string, string[]>;

/** connectionId → collectionIds for the authenticated owner. */
export async function listOwnerMembershipMap(
  supabase: SupabaseClient,
  options?: { user?: AuthUser | null },
): Promise<{ memberships: OwnerMembershipMap; error?: string; code?: CollectionErrorCode }> {
  const user = await getAuthenticatedUser(supabase, options);
  if (!user) {
    return {
      memberships: {},
      error: collectionErrorMessage('UNAUTHENTICATED'),
      code: 'UNAUTHENTICATED',
    };
  }

  const listed = await listOwnerCollections(supabase, { user });
  if (listed.error) {
    return { memberships: {}, error: listed.error, code: listed.code };
  }
  if (listed.collections.length === 0) {
    return { memberships: {} };
  }

  const collectionIds = listed.collections.map((c) => c.id);
  const { data: items, error } = await supabase
    .from(COLLECTION_ITEMS_TABLE)
    .select('collection_id, saved_connection_id')
    .in('collection_id', collectionIds);

  if (error) {
    return {
      memberships: {},
      error: collectionErrorMessage('TEMPORARY_FAILURE'),
      code: 'TEMPORARY_FAILURE',
    };
  }

  const memberships: OwnerMembershipMap = {};
  for (const item of items ?? []) {
    const list = memberships[item.saved_connection_id] ?? [];
    list.push(item.collection_id);
    memberships[item.saved_connection_id] = list;
  }
  return { memberships };
}

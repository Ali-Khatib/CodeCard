import { LIMITS } from '@codecard/config';
import {
  addConnectionInputSchema,
  connectionStatusInputSchema,
  removeConnectionInputSchema,
  slugSchema,
  type AddConnectionInput,
  type ConnectionStatusInput,
  type RemoveConnectionInput,
} from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  assertConnectionIdentity,
  CONNECTION_DEFAULT_SOURCE,
  CONNECTIONS_TABLE,
  type ConnectionMutationErrorCode,
  type OwnerConnectionListItem,
  type SafePublicConnectionTarget,
  UNPUBLISHED_SAVED_TARGET_POLICY,
} from '@/lib/connections/connections-contract';
import {
  getAuthenticatedUser,
  resolveOwnedProfile,
  type AuthUser,
} from '@/lib/profile/profile-auth-core';
import { normalizePublicProfileSlug } from '@/lib/profile/public-profile';

export { UNPUBLISHED_SAVED_TARGET_POLICY };

const TARGET_SELECT =
  'id, slug, display_name, headline, location, avatar_url, is_public, owner_user_id, tenant_id';

const CONNECTION_SELECT =
  'id, saved_profile_id, connected_at, created_at, source, updated_at';

export type ConnectionMutationState = {
  success?: boolean;
  alreadyConnected?: boolean;
  error?: string;
  code?: ConnectionMutationErrorCode;
  connection?: {
    id: string;
    savedProfileId: string;
    connectedAt: string | null;
    createdAt: string;
    source: string;
  };
};

export type ConnectionStatusResult = {
  connected: boolean;
  connectionId: string | null;
  error?: string;
  code?: ConnectionMutationErrorCode;
};

export type ListConnectionsResult = {
  connections: OwnerConnectionListItem[];
  error?: string;
  code?: ConnectionMutationErrorCode;
};

const ERROR_MESSAGES: Record<ConnectionMutationErrorCode, string> = {
  UNAUTHENTICATED: 'You must be signed in to manage Connections.',
  INVALID_TARGET: 'That profile could not be found.',
  SELF_CONNECTION: 'You cannot add yourself as a Connection.',
  TARGET_NOT_AVAILABLE: 'Only published CodeCards can be saved as Connections.',
  ALREADY_CONNECTED: 'This person is already in your Connections.',
  NOT_FOUND: 'Connection not found.',
  RATE_LIMITED: 'Too many Connection requests. Please try again shortly.',
  TEMPORARY_FAILURE: 'Could not update Connections. Please try again.',
};

export function connectionErrorMessage(code: ConnectionMutationErrorCode): string {
  return ERROR_MESSAGES[code];
}

function fail(code: ConnectionMutationErrorCode): ConnectionMutationState {
  return { error: connectionErrorMessage(code), code };
}

type TargetProfileRow = {
  id: string;
  slug: string;
  display_name: string;
  headline: string | null;
  location: string | null;
  avatar_url: string | null;
  is_public: boolean;
  owner_user_id: string;
  tenant_id: string;
};

function toSafeTarget(
  row: TargetProfileRow,
  options?: { forceUnavailable?: boolean },
): SafePublicConnectionTarget {
  if (options?.forceUnavailable || row.is_public !== true) {
    return {
      profileId: row.id,
      slug: '',
      displayName: 'Private CodeCard',
      headline: null,
      location: null,
      avatarPublicUrl: null,
      isPublic: false,
    };
  }

  return {
    profileId: row.id,
    slug: row.slug,
    displayName: row.display_name,
    headline: row.headline ?? null,
    location: row.location ?? null,
    avatarPublicUrl: row.avatar_url ?? null,
    isPublic: true,
  };
}

async function resolvePublishedTarget(
  supabase: SupabaseClient,
  input: { targetProfileId?: string; targetSlug?: string },
): Promise<
  | { ok: true; target: TargetProfileRow }
  | { ok: false; code: Extract<ConnectionMutationErrorCode, 'INVALID_TARGET' | 'TARGET_NOT_AVAILABLE'> }
> {
  if (input.targetProfileId) {
    const { data, error } = await supabase
      .from('profiles')
      .select(TARGET_SELECT)
      .eq('id', input.targetProfileId)
      .maybeSingle();

    if (error || !data) {
      return { ok: false, code: 'INVALID_TARGET' };
    }
    if (data.is_public !== true) {
      return { ok: false, code: 'TARGET_NOT_AVAILABLE' };
    }
    return { ok: true, target: data as TargetProfileRow };
  }

  const slug = normalizePublicProfileSlug(input.targetSlug);
  if (!slug) {
    return { ok: false, code: 'INVALID_TARGET' };
  }

  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) {
    return { ok: false, code: 'INVALID_TARGET' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(TARGET_SELECT)
    .eq('slug', parsed.data)
    .eq('is_public', true)
    .maybeSingle();

  if (error || !data || data.is_public !== true) {
    return { ok: false, code: 'TARGET_NOT_AVAILABLE' };
  }

  return { ok: true, target: data as TargetProfileRow };
}

async function findOwnedConnection(
  supabase: SupabaseClient,
  ownerUserId: string,
  input: { connectionId?: string; targetProfileId?: string },
): Promise<{ id: string; saved_profile_id: string } | null> {
  if (input.connectionId) {
    const { data } = await supabase
      .from(CONNECTIONS_TABLE)
      .select('id, saved_profile_id')
      .eq('id', input.connectionId)
      .eq('owner_user_id', ownerUserId)
      .maybeSingle();
    return data ?? null;
  }

  if (input.targetProfileId) {
    const { data } = await supabase
      .from(CONNECTIONS_TABLE)
      .select('id, saved_profile_id')
      .eq('owner_user_id', ownerUserId)
      .eq('saved_profile_id', input.targetProfileId)
      .maybeSingle();
    return data ?? null;
  }

  return null;
}

export async function executeAddConnection(
  supabase: SupabaseClient,
  raw: unknown,
  options?: { user?: AuthUser | null },
): Promise<ConnectionMutationState> {
  const parsed = addConnectionInputSchema.safeParse(raw);
  if (!parsed.success) {
    return fail('INVALID_TARGET');
  }

  const user = await getAuthenticatedUser(supabase, options);
  if (!user) {
    return fail('UNAUTHENTICATED');
  }

  const owned = await resolveOwnedProfile(supabase, user);
  if ('error' in owned) {
    return fail('UNAUTHENTICATED');
  }

  const targetResult = await resolvePublishedTarget(supabase, parsed.data);
  if (!targetResult.ok) {
    return fail(targetResult.code);
  }

  const target = targetResult.target;
  const identity = assertConnectionIdentity({
    ownerUserId: user.id,
    savedProfileId: target.id,
    targetOwnerUserId: target.owner_user_id,
  });
  if (!identity.ok) {
    return fail(identity.code);
  }

  if (target.id === owned.profile.id) {
    return fail('SELF_CONNECTION');
  }

  const existing = await findOwnedConnection(supabase, user.id, {
    targetProfileId: target.id,
  });
  if (existing) {
    return {
      success: true,
      alreadyConnected: true,
      code: 'ALREADY_CONNECTED',
      connection: {
        id: existing.id,
        savedProfileId: existing.saved_profile_id,
        connectedAt: null,
        createdAt: '',
        source: CONNECTION_DEFAULT_SOURCE,
      },
    };
  }

  const { count, error: countError } = await supabase
    .from(CONNECTIONS_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('owner_user_id', user.id);

  if (countError) {
    return fail('TEMPORARY_FAILURE');
  }
  if ((count ?? 0) >= LIMITS.savedConnections.max) {
    return fail('RATE_LIMITED');
  }

  const source = (parsed.data as AddConnectionInput).source ?? CONNECTION_DEFAULT_SOURCE;
  const now = new Date().toISOString();

  const { data: inserted, error: insertError } = await supabase
    .from(CONNECTIONS_TABLE)
    .insert({
      tenant_id: owned.profile.tenant_id,
      owner_user_id: user.id,
      saved_profile_id: target.id,
      source,
      connected_at: now,
    })
    .select(CONNECTION_SELECT)
    .single();

  if (insertError) {
    // Unique violation → treat as idempotent already-connected.
    if (insertError.code === '23505') {
      const again = await findOwnedConnection(supabase, user.id, {
        targetProfileId: target.id,
      });
      if (again) {
        return {
          success: true,
          alreadyConnected: true,
          code: 'ALREADY_CONNECTED',
          connection: {
            id: again.id,
            savedProfileId: again.saved_profile_id,
            connectedAt: null,
            createdAt: '',
            source,
          },
        };
      }
    }
    // Self-connection trigger / check constraint
    if (
      insertError.code === 'P0001' ||
      /self.?connection/i.test(insertError.message ?? '')
    ) {
      return fail('SELF_CONNECTION');
    }
    return fail('TEMPORARY_FAILURE');
  }

  return {
    success: true,
    connection: {
      id: inserted.id,
      savedProfileId: inserted.saved_profile_id,
      connectedAt: inserted.connected_at,
      createdAt: inserted.created_at,
      source: inserted.source,
    },
  };
}

export async function executeRemoveConnection(
  supabase: SupabaseClient,
  raw: unknown,
  options?: { user?: AuthUser | null },
): Promise<ConnectionMutationState> {
  const parsed = removeConnectionInputSchema.safeParse(raw);
  if (!parsed.success) {
    return fail('INVALID_TARGET');
  }

  const user = await getAuthenticatedUser(supabase, options);
  if (!user) {
    return fail('UNAUTHENTICATED');
  }

  const ownedRow = await findOwnedConnection(supabase, user.id, parsed.data as RemoveConnectionInput);
  if (!ownedRow) {
    // Idempotent success when already absent for this owner.
    return { success: true, code: 'NOT_FOUND' };
  }

  const { error } = await supabase
    .from(CONNECTIONS_TABLE)
    .delete()
    .eq('id', ownedRow.id)
    .eq('owner_user_id', user.id);

  if (error) {
    return fail('TEMPORARY_FAILURE');
  }

  return {
    success: true,
    connection: {
      id: ownedRow.id,
      savedProfileId: ownedRow.saved_profile_id,
      connectedAt: null,
      createdAt: '',
      source: CONNECTION_DEFAULT_SOURCE,
    },
  };
}

export async function executeConnectionStatus(
  supabase: SupabaseClient,
  raw: unknown,
  options?: { user?: AuthUser | null },
): Promise<ConnectionStatusResult> {
  const parsed = connectionStatusInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      connected: false,
      connectionId: null,
      error: connectionErrorMessage('INVALID_TARGET'),
      code: 'INVALID_TARGET',
    };
  }

  const user = await getAuthenticatedUser(supabase, options);
  if (!user) {
    return {
      connected: false,
      connectionId: null,
      error: connectionErrorMessage('UNAUTHENTICATED'),
      code: 'UNAUTHENTICATED',
    };
  }

  let targetProfileId = (parsed.data as ConnectionStatusInput).targetProfileId;
  if (!targetProfileId && parsed.data.targetSlug) {
    const targetResult = await resolvePublishedTarget(supabase, {
      targetSlug: parsed.data.targetSlug,
    });
    if (!targetResult.ok) {
      return {
        connected: false,
        connectionId: null,
        error: connectionErrorMessage(targetResult.code),
        code: targetResult.code,
      };
    }
    targetProfileId = targetResult.target.id;
  }

  if (!targetProfileId) {
    return {
      connected: false,
      connectionId: null,
      error: connectionErrorMessage('INVALID_TARGET'),
      code: 'INVALID_TARGET',
    };
  }

  const existing = await findOwnedConnection(supabase, user.id, { targetProfileId });
  return {
    connected: Boolean(existing),
    connectionId: existing?.id ?? null,
  };
}

export async function listOwnerConnections(
  supabase: SupabaseClient,
  options?: { user?: AuthUser | null },
): Promise<ListConnectionsResult> {
  const user = await getAuthenticatedUser(supabase, options);
  if (!user) {
    return {
      connections: [],
      error: connectionErrorMessage('UNAUTHENTICATED'),
      code: 'UNAUTHENTICATED',
    };
  }

  const { data, error } = await supabase
    .from(CONNECTIONS_TABLE)
    .select(
      `
      id,
      connected_at,
      created_at,
      source,
      context,
      saved_profile:saved_profile_id (
        ${TARGET_SELECT}
      )
    `,
    )
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return {
      connections: [],
      error: connectionErrorMessage('TEMPORARY_FAILURE'),
      code: 'TEMPORARY_FAILURE',
    };
  }

  const connectionIds = (data ?? []).map((row) => row.id as string);
  let notesMap: Record<string, string> = {};
  if (connectionIds.length > 0) {
    const { data: notes } = await supabase
      .from('connection_notes')
      .select('saved_connection_id, body')
      .eq('owner_user_id', user.id)
      .in('saved_connection_id', connectionIds);
    for (const note of notes ?? []) {
      notesMap[note.saved_connection_id] = note.body;
    }
  }

  const connections: OwnerConnectionListItem[] = (data ?? []).flatMap((row) => {
    const saved = row.saved_profile as TargetProfileRow | TargetProfileRow[] | null;
    const targetRow = Array.isArray(saved) ? saved[0] : saved;
    if (!targetRow) {
      return [];
    }

    return [
      {
        connectionId: row.id as string,
        connectedAt: (row.connected_at as string | null) ?? null,
        createdAt: row.created_at as string,
        source: row.source as string,
        context: (row.context as string | null) ?? null,
        privateNote: notesMap[row.id as string] ?? null,
        target: toSafeTarget(targetRow),
      },
    ];
  });

  return { connections };
}

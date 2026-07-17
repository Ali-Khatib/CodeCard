import {
  connectionMetadataInputSchema,
  updateConnectionMetadataInputSchema,
} from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CONNECTION_NOTES_TABLE,
  CONNECTIONS_TABLE,
} from '@/lib/connections/connections-contract';
import {
  getAuthenticatedUser,
  resolveOwnedProfile,
  type AuthUser,
} from '@/lib/profile/profile-auth-core';

export type MetadataErrorCode =
  | 'UNAUTHENTICATED'
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'TEMPORARY_FAILURE';

export type ConnectionMetadata = {
  connectionId: string;
  privateNote: string | null;
  context: string | null;
  connectedAt: string | null;
  metAt: string | null;
  source: string;
  updatedAt: string;
};

export type MetadataMutationState = {
  success?: boolean;
  error?: string;
  code?: MetadataErrorCode;
  metadata?: ConnectionMetadata;
};

export type MetadataReadResult = {
  metadata: ConnectionMetadata | null;
  error?: string;
  code?: MetadataErrorCode;
};

const ERROR_MESSAGES: Record<MetadataErrorCode, string> = {
  UNAUTHENTICATED: 'You must be signed in to manage private notes.',
  INVALID_INPUT: 'That note update is not valid.',
  NOT_FOUND: 'Connection not found.',
  TEMPORARY_FAILURE: 'Could not update private details. Please try again.',
};

export function metadataErrorMessage(code: MetadataErrorCode): string {
  return ERROR_MESSAGES[code];
}

function fail(code: MetadataErrorCode): MetadataMutationState {
  return { error: metadataErrorMessage(code), code };
}

/** Strip characters that are unsafe in plain-text storage (keep newlines/tabs). */
export function sanitizePlainTextNote(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

async function loadOwnedConnectionRow(
  supabase: SupabaseClient,
  ownerUserId: string,
  connectionId: string,
): Promise<{
  id: string;
  context: string | null;
  connected_at: string | null;
  met_at: string | null;
  source: string;
  updated_at: string;
  tenant_id: string;
} | null> {
  const { data } = await supabase
    .from(CONNECTIONS_TABLE)
    .select('id, context, connected_at, met_at, source, updated_at, tenant_id')
    .eq('id', connectionId)
    .eq('owner_user_id', ownerUserId)
    .maybeSingle();
  return data ?? null;
}

async function loadNoteBody(
  supabase: SupabaseClient,
  ownerUserId: string,
  connectionId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from(CONNECTION_NOTES_TABLE)
    .select('body')
    .eq('saved_connection_id', connectionId)
    .eq('owner_user_id', ownerUserId)
    .maybeSingle();
  return data?.body ?? null;
}

export async function executeReadConnectionMetadata(
  supabase: SupabaseClient,
  raw: unknown,
  options?: { user?: AuthUser | null },
): Promise<MetadataReadResult> {
  const parsed = connectionMetadataInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      metadata: null,
      error: metadataErrorMessage('INVALID_INPUT'),
      code: 'INVALID_INPUT',
    };
  }

  const user = await getAuthenticatedUser(supabase, options);
  if (!user) {
    return {
      metadata: null,
      error: metadataErrorMessage('UNAUTHENTICATED'),
      code: 'UNAUTHENTICATED',
    };
  }

  const row = await loadOwnedConnectionRow(supabase, user.id, parsed.data.connectionId);
  if (!row) {
    // Do not distinguish foreign vs missing for privacy.
    return {
      metadata: null,
      error: metadataErrorMessage('NOT_FOUND'),
      code: 'NOT_FOUND',
    };
  }

  const privateNote = await loadNoteBody(supabase, user.id, row.id);
  return {
    metadata: {
      connectionId: row.id,
      privateNote,
      context: row.context ?? null,
      connectedAt: row.connected_at,
      metAt: row.met_at,
      source: row.source,
      updatedAt: row.updated_at,
    },
  };
}

export async function executeUpdateConnectionMetadata(
  supabase: SupabaseClient,
  raw: unknown,
  options?: { user?: AuthUser | null },
): Promise<MetadataMutationState> {
  const parsed = updateConnectionMetadataInputSchema.safeParse(raw);
  if (!parsed.success) return fail('INVALID_INPUT');

  const user = await getAuthenticatedUser(supabase, options);
  if (!user) return fail('UNAUTHENTICATED');

  const owned = await resolveOwnedProfile(supabase, user);
  if ('error' in owned) return fail('UNAUTHENTICATED');

  const row = await loadOwnedConnectionRow(supabase, user.id, parsed.data.connectionId);
  if (!row) return fail('NOT_FOUND');

  const connectionPatch: Record<string, unknown> = {};
  if (parsed.data.context !== undefined) {
    connectionPatch.context =
      parsed.data.context == null ? null : sanitizePlainTextNote(parsed.data.context);
  }
  if (parsed.data.connectedAt !== undefined) {
    connectionPatch.connected_at = parsed.data.connectedAt;
  }
  if (parsed.data.metAt !== undefined) {
    connectionPatch.met_at = parsed.data.metAt;
  }
  if (parsed.data.source !== undefined) {
    connectionPatch.source = parsed.data.source;
  }

  if (Object.keys(connectionPatch).length > 0) {
    const { error } = await supabase
      .from(CONNECTIONS_TABLE)
      .update(connectionPatch)
      .eq('id', row.id)
      .eq('owner_user_id', user.id);
    if (error) return fail('TEMPORARY_FAILURE');
  }

  if (parsed.data.privateNote !== undefined) {
    if (parsed.data.privateNote == null) {
      const { error } = await supabase
        .from(CONNECTION_NOTES_TABLE)
        .delete()
        .eq('saved_connection_id', row.id)
        .eq('owner_user_id', user.id);
      if (error) return fail('TEMPORARY_FAILURE');
    } else {
      const body = sanitizePlainTextNote(parsed.data.privateNote);
      if (body.length === 0 || body.length > 5000) return fail('INVALID_INPUT');

      const existing = await loadNoteBody(supabase, user.id, row.id);
      if (existing == null) {
        const { error } = await supabase.from(CONNECTION_NOTES_TABLE).insert({
          tenant_id: owned.profile.tenant_id,
          owner_user_id: user.id,
          saved_connection_id: row.id,
          body,
        });
        if (error) return fail('TEMPORARY_FAILURE');
      } else {
        const { error } = await supabase
          .from(CONNECTION_NOTES_TABLE)
          .update({ body })
          .eq('saved_connection_id', row.id)
          .eq('owner_user_id', user.id);
        if (error) return fail('TEMPORARY_FAILURE');
      }
    }
  }

  const refreshed = await executeReadConnectionMetadata(
    supabase,
    { connectionId: row.id },
    { user },
  );
  if (!refreshed.metadata) return fail('TEMPORARY_FAILURE');
  return { success: true, metadata: refreshed.metadata };
}

/** Batch-load notes for owner Connections (one query). Never for other owners. */
export async function listOwnerNotesMap(
  supabase: SupabaseClient,
  connectionIds: string[],
  options?: { user?: AuthUser | null },
): Promise<Record<string, string>> {
  const user = await getAuthenticatedUser(supabase, options);
  if (!user || connectionIds.length === 0) return {};

  const { data } = await supabase
    .from(CONNECTION_NOTES_TABLE)
    .select('saved_connection_id, body')
    .eq('owner_user_id', user.id)
    .in('saved_connection_id', connectionIds);

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.saved_connection_id] = row.body;
  }
  return map;
}

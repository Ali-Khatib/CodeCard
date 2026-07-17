/**
 * WS15-T001 — Canonical Connections data contract.
 *
 * A Connection is a private directed relationship:
 *   authenticated owner user → published target profile
 *
 * It is not mutual. Saving someone does not add the current user to their Connections.
 *
 * Persistence table: `saved_connections`
 * Related private metadata (deferred feature batches, but cascade-owned):
 * - `connection_notes`
 * - `collections` / `collection_items`
 *
 * Live-demo `DEMO_CONNECTIONS` is a separate presentation layer and must never be
 * queried or written for authenticated account routes.
 */

export const CONNECTIONS_TABLE = 'saved_connections' as const;
export const CONNECTION_NOTES_TABLE = 'connection_notes' as const;
export const COLLECTIONS_TABLE = 'collections' as const;
export const COLLECTION_ITEMS_TABLE = 'collection_items' as const;

/** Default source for intentional profile saves from a public CodeCard. */
export const CONNECTION_DEFAULT_SOURCE = 'manual' as const;

export type ConnectionOwnerId = string;
export type ConnectionTargetProfileId = string;

export type ConnectionIdentity = {
  ownerUserId: ConnectionOwnerId;
  savedProfileId: ConnectionTargetProfileId;
};

export type SafePublicConnectionTarget = {
  profileId: string;
  slug: string;
  displayName: string;
  headline: string | null;
  location: string | null;
  avatarPublicUrl: string | null;
  isPublic: boolean;
};

export type OwnerConnectionListItem = {
  connectionId: string;
  connectedAt: string | null;
  createdAt: string;
  source: string;
  target: SafePublicConnectionTarget;
};

export type ConnectionMutationErrorCode =
  | 'UNAUTHENTICATED'
  | 'INVALID_TARGET'
  | 'SELF_CONNECTION'
  | 'TARGET_NOT_AVAILABLE'
  | 'ALREADY_CONNECTED'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'TEMPORARY_FAILURE';

/**
 * Core invariants that every Connections implementation must uphold.
 * These are intentionally framework-agnostic so schema, RLS, and server
 * operations can each assert against the same contract.
 */
export const CONNECTION_INVARIANTS = [
  'owner_authenticated_required',
  'target_profile_must_exist',
  'target_must_be_public_at_save_time',
  'self_connection_forbidden',
  'owner_target_unique',
  'directed_not_mutual',
  'connections_private_to_owner',
  'target_cannot_list_savers',
  'anonymous_cannot_read_or_mutate',
  'remove_cascades_private_metadata',
  'owner_deletion_removes_connections',
  'target_profile_deletion_cascades_connection',
  'export_includes_owner_connections',
  'demo_data_isolated_from_authenticated',
] as const;

export type ConnectionInvariant = (typeof CONNECTION_INVARIANTS)[number];

export function assertConnectionIdentity(input: {
  ownerUserId: string | null | undefined;
  savedProfileId: string | null | undefined;
  targetOwnerUserId?: string | null;
}):
  | { ok: true; identity: ConnectionIdentity }
  | { ok: false; code: Extract<ConnectionMutationErrorCode, 'UNAUTHENTICATED' | 'INVALID_TARGET' | 'SELF_CONNECTION'> } {
  if (!input.ownerUserId) {
    return { ok: false, code: 'UNAUTHENTICATED' };
  }
  if (!input.savedProfileId) {
    return { ok: false, code: 'INVALID_TARGET' };
  }
  if (input.targetOwnerUserId && input.targetOwnerUserId === input.ownerUserId) {
    return { ok: false, code: 'SELF_CONNECTION' };
  }
  return {
    ok: true,
    identity: {
      ownerUserId: input.ownerUserId,
      savedProfileId: input.savedProfileId,
    },
  };
}

/** Fields safe to expose on the authenticated Connections list / cards. */
export const SAFE_CONNECTION_TARGET_FIELDS = [
  'profileId',
  'slug',
  'displayName',
  'headline',
  'location',
  'avatarPublicUrl',
  'isPublic',
] as const;

/** Fields that must never appear in Connections list/API responses. */
export const FORBIDDEN_CONNECTION_RESPONSE_FIELDS = [
  'email',
  'password',
  'access_token',
  'refresh_token',
  'service_role',
  'stripe_customer_id',
  'stripe_subscription_id',
  'storage_path',
  'ip_address',
  'user_agent',
  'private_note',
  'connection_note',
  'saver_list',
] as const;

export function isForbiddenConnectionResponseField(key: string): boolean {
  const lower = key.toLowerCase();
  return FORBIDDEN_CONNECTION_RESPONSE_FIELDS.some(
    (forbidden) => lower === forbidden || lower.includes(forbidden),
  );
}

/**
 * Behavior when an already-saved target later becomes private/unpublished:
 * keep the relationship row, but stop exposing unpublished profile details
 * in the Connections UI (show a privacy-safe placeholder instead).
 */
export const UNPUBLISHED_SAVED_TARGET_POLICY = 'retain_row_hide_private_details' as const;

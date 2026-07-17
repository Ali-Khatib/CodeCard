/**
 * WS16-T001 — Canonical Circle activity contract.
 *
 * Circle is a private professional activity feed:
 *   authenticated viewer
 *   → their saved Connections (directed saves)
 *   → public activity produced by those target profiles
 *
 * Architecture: **persisted activity events** (`circle_activity`) emitted by
 * trusted server operations after successful publish/meaningful-update mutations,
 * with **read-time visibility filtering** (Connections + public actor + published
 * target). This hybrid keeps stable event IDs for future reactions/comments while
 * never exposing private/unpublished content.
 *
 * Demo `DEMO_CIRCLE_FEED` is presentation-only and must never seed authenticated
 * Circle routes or write to production Supabase.
 */

export const CIRCLE_ACTIVITY_TABLE = 'circle_activity' as const;

export const CIRCLE_ACTIVITY_EVENT_TYPES = [
  'project_published',
  'project_updated',
  'research_published',
  'research_updated',
] as const;

export type CircleActivityEventType = (typeof CIRCLE_ACTIVITY_EVENT_TYPES)[number];

export const CIRCLE_ACTIVITY_TARGET_TYPES = ['project', 'research'] as const;

export type CircleActivityTargetType = (typeof CIRCLE_ACTIVITY_TARGET_TYPES)[number];

/** Default bounded page size for authenticated Circle feed queries. */
export const CIRCLE_FEED_PAGE_SIZE = 30 as const;

export type CircleActivityIdentity = {
  actorProfileId: string;
  eventType: CircleActivityEventType;
  targetType: CircleActivityTargetType;
  targetId: string;
  dedupeKey: string;
};

export type CircleFeedCursor = {
  /** ISO created_at of the last item on the previous page. */
  createdAt: string;
  /** Event id tie-breaker (uuid). */
  id: string;
};

export type SafeCircleActor = {
  profileId: string;
  slug: string;
  displayName: string;
  headline: string | null;
  avatarPublicUrl: string | null;
};

export type SafeCircleTarget = {
  targetType: CircleActivityTargetType;
  targetId: string;
  title: string;
  summary: string | null;
  /** Public path segment: project id or research paper slug. */
  publicPathKey: string;
  previewImageUrl: string | null;
  technologies?: string[];
  authors?: string[];
  venue?: string | null;
};

export type CircleFeedItem = {
  eventId: string;
  eventType: CircleActivityEventType;
  createdAt: string;
  actor: SafeCircleActor;
  target: SafeCircleTarget;
  /** Human-readable sentence without internal keys. */
  activitySentence: string;
};

export type CircleFeedState =
  | { status: 'unauthenticated' }
  | { status: 'no_connections' }
  | { status: 'no_activity'; connectionCount: number }
  | {
      status: 'feed';
      connectionCount: number;
      items: CircleFeedItem[];
      nextCursor: CircleFeedCursor | null;
    }
  | { status: 'temporary_failure'; error: string };

export type CircleActivityErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'INVALID_EVENT'
  | 'TARGET_NOT_PUBLIC'
  | 'NOT_FOUND'
  | 'TEMPORARY_FAILURE';

/**
 * Core invariants for schema, RLS, emission, and feed queries.
 */
export const CIRCLE_ACTIVITY_INVARIANTS = [
  'viewer_authenticated_required',
  'feed_based_on_owner_connections_only',
  'actor_profile_must_be_public',
  'target_content_must_be_published',
  'no_client_arbitrary_event_insert',
  'event_types_allowlisted',
  'target_types_allowlisted',
  'dedupe_key_unique_and_server_generated',
  'publish_events_idempotent',
  'update_events_require_meaningful_public_change',
  'no_activity_for_drafts_or_private_content',
  'unpublish_hides_from_feed',
  'remove_connection_hides_actor_from_viewer_feed',
  'viewer_does_not_see_own_activity',
  'private_notes_and_collections_never_in_activity',
  'target_cannot_see_who_viewed_via_circle',
  'anonymous_cannot_read_circle_feed',
  'demo_data_isolated_from_authenticated',
  'actor_deletion_removes_or_cascades_activity',
  'export_includes_actor_owned_activity',
] as const;

export type CircleActivityInvariant = (typeof CIRCLE_ACTIVITY_INVARIANTS)[number];

/** Public project fields that qualify a meaningful update when already published. */
export const PROJECT_MEANINGFUL_UPDATE_FIELDS = [
  'title',
  'tagline',
  'description',
  'slug',
  'technologies',
  'status',
] as const;

/** Public research fields that qualify a meaningful update when already published. */
export const RESEARCH_MEANINGFUL_UPDATE_FIELDS = [
  'title',
  'abstract',
  'slug',
  'authors',
  'venue',
  'publication_status',
  'pdf_url',
  'cover_image_url',
  'year',
] as const;

/** Fields never stored in activity metadata or returned in feed payloads. */
export const CIRCLE_FORBIDDEN_PAYLOAD_FIELDS = [
  'email',
  'privateNote',
  'private_note',
  'context',
  'collection',
  'collections',
  'stripe',
  'password',
  'service_role',
  'storage_path',
  'billing',
  'analytics',
] as const;

export function isCircleActivityEventType(value: string): value is CircleActivityEventType {
  return (CIRCLE_ACTIVITY_EVENT_TYPES as readonly string[]).includes(value);
}

export function isCircleActivityTargetType(value: string): value is CircleActivityTargetType {
  return (CIRCLE_ACTIVITY_TARGET_TYPES as readonly string[]).includes(value);
}

export function buildPublishDedupeKey(
  targetType: CircleActivityTargetType,
  targetId: string,
): string {
  return `${targetType}_published:${targetId}`;
}

/**
 * Update dedupe keys incorporate a content fingerprint so identical retries
 * remain idempotent while distinct meaningful edits create new events.
 */
export function buildUpdateDedupeKey(
  targetType: CircleActivityTargetType,
  targetId: string,
  contentFingerprint: string,
): string {
  return `${targetType}_updated:${targetId}:${contentFingerprint}`;
}

export function activitySentenceFor(
  eventType: CircleActivityEventType,
  actorDisplayName: string,
): string {
  switch (eventType) {
    case 'project_published':
      return `${actorDisplayName} published a new project`;
    case 'project_updated':
      return `${actorDisplayName} updated a project`;
    case 'research_published':
      return `${actorDisplayName} published a research paper`;
    case 'research_updated':
      return `${actorDisplayName} updated a research paper`;
    default: {
      const _exhaustive: never = eventType;
      return _exhaustive;
    }
  }
}

export function targetTypeForEvent(eventType: CircleActivityEventType): CircleActivityTargetType {
  if (eventType === 'project_published' || eventType === 'project_updated') {
    return 'project';
  }
  return 'research';
}

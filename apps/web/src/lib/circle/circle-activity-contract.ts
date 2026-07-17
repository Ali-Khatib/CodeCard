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

/** Default / max bounded page size for authenticated Circle feed queries. */
export const CIRCLE_FEED_PAGE_SIZE = 20 as const;
export const CIRCLE_FEED_MAX_PAGE_SIZE = 20 as const;

/** Work-type filters — chronological latest-work only; never popularity. */
export const CIRCLE_FEED_FILTERS = ['all', 'projects', 'research', 'updates'] as const;
export type CircleFeedFilter = (typeof CIRCLE_FEED_FILTERS)[number];

export const CIRCLE_FEED_FILTER_LABELS: Record<CircleFeedFilter, string> = {
  all: 'All',
  projects: 'Projects',
  research: 'Research',
  updates: 'Updates',
};

/** Product rule: Circle is not a social engagement platform. */
export const CIRCLE_FORBIDDEN_SOCIAL_CONTROLS = [
  'like',
  'likes',
  'reaction',
  'reactions',
  'comment',
  'comments',
  'reply',
  'replies',
  'repost',
  'follower',
  'followers',
  'trending',
  'popular',
  'engagement',
  'applause',
] as const;

export type CircleActivityIdentity = {
  actorProfileId: string;
  eventType: CircleActivityEventType;
  targetType: CircleActivityTargetType;
  targetId: string;
  dedupeKey: string;
};

export type CircleFeedCursor = {
  /** ISO created_at of the last raw activity row on the previous page. */
  createdAt: string;
  /** Event id tie-breaker (uuid). */
  id: string;
  /** Filter active when the cursor was issued; must match the next request. */
  filter: CircleFeedFilter;
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
      status: 'filtered_empty';
      connectionCount: number;
      filter: CircleFeedFilter;
    }
  | {
      status: 'feed';
      connectionCount: number;
      filter: CircleFeedFilter;
      items: CircleFeedItem[];
      nextCursor: CircleFeedCursor | null;
    }
  | { status: 'invalid_cursor'; error: string }
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

export function isCircleFeedFilter(value: string): value is CircleFeedFilter {
  return (CIRCLE_FEED_FILTERS as readonly string[]).includes(value);
}

export function normalizeCircleFeedFilter(
  value: string | null | undefined,
): CircleFeedFilter {
  if (!value) return 'all';
  const normalized = value.trim().toLowerCase();
  return isCircleFeedFilter(normalized) ? normalized : 'all';
}

export function eventTypesForFilter(filter: CircleFeedFilter): CircleActivityEventType[] {
  switch (filter) {
    case 'projects':
      return ['project_published', 'project_updated'];
    case 'research':
      return ['research_published', 'research_updated'];
    case 'updates':
      return ['project_updated', 'research_updated'];
    case 'all':
    default:
      return [...CIRCLE_ACTIVITY_EVENT_TYPES];
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Parse and validate a client-supplied cursor. Viewer identity is never taken
 * from the cursor — the session always re-resolves Connections.
 */
export function parseCircleFeedCursor(
  raw: unknown,
  expectedFilter: CircleFeedFilter,
):
  | { ok: true; cursor: CircleFeedCursor }
  | { ok: false; code: 'INVALID_CURSOR' } {
  if (raw == null) {
    return { ok: false, code: 'INVALID_CURSOR' };
  }

  let value: unknown = raw;
  if (typeof raw === 'string') {
    try {
      const decoded = Buffer.from(raw, 'base64url').toString('utf8');
      value = JSON.parse(decoded) as unknown;
    } catch {
      try {
        value = JSON.parse(raw) as unknown;
      } catch {
        return { ok: false, code: 'INVALID_CURSOR' };
      }
    }
  }

  if (!value || typeof value !== 'object') {
    return { ok: false, code: 'INVALID_CURSOR' };
  }

  const record = value as Record<string, unknown>;
  const createdAt = typeof record.createdAt === 'string' ? record.createdAt : '';
  const id = typeof record.id === 'string' ? record.id : '';
  const filterRaw = typeof record.filter === 'string' ? record.filter : 'all';
  const filter = normalizeCircleFeedFilter(filterRaw);

  if (!createdAt || Number.isNaN(Date.parse(createdAt))) {
    return { ok: false, code: 'INVALID_CURSOR' };
  }
  if (!UUID_RE.test(id)) {
    return { ok: false, code: 'INVALID_CURSOR' };
  }
  if (filter !== expectedFilter) {
    return { ok: false, code: 'INVALID_CURSOR' };
  }
  // Reject stray viewer/owner fields so clients cannot steer identity.
  if ('viewerId' in record || 'ownerUserId' in record || 'userId' in record) {
    return { ok: false, code: 'INVALID_CURSOR' };
  }

  return { ok: true, cursor: { createdAt, id, filter } };
}

export function encodeCircleFeedCursor(cursor: CircleFeedCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

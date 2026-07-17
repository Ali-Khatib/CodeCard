/**
 * WS16-T006 — Private Circle read / freshness contract.
 *
 * Read state is viewer-private. Actors never learn who opened Circle or
 * which activity was seen.
 */

export const CIRCLE_VIEWER_STATE_TABLE = 'circle_viewer_state' as const;

/** Cap shown on navigation badges (exact below, otherwise "9+"). */
export const CIRCLE_UNREAD_BADGE_CAP = 9 as const;

export const CIRCLE_READ_STATE_INVARIANTS = [
  'viewer_owned_only',
  'actor_cannot_see_viewer_reads',
  'anonymous_cannot_access',
  'deliberate_circle_visit_marks_seen',
  'unrelated_dashboard_visit_does_not_mark_seen',
  'removed_connection_activity_excluded',
  'private_or_deleted_activity_excluded',
  'no_creator_facing_read_receipts',
  'no_demo_unread_counts',
] as const;

export type CircleUnreadSummary = {
  /** Exact unread count (capped query). */
  count: number;
  /** Display label: "" | "1".."9" | "9+". */
  badgeLabel: string;
  lastSeenAt: string | null;
};

export function formatCircleUnreadBadge(count: number): string {
  if (count <= 0) return '';
  if (count > CIRCLE_UNREAD_BADGE_CAP) return `${CIRCLE_UNREAD_BADGE_CAP}+`;
  return String(count);
}

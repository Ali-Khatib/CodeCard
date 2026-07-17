import type { CircleFeedItem } from '@/lib/circle/circle-activity-contract';
import { CIRCLE_UPDATE_GROUPING_WINDOW_MS } from '@/lib/circle/circle-activity-contract';

function isUpdateEvent(eventType: CircleFeedItem['eventType']): boolean {
  return eventType === 'project_updated' || eventType === 'research_updated';
}

/**
 * Collapse update events for the same actor+target, keeping the newest.
 * Publication events are never merged with updates.
 * Defense-in-depth after per-target upsert emit; window reserved for future
 * time-bounded policies (currently newest-first unique by actor+target).
 */
export function collapseCircleUpdateGroups(
  items: CircleFeedItem[],
  _windowMs: number = CIRCLE_UPDATE_GROUPING_WINDOW_MS,
): CircleFeedItem[] {
  const result: CircleFeedItem[] = [];
  const seenUpdateKeys = new Set<string>();

  for (const item of items) {
    if (!isUpdateEvent(item.eventType)) {
      result.push(item);
      continue;
    }

    const key = `${item.actor.profileId}:${item.target.targetType}:${item.target.targetId}`;
    if (seenUpdateKeys.has(key)) {
      continue;
    }

    seenUpdateKeys.add(key);
    result.push(item);
  }

  return result;
}

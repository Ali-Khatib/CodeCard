'use server';

import { createClient } from '@/lib/supabase/server';
import { listCircleFeed } from '@/lib/circle/circle-feed-core';
import {
  getCircleUnreadSummary,
  markCircleSeen,
} from '@/lib/circle/circle-read-state-core';
import type {
  CircleFeedCursor,
  CircleFeedState,
} from '@/lib/circle/circle-activity-contract';
import type { CircleUnreadSummary } from '@/lib/circle/circle-read-state-contract';

export type { CircleFeedState, CircleUnreadSummary };

export async function listCircleFeedAction(input?: {
  cursor?: CircleFeedCursor | string | null;
  filter?: string | null;
  limit?: number;
}): Promise<CircleFeedState> {
  const supabase = await createClient();
  return listCircleFeed(supabase, {
    cursor: input?.cursor ?? null,
    filter: input?.filter ?? 'all',
    limit: input?.limit,
  });
}

export async function markCircleSeenAction(): Promise<
  { ok: true; lastSeenAt: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  return markCircleSeen(supabase);
}

export async function getCircleUnreadSummaryAction(): Promise<CircleUnreadSummary> {
  const supabase = await createClient();
  return getCircleUnreadSummary(supabase);
}

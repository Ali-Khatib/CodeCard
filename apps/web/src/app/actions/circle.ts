'use server';

import { createClient } from '@/lib/supabase/server';
import { listCircleFeed } from '@/lib/circle/circle-feed-core';
import type { CircleFeedCursor, CircleFeedState } from '@/lib/circle/circle-activity-contract';

export type { CircleFeedState };

export async function listCircleFeedAction(input?: {
  cursor?: CircleFeedCursor | null;
  limit?: number;
}): Promise<CircleFeedState> {
  const supabase = await createClient();
  return listCircleFeed(supabase, {
    cursor: input?.cursor ?? null,
    limit: input?.limit,
  });
}

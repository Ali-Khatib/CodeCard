'use client';

import { createSessionId, isAnalyticsResourceId, trackEvent } from '@codecard/analytics';

export type ProfileShareMethod = 'copy' | 'native_share';

/**
 * Fire-and-forget share analytics after a successful user action.
 * Failures must never reverse copy / native share / download success.
 */
export async function trackProfileShareEvent(
  profileId: string | null | undefined,
  method: ProfileShareMethod,
): Promise<void> {
  if (!isAnalyticsResourceId(profileId ?? undefined)) return;

  await trackEvent('/api/analytics', {
    event_type: 'profile_share',
    profile_id: profileId!,
    target_type: 'profile',
    target_id: profileId!,
    session_id: createSessionId(),
    metadata: { method },
  });
}

export async function trackQrDownloadEvent(
  profileId: string | null | undefined,
): Promise<void> {
  if (!isAnalyticsResourceId(profileId ?? undefined)) return;

  await trackEvent('/api/analytics', {
    event_type: 'qr_download',
    profile_id: profileId!,
    target_type: 'profile',
    target_id: profileId!,
    session_id: createSessionId(),
  });
}

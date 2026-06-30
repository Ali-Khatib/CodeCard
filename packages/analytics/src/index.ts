import type { ConnectionSource } from '@codecard/types';

export type AnalyticsEventType =
  | 'profile_view'
  | 'project_view'
  | 'link_click'
  | 'resume_click'
  | 'save_connection';

export interface AnalyticsEventPayload {
  event_type: AnalyticsEventType;
  profile_id?: string;
  project_id?: string;
  source?: ConnectionSource | null;
  referrer?: string | null;
  session_id?: string | null;
  metadata?: Record<string, string | number | boolean>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isAnalyticsResourceId(id: string | undefined): id is string {
  return Boolean(id && UUID_RE.test(id));
}

export function createSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function trackEvent(
  endpoint: string,
  payload: AnalyticsEventPayload,
): Promise<void> {
  if (payload.profile_id && !isAnalyticsResourceId(payload.profile_id)) return;
  if (payload.project_id && !isAnalyticsResourceId(payload.project_id)) return;

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Analytics should never break UX
  }
}

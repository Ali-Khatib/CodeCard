import 'server-only';

import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

export const MODERATION_REPORT_ACTIONS = ['resolve', 'dismiss'] as const;

export const moderationReportActionSchema = z.object({
  action: z.enum(MODERATION_REPORT_ACTIONS),
});

export const moderationReportIdSchema = z.string().uuid();

export type ModerationReportAction = (typeof MODERATION_REPORT_ACTIONS)[number];
export type ModerationReportActionResult =
  | {
      ok: true;
      outcome: 'updated' | 'idempotent';
      status: 'resolved' | 'dismissed';
      auditInserted: boolean;
    }
  | { ok: false; reason: 'not_found' | 'conflict' | 'service_unavailable' };

type PrivilegedClient = Awaited<ReturnType<typeof createServiceClient>>;

type TransitionPayload = {
  outcome?: unknown;
  resulting_status?: unknown;
  audit_inserted?: unknown;
};

function normalizePayload(data: unknown): TransitionPayload | null {
  const value = Array.isArray(data) ? data[0] : data;
  return value && typeof value === 'object' ? (value as TransitionPayload) : null;
}

/**
 * Execute the narrow WS13-T004 database transition.
 *
 * The database function holds a row lock and writes the status + audit evidence
 * in one transaction. Actor identity must come from requireGlobalAdminApiAccess.
 */
export async function transitionModerationReport(
  input: {
    reportId: string;
    action: ModerationReportAction;
    actorUserId: string;
  },
  deps?: { createPrivilegedClient?: () => Promise<PrivilegedClient> },
): Promise<ModerationReportActionResult> {
  try {
    const service = await (deps?.createPrivilegedClient ?? createServiceClient)();
    const { data, error } = await service.rpc('admin_transition_moderation_report', {
      p_report_id: input.reportId,
      p_action: input.action,
      p_actor_user_id: input.actorUserId,
    });

    if (error) return { ok: false, reason: 'service_unavailable' };

    const payload = normalizePayload(data);
    if (!payload || typeof payload.outcome !== 'string') {
      return { ok: false, reason: 'service_unavailable' };
    }
    if (payload.outcome === 'not_found') return { ok: false, reason: 'not_found' };
    if (payload.outcome === 'conflict') return { ok: false, reason: 'conflict' };

    const expectedStatus = input.action === 'resolve' ? 'resolved' : 'dismissed';
    if (
      (payload.outcome !== 'updated' && payload.outcome !== 'idempotent') ||
      payload.resulting_status !== expectedStatus
    ) {
      return { ok: false, reason: 'service_unavailable' };
    }

    return {
      ok: true,
      outcome: payload.outcome,
      status: expectedStatus,
      auditInserted: payload.audit_inserted === true,
    };
  } catch {
    return { ok: false, reason: 'service_unavailable' };
  }
}

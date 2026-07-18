import 'server-only';

import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

export const ADMIN_HIDE_TARGET_TYPES = ['profile', 'project'] as const;

export const hideReportedContentSchema = z
  .object({
    reportId: z.string().uuid(),
    targetType: z.enum(ADMIN_HIDE_TARGET_TYPES),
    targetId: z.string().uuid(),
  })
  .strict();

export type AdminHideTargetType = (typeof ADMIN_HIDE_TARGET_TYPES)[number];
export type HideReportedContentResult =
  | {
      ok: true;
      outcome: 'updated' | 'idempotent';
      targetType: AdminHideTargetType;
      targetId: string;
      profileSlug: string;
      isPublic: false;
      auditInserted: boolean;
    }
  | {
      ok: false;
      reason:
        | 'report_not_found'
        | 'target_not_found'
        | 'target_mismatch'
        | 'conflict'
        | 'service_unavailable';
    };

type PrivilegedClient = Awaited<ReturnType<typeof createServiceClient>>;

export async function hideReportedContent(
  input: {
    actorUserId: string;
    reportId: string;
    targetType: AdminHideTargetType;
    targetId: string;
  },
  deps?: { createPrivilegedClient?: () => Promise<PrivilegedClient> },
): Promise<HideReportedContentResult> {
  try {
    const service = await (deps?.createPrivilegedClient ?? createServiceClient)();
    const { data, error } = await service.rpc('admin_hide_reported_content', {
      p_actor_user_id: input.actorUserId,
      p_report_id: input.reportId,
      p_target_type: input.targetType,
      p_target_id: input.targetId,
    });

    if (error) return { ok: false, reason: 'service_unavailable' };

    const payload = (Array.isArray(data) ? data[0] : data) as
      | {
          outcome?: unknown;
          target_type?: unknown;
          target_id?: unknown;
          profile_slug?: unknown;
          is_public?: unknown;
          audit_inserted?: unknown;
        }
      | null;

    if (!payload || typeof payload.outcome !== 'string') {
      return { ok: false, reason: 'service_unavailable' };
    }
    if (
      payload.outcome === 'report_not_found' ||
      payload.outcome === 'target_not_found' ||
      payload.outcome === 'target_mismatch' ||
      payload.outcome === 'conflict'
    ) {
      return { ok: false, reason: payload.outcome };
    }

    if (
      (payload.outcome !== 'updated' && payload.outcome !== 'idempotent') ||
      payload.target_type !== input.targetType ||
      payload.target_id !== input.targetId ||
      typeof payload.profile_slug !== 'string' ||
      payload.is_public !== false
    ) {
      return { ok: false, reason: 'service_unavailable' };
    }

    return {
      ok: true,
      outcome: payload.outcome,
      targetType: input.targetType,
      targetId: input.targetId,
      profileSlug: payload.profile_slug,
      isPublic: false,
      auditInserted: payload.audit_inserted === true,
    };
  } catch {
    return { ok: false, reason: 'service_unavailable' };
  }
}

import 'server-only';

import { createHmac } from 'node:crypto';
import { requireServerSecret } from '@/lib/security/env';
import { createServiceClient } from '@/lib/supabase/server';

export type PublicReportTargetType = 'profile' | 'project';
export type PublicReportReasonCategory =
  | 'spam'
  | 'harassment'
  | 'impersonation'
  | 'copyright'
  | 'other';

type PrivilegedClient = Awaited<ReturnType<typeof createServiceClient>>;

export function createReportSourceFingerprint(
  input: { ip: string; reporterUserId: string | null },
  secret = requireServerSecret('SUPABASE_SERVICE_ROLE_KEY'),
): string {
  const source = input.reporterUserId
    ? `user:${input.reporterUserId}`
    : `network:${input.ip.trim() || 'unknown'}`;
  return createHmac('sha256', secret).update(`moderation:${source}`).digest('hex');
}

export type SubmitPublicReportResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'target_unavailable' | 'invalid' | 'service_unavailable';
    };

export async function submitPublicReport(
  input: {
    reporterUserId: string | null;
    targetType: PublicReportTargetType;
    targetId: string;
    reasonCategory: PublicReportReasonCategory;
    description?: string;
    sourceFingerprint: string;
  },
  deps?: { createPrivilegedClient?: () => Promise<PrivilegedClient> },
): Promise<SubmitPublicReportResult> {
  try {
    const service = await (deps?.createPrivilegedClient ?? createServiceClient)();
    const { data, error } = await service.rpc('submit_public_moderation_report', {
      p_reporter_user_id: input.reporterUserId,
      p_target_type: input.targetType,
      p_target_id: input.targetId,
      p_reason_category: input.reasonCategory,
      p_description: input.description?.trim() || null,
      p_source_fingerprint: input.sourceFingerprint,
    });

    if (error) return { ok: false, reason: 'service_unavailable' };
    const payload = (Array.isArray(data) ? data[0] : data) as
      | { outcome?: unknown }
      | null;
    if (!payload || typeof payload.outcome !== 'string') {
      return { ok: false, reason: 'service_unavailable' };
    }
    if (payload.outcome === 'accepted') return { ok: true };
    if (
      payload.outcome === 'target_unavailable' ||
      payload.outcome === 'invalid'
    ) {
      return { ok: false, reason: payload.outcome };
    }
    return { ok: false, reason: 'service_unavailable' };
  } catch {
    return { ok: false, reason: 'service_unavailable' };
  }
}

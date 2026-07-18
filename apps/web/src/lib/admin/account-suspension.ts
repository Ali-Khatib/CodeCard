import 'server-only';

import { z } from 'zod';
import { writeAdminAuditEvent } from '@/lib/admin/admin-audit';
import { DEMO_WORKSPACE } from '@/lib/dashboard/workspace-demo';
import { GLOBAL_ADMIN_APP_METADATA_ROLE } from '@/lib/security/admin-authorization';
import { createServiceClient } from '@/lib/supabase/server';

/** Long-lived Auth ban used as the supported Supabase suspension mechanism. */
export const ACCOUNT_SUSPENSION_BAN_DURATION = '876000h';

export const suspendAccountSchema = z
  .object({
    reportId: z.string().uuid().optional(),
  })
  .strict();

export type SuspendAccountResult =
  | {
      ok: true;
      outcome: 'updated' | 'idempotent';
      targetUserId: string;
      authSuspended: true;
      auditInserted: boolean;
    }
  | {
      ok: false;
      reason:
        | 'target_not_found'
        | 'self_suspension'
        | 'last_admin'
        | 'demo_identity'
        | 'service_identity'
        | 'report_not_found'
        | 'target_mismatch'
        | 'auth_partial'
        | 'service_unavailable';
    };

type PrivilegedClient = Awaited<ReturnType<typeof createServiceClient>>;

type AuthAdminUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
  banned_until?: string | null;
  is_anonymous?: boolean | null;
};

function isAlreadyBanned(user: AuthAdminUser): boolean {
  if (!user.banned_until) return false;
  const bannedUntil = Date.parse(user.banned_until);
  return Number.isFinite(bannedUntil) && bannedUntil > Date.now();
}

function isDemoIdentity(user: AuthAdminUser): boolean {
  const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
  if (email === DEMO_WORKSPACE.email.toLowerCase()) return true;
  if (user.app_metadata?.codecard_demo === true) return true;
  if (user.user_metadata?.codecard_demo === true) return true;
  return false;
}

function isServiceIdentity(user: AuthAdminUser): boolean {
  if (user.is_anonymous === true) return true;
  if (user.app_metadata?.codecard_service === true) return true;
  const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
  return email.endsWith('@service.codecard.internal');
}

function isGlobalAdminUser(user: AuthAdminUser): boolean {
  return user.app_metadata?.role === GLOBAL_ADMIN_APP_METADATA_ROLE;
}

async function writeSuspensionAudit(
  input: {
    actorUserId: string;
    targetUserId: string;
    reportId?: string;
    action: 'user.suspended' | 'user.suspension_failed' | 'user.suspension_partial';
    result: 'succeeded' | 'failed' | 'partial';
    phase: string;
    outcome?: string;
  },
  deps?: { createPrivilegedClient?: () => Promise<PrivilegedClient> },
) {
  return writeAdminAuditEvent(
    {
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: 'auth_user',
      resourceId: input.targetUserId,
      result: input.result,
      idempotencyKey: `user-suspend:${input.targetUserId}:${input.action}:${input.phase}`,
      metadata: {
        phase: input.phase,
        ...(input.reportId ? { report_id: input.reportId } : {}),
        ...(input.outcome ? { outcome: input.outcome } : {}),
      },
    },
    deps,
  );
}

/**
 * Suspend a reported account: durable DB marker + content unpublish, then Auth ban.
 *
 * Order (Auth and DB are not one transaction):
 * 1. Validate target / protections
 * 2. Prepare durable suspension + unpublish owned public content
 * 3. Apply Auth ban_duration
 * 4. Audit success, or audit partial/failed for retry
 *
 * Billing/Stripe is intentionally unchanged by suspension.
 */
export async function suspendAccount(
  input: {
    actorUserId: string;
    targetUserId: string;
    reportId?: string;
  },
  deps?: { createPrivilegedClient?: () => Promise<PrivilegedClient> },
): Promise<SuspendAccountResult> {
  if (input.actorUserId === input.targetUserId) {
    return { ok: false, reason: 'self_suspension' };
  }

  try {
    const service = await (deps?.createPrivilegedClient ?? createServiceClient)();

    const { data: existing, error: getError } = await service.auth.admin.getUserById(
      input.targetUserId,
    );

    if (getError || !existing?.user) {
      await writeSuspensionAudit(
        {
          actorUserId: input.actorUserId,
          targetUserId: input.targetUserId,
          reportId: input.reportId,
          action: 'user.suspension_failed',
          result: 'failed',
          phase: 'lookup',
        },
        deps,
      );
      return { ok: false, reason: 'target_not_found' };
    }

    const target = existing.user as AuthAdminUser;
    if (target.id !== input.targetUserId) {
      return { ok: false, reason: 'target_not_found' };
    }
    if (isDemoIdentity(target)) {
      return { ok: false, reason: 'demo_identity' };
    }
    if (isServiceIdentity(target)) {
      return { ok: false, reason: 'service_identity' };
    }

    if (isGlobalAdminUser(target)) {
      const { data: otherAdminCount, error: countError } = await service.rpc(
        'admin_count_other_active_global_admins',
        { p_target_user_id: input.targetUserId },
      );
      if (countError || typeof otherAdminCount !== 'number') {
        return { ok: false, reason: 'service_unavailable' };
      }
      if (otherAdminCount < 1) {
        return { ok: false, reason: 'last_admin' };
      }
    }

    const alreadyBanned = isAlreadyBanned(target);

    const { data: prepareData, error: prepareError } = await service.rpc(
      'admin_prepare_account_suspension',
      {
        p_actor_user_id: input.actorUserId,
        p_target_user_id: input.targetUserId,
        p_report_id: input.reportId ?? null,
      },
    );

    if (prepareError) {
      await writeSuspensionAudit(
        {
          actorUserId: input.actorUserId,
          targetUserId: input.targetUserId,
          reportId: input.reportId,
          action: 'user.suspension_failed',
          result: 'failed',
          phase: 'prepare',
        },
        deps,
      );
      return { ok: false, reason: 'service_unavailable' };
    }

    const prepare = (Array.isArray(prepareData) ? prepareData[0] : prepareData) as
      | { outcome?: unknown; target_user_id?: unknown }
      | null;

    if (!prepare || typeof prepare.outcome !== 'string') {
      return { ok: false, reason: 'service_unavailable' };
    }
    if (
      prepare.outcome === 'self_suspension' ||
      prepare.outcome === 'report_not_found' ||
      prepare.outcome === 'target_mismatch'
    ) {
      return { ok: false, reason: prepare.outcome };
    }
    if (prepare.outcome !== 'updated' && prepare.outcome !== 'idempotent') {
      return { ok: false, reason: 'service_unavailable' };
    }

    if (alreadyBanned && prepare.outcome === 'idempotent') {
      const audit = await writeSuspensionAudit(
        {
          actorUserId: input.actorUserId,
          targetUserId: input.targetUserId,
          reportId: input.reportId,
          action: 'user.suspended',
          result: 'succeeded',
          phase: 'complete',
          outcome: 'idempotent',
        },
        deps,
      );
      return {
        ok: true,
        outcome: 'idempotent',
        targetUserId: input.targetUserId,
        authSuspended: true,
        auditInserted: audit.ok ? audit.inserted : false,
      };
    }

    if (!alreadyBanned) {
      const { error: banError } = await service.auth.admin.updateUserById(input.targetUserId, {
        ban_duration: ACCOUNT_SUSPENSION_BAN_DURATION,
      });

      if (banError) {
        await writeSuspensionAudit(
          {
            actorUserId: input.actorUserId,
            targetUserId: input.targetUserId,
            reportId: input.reportId,
            action: 'user.suspension_partial',
            result: 'partial',
            phase: 'auth_ban',
            outcome: prepare.outcome,
          },
          deps,
        );
        return { ok: false, reason: 'auth_partial' };
      }
    }

    const audit = await writeSuspensionAudit(
      {
        actorUserId: input.actorUserId,
        targetUserId: input.targetUserId,
        reportId: input.reportId,
        action: 'user.suspended',
        result: 'succeeded',
        phase: 'complete',
        outcome: prepare.outcome,
      },
      deps,
    );

    return {
      ok: true,
      outcome: prepare.outcome,
      targetUserId: input.targetUserId,
      authSuspended: true,
      auditInserted: audit.ok ? audit.inserted : false,
    };
  } catch {
    return { ok: false, reason: 'service_unavailable' };
  }
}

export async function resolveReportOwnerUserId(
  input: { targetType: 'profile' | 'project' | 'media'; targetId: string },
  deps?: { createPrivilegedClient?: () => Promise<PrivilegedClient> },
): Promise<string | null> {
  try {
    const service = await (deps?.createPrivilegedClient ?? createServiceClient)();

    if (input.targetType === 'profile') {
      const { data } = await service
        .from('profiles')
        .select('owner_user_id')
        .eq('id', input.targetId)
        .maybeSingle();
      return typeof data?.owner_user_id === 'string' ? data.owner_user_id : null;
    }

    if (input.targetType === 'project') {
      const { data } = await service
        .from('projects')
        .select('owner_user_id')
        .eq('id', input.targetId)
        .maybeSingle();
      return typeof data?.owner_user_id === 'string' ? data.owner_user_id : null;
    }

    const { data: media } = await service
      .from('project_media_assets')
      .select('project_id')
      .eq('id', input.targetId)
      .maybeSingle();
    if (!media?.project_id) return null;

    const { data: project } = await service
      .from('projects')
      .select('owner_user_id')
      .eq('id', media.project_id)
      .maybeSingle();
    return typeof project?.owner_user_id === 'string' ? project.owner_user_id : null;
  } catch {
    return null;
  }
}

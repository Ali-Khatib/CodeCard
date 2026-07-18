import 'server-only';

import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

export const ADMIN_AUDIT_ACTIONS = [
  'moderation_report.resolved',
  'moderation_report.dismissed',
  'content.hidden',
  'user.suspended',
  'user.suspension_failed',
  'user.suspension_partial',
  'moderation_note.updated',
] as const;

export const ADMIN_AUDIT_RESOURCE_TYPES = [
  'moderation_report',
  'profile',
  'project',
  'research',
  'auth_user',
] as const;

export const ADMIN_AUDIT_RESULTS = ['succeeded', 'failed', 'partial'] as const;
export const ADMIN_AUDIT_METADATA_MAX_BYTES = 4096;
export const ADMIN_AUDIT_IDEMPOTENCY_KEY_MAX_LENGTH = 200;

const FORBIDDEN_METADATA_KEYS = new Set([
  'authorization',
  'cookie',
  'email',
  'error',
  'headers',
  'note',
  'password',
  'reason',
  'report',
  'service_role',
  'session',
  'signature',
  'statement',
  'token',
]);

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];
export type AdminAuditResourceType = (typeof ADMIN_AUDIT_RESOURCE_TYPES)[number];
export type AdminAuditResultStatus = (typeof ADMIN_AUDIT_RESULTS)[number];
export type AdminAuditMetadata = Record<string, string | number | boolean | null>;

const adminAuditInputSchema = z
  .object({
    actorUserId: z.string().uuid(),
    action: z.enum(ADMIN_AUDIT_ACTIONS),
    resourceType: z.enum(ADMIN_AUDIT_RESOURCE_TYPES),
    resourceId: z.string().uuid(),
    result: z.enum(ADMIN_AUDIT_RESULTS),
    idempotencyKey: z.string().min(1).max(ADMIN_AUDIT_IDEMPOTENCY_KEY_MAX_LENGTH),
    metadata: z.record(z.union([z.string(), z.number().finite(), z.boolean(), z.null()])),
  })
  .strict();

type PrivilegedClient = Awaited<ReturnType<typeof createServiceClient>>;

export type AdminAuditWriteResult =
  | { ok: true; inserted: boolean; auditId: string }
  | { ok: false; reason: 'invalid_input' | 'service_unavailable' };

function logAuditWriteFailure(reason: 'provider_error' | 'invalid_response' | 'exception'): void {
  // Intentionally excludes actor, target, metadata, provider errors, and credentials.
  console.error('[admin-audit] write failed', { reason });
}

export function validateAdminAuditInput(
  input: unknown,
):
  | { ok: true; data: z.infer<typeof adminAuditInputSchema> }
  | { ok: false; reason: 'invalid_input' } {
  const parsed = adminAuditInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: 'invalid_input' };

  for (const key of Object.keys(parsed.data.metadata)) {
    if (FORBIDDEN_METADATA_KEYS.has(key.toLowerCase())) {
      return { ok: false, reason: 'invalid_input' };
    }
  }

  if (
    Buffer.byteLength(JSON.stringify(parsed.data.metadata), 'utf8') >
    ADMIN_AUDIT_METADATA_MAX_BYTES
  ) {
    return { ok: false, reason: 'invalid_input' };
  }

  const actionMatchesResource =
    ((parsed.data.action === 'moderation_report.resolved' ||
      parsed.data.action === 'moderation_report.dismissed' ||
      parsed.data.action === 'moderation_note.updated') &&
      parsed.data.resourceType === 'moderation_report') ||
    (parsed.data.action === 'content.hidden' &&
      (parsed.data.resourceType === 'profile' ||
        parsed.data.resourceType === 'project' ||
        parsed.data.resourceType === 'research')) ||
    ((parsed.data.action === 'user.suspended' ||
      parsed.data.action === 'user.suspension_failed' ||
      parsed.data.action === 'user.suspension_partial') &&
      parsed.data.resourceType === 'auth_user');

  return actionMatchesResource
    ? { ok: true, data: parsed.data }
    : { ok: false, reason: 'invalid_input' };
}

/**
 * Canonical server-only writer for privileged administrative audit events.
 *
 * Callers must derive actorUserId from requireGlobalAdminApiAccess; this writer
 * is intentionally not exposed as a browser route.
 */
export async function writeAdminAuditEvent(
  input: {
    actorUserId: string;
    action: AdminAuditAction;
    resourceType: AdminAuditResourceType;
    resourceId: string;
    result: AdminAuditResultStatus;
    idempotencyKey: string;
    metadata: AdminAuditMetadata;
  },
  deps?: { createPrivilegedClient?: () => Promise<PrivilegedClient> },
): Promise<AdminAuditWriteResult> {
  const validated = validateAdminAuditInput(input);
  if (!validated.ok) return validated;

  try {
    const service = await (deps?.createPrivilegedClient ?? createServiceClient)();
    const { data, error } = await service.rpc('insert_admin_audit_event', {
      p_actor_user_id: validated.data.actorUserId,
      p_action: validated.data.action,
      p_resource_type: validated.data.resourceType,
      p_resource_id: validated.data.resourceId,
      p_result: validated.data.result,
      p_idempotency_key: validated.data.idempotencyKey,
      p_metadata: validated.data.metadata,
    });

    if (error) {
      logAuditWriteFailure('provider_error');
      return { ok: false, reason: 'service_unavailable' };
    }

    const payload = (Array.isArray(data) ? data[0] : data) as
      | { ok?: unknown; inserted?: unknown; audit_id?: unknown }
      | null;
    if (
      !payload ||
      payload.ok !== true ||
      typeof payload.inserted !== 'boolean' ||
      typeof payload.audit_id !== 'string'
    ) {
      logAuditWriteFailure('invalid_response');
      return { ok: false, reason: 'service_unavailable' };
    }

    return {
      ok: true,
      inserted: payload.inserted,
      auditId: payload.audit_id,
    };
  } catch {
    logAuditWriteFailure('exception');
    return { ok: false, reason: 'service_unavailable' };
  }
}

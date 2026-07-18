import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  suspendAccount,
  suspendAccountSchema,
} from '@/lib/admin/account-suspension';
import { apiError, internalError, validationError } from '@/lib/api-utils';
import { requireGlobalAdminApiAccess } from '@/lib/security/admin-api-authorization';
import { parseJsonBody } from '@/lib/security/request';
import { isSameOriginMutation } from '@/lib/security/same-origin';

export const dynamic = 'force-dynamic';

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

const targetUserIdSchema = z.string().uuid();

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await requireGlobalAdminApiAccess();
  if (!authorization.ok) return authorization.response;

  if (!isSameOriginMutation(request)) {
    return apiError('Forbidden', 403);
  }

  const { id } = await context.params;
  const targetParsed = targetUserIdSchema.safeParse(id);
  if (!targetParsed.success) {
    return apiError('User not found', 404);
  }

  const body = await parseJsonBody(request, 2048);
  if (!body.ok) return body.response;
  const parsed = suspendAccountSchema.safeParse(body.data ?? {});
  if (!parsed.success) return validationError(parsed.error);

  // Ignore any client-supplied actor identity; authorization.userId is authoritative.
  const result = await suspendAccount({
    actorUserId: authorization.userId,
    targetUserId: targetParsed.data,
    reportId: parsed.data.reportId,
  });

  if (!result.ok) {
    if (result.reason === 'target_not_found' || result.reason === 'report_not_found') {
      return apiError('User not found', 404);
    }
    if (
      result.reason === 'self_suspension' ||
      result.reason === 'last_admin' ||
      result.reason === 'demo_identity' ||
      result.reason === 'service_identity' ||
      result.reason === 'target_mismatch'
    ) {
      return apiError('Suspension is not allowed for this account', 409);
    }
    if (result.reason === 'auth_partial') {
      return apiError('Suspension is incomplete and can be retried', 503);
    }
    return internalError();
  }

  return NextResponse.json(
    {
      ok: true,
      outcome: result.outcome,
      targetUserId: result.targetUserId,
      suspended: true,
    },
    { headers: PRIVATE_HEADERS },
  );
}

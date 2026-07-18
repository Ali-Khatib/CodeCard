import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { apiError, internalError, validationError } from '@/lib/api-utils';
import {
  moderationReportActionSchema,
  moderationReportIdSchema,
  transitionModerationReport,
} from '@/lib/admin/moderation-actions';
import { requireGlobalAdminApiAccess } from '@/lib/security/admin-api-authorization';
import { parseJsonBody } from '@/lib/security/request';
import { isSameOriginMutation } from '@/lib/security/same-origin';

export const dynamic = 'force-dynamic';

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authorization = await requireGlobalAdminApiAccess();
  if (!authorization.ok) return authorization.response;

  if (!isSameOriginMutation(request)) {
    return apiError('Forbidden', 403);
  }

  const { id } = await context.params;
  const parsedId = moderationReportIdSchema.safeParse(id);
  if (!parsedId.success) {
    return apiError('Invalid report identifier', 422);
  }

  const body = await parseJsonBody(request, 1024);
  if (!body.ok) return body.response;
  const parsedAction = moderationReportActionSchema.safeParse(body.data);
  if (!parsedAction.success) return validationError(parsedAction.error);

  const result = await transitionModerationReport({
    reportId: parsedId.data,
    action: parsedAction.data.action,
    actorUserId: authorization.userId,
  });

  if (!result.ok) {
    if (result.reason === 'not_found') return apiError('Report not found', 404);
    if (result.reason === 'conflict') {
      return apiError('Report status changed. Refresh and try again.', 409);
    }
    return internalError();
  }

  revalidatePath('/admin');
  return NextResponse.json(
    {
      ok: true,
      outcome: result.outcome,
      status: result.status,
    },
    { headers: PRIVATE_HEADERS },
  );
}

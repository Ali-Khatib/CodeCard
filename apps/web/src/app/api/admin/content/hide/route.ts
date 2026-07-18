import { NextResponse } from 'next/server';
import { apiError, internalError, validationError } from '@/lib/api-utils';
import {
  hideReportedContent,
  hideReportedContentSchema,
} from '@/lib/admin/content-hiding';
import { requireGlobalAdminApiAccess } from '@/lib/security/admin-api-authorization';
import { parseJsonBody } from '@/lib/security/request';
import { isSameOriginMutation } from '@/lib/security/same-origin';
import {
  revalidatePublicProfile,
  revalidatePublicProject,
} from '@/lib/profile/public-cache';

export const dynamic = 'force-dynamic';

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

export async function POST(request: Request) {
  const authorization = await requireGlobalAdminApiAccess();
  if (!authorization.ok) return authorization.response;

  if (!isSameOriginMutation(request)) {
    return apiError('Forbidden', 403);
  }

  const body = await parseJsonBody(request, 2048);
  if (!body.ok) return body.response;
  const parsed = hideReportedContentSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error);

  const result = await hideReportedContent({
    actorUserId: authorization.userId,
    reportId: parsed.data.reportId,
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
  });

  if (!result.ok) {
    if (result.reason === 'report_not_found' || result.reason === 'target_not_found') {
      return apiError('Reported content not found', 404);
    }
    if (result.reason === 'target_mismatch') {
      return apiError('Report target does not match content', 409);
    }
    if (result.reason === 'conflict') {
      return apiError('Report cannot be used for this action', 409);
    }
    return internalError();
  }

  if (result.targetType === 'profile') {
    revalidatePublicProfile(result.profileSlug);
  } else {
    revalidatePublicProject(result.profileSlug, result.targetId);
  }

  return NextResponse.json(
    {
      ok: true,
      outcome: result.outcome,
      targetType: result.targetType,
      targetId: result.targetId,
      isPublic: false,
    },
    { headers: PRIVATE_HEADERS },
  );
}

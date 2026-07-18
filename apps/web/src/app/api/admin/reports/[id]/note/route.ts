import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { apiError, internalError, validationError } from '@/lib/api-utils';
import { moderationReportIdSchema } from '@/lib/admin/moderation-actions';
import {
  moderationNoteUpdateSchema,
  updateModerationNote,
} from '@/lib/admin/moderation-notes';
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

export async function PUT(request: Request, context: RouteContext) {
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

  const body = await parseJsonBody(request, 8192);
  if (!body.ok) return body.response;
  const parsed = moderationNoteUpdateSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error);

  const result = await updateModerationNote({
    actorUserId: authorization.userId,
    reportId: parsedId.data,
    note: parsed.data.note,
    expectedUpdatedAt: parsed.data.expectedUpdatedAt,
  });

  if (!result.ok) {
    if (result.reason === 'not_found') return apiError('Report not found', 404);
    if (result.reason === 'conflict') {
      return apiError('The note changed. Refresh before saving again.', 409);
    }
    if (result.reason === 'too_large') {
      return apiError('Internal note is too long', 422);
    }
    return internalError();
  }

  revalidatePath('/admin');
  return NextResponse.json(
    {
      ok: true,
      outcome: result.outcome,
      notePresent: result.notePresent,
      noteLength: result.noteLength,
      updatedAt: result.updatedAt,
    },
    { headers: PRIVATE_HEADERS },
  );
}

import { NextResponse } from 'next/server';
import { internalError, validationError } from '@/lib/api-utils';
import { dmcaNoticeListQuerySchema, listDmcaNotices } from '@/lib/admin/moderation-data';
import { requireGlobalAdminApiAccess } from '@/lib/security/admin-api-authorization';

export const dynamic = 'force-dynamic';

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request: Request) {
  const authorization = await requireGlobalAdminApiAccess();
  if (!authorization.ok) return authorization.response;

  const url = new URL(request.url);
  const parsed = dmcaNoticeListQuerySchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    pageSize: url.searchParams.get('pageSize') ?? undefined,
    status: url.searchParams.get('status') ?? undefined,
  });
  if (!parsed.success) return validationError(parsed.error);

  try {
    const result = await listDmcaNotices(parsed.data);
    return NextResponse.json(result, { headers: PRIVATE_HEADERS });
  } catch {
    return internalError();
  }
}

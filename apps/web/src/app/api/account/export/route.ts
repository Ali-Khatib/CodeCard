import { NextResponse } from 'next/server';
import { secureJsonRoute } from '@/lib/security/secure-route';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/api-utils';
import { isSameOriginMutation } from '@/lib/security/same-origin';
import {
  ACCOUNT_EXPORT_MAX_BYTES,
  accountExportRequestSchema,
  buildAccountExportFilename,
} from '@/lib/account/export-schema';
import { buildAccountExportDocument } from '@/lib/account/export-build';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return apiError('Forbidden', 403);
  }

  return secureJsonRoute(
    request,
    {
      schema: accountExportRequestSchema,
      rateLimitType: 'accountExport',
      requireAuth: true,
      strictRateLimit: true,
      maxBodyBytes: 4 * 1024,
    },
    async (_data, ctx) => {
      if (!ctx.userId) return apiError('Unauthorized', 401);

      const supabase = await createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user || user.id !== ctx.userId) {
        return apiError('Unauthorized', 401);
      }

      const built = await buildAccountExportDocument(supabase, user);
      if (!built.ok) {
        return apiError('We could not build your account export. Try again later.', 500);
      }

      const body = JSON.stringify(built.document, null, 2);
      if (Buffer.byteLength(body, 'utf8') > ACCOUNT_EXPORT_MAX_BYTES) {
        return apiError('Account export is too large to download synchronously.', 413);
      }

      const filename = buildAccountExportFilename();
      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store, private, no-cache, must-revalidate',
          Pragma: 'no-cache',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    },
  );
}

export async function GET() {
  return apiError('Method not allowed', 405);
}

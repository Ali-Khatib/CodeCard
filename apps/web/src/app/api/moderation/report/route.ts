import { NextResponse } from 'next/server';
import { moderationReportSchema } from '@codecard/validation';
import { createClient } from '@/lib/supabase/server';
import { secureJsonRoute } from '@/lib/security/secure-route';
import { apiError, internalError } from '@/lib/api-utils';
import {
  createReportSourceFingerprint,
  submitPublicReport,
} from '@/lib/moderation/public-reporting';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return secureJsonRoute(
    request,
    {
      schema: moderationReportSchema,
      rateLimitType: 'moderation',
      maxBodyBytes: 4096,
      strictRateLimit: true,
    },
    async (data, { ip }) => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const result = await submitPublicReport({
        reporterUserId: user?.id ?? null,
        targetType: data.target_type,
        targetId: data.target_id,
        reasonCategory: data.reason_category,
        description: data.description,
        sourceFingerprint: createReportSourceFingerprint({
          ip,
          reporterUserId: user?.id ?? null,
        }),
      });

      if (!result.ok) {
        if (result.reason === 'target_unavailable') {
          return apiError('Content is unavailable', 404);
        }
        if (result.reason === 'invalid') {
          return apiError('Invalid report', 422);
        }
        return internalError();
      }

      // Deliberately identical for inserted and duplicate reports.
      return NextResponse.json({ ok: true, status: 'accepted' });
    },
  );
}

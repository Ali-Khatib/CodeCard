import { NextResponse } from 'next/server';
import { moderationReportSchema } from '@codecard/validation';
import { createClient } from '@/lib/supabase/server';
import { secureJsonRoute } from '@/lib/security/secure-route';

export async function POST(request: Request) {
  return secureJsonRoute(
    request,
    { schema: moderationReportSchema, rateLimitType: 'moderation' },
    async (data, { userId }) => {
      const supabase = await createClient();

      await supabase.from('moderation_reports').insert({
        reporter_user_id: userId,
        target_type: data.target_type,
        target_id: data.target_id,
        reason: data.reason,
      });

      return NextResponse.json({ ok: true });
    },
  );
}

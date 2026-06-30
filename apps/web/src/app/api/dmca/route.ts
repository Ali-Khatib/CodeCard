import { NextResponse } from 'next/server';
import { dmcaNoticeSchema } from '@codecard/validation';
import { secureJsonRoute } from '@/lib/security/secure-route';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  return secureJsonRoute(
    request,
    { schema: dmcaNoticeSchema, rateLimitType: 'dmca', maxBodyBytes: 32 * 1024 },
    async (data) => {
      const supabase = await createServiceClient();

      await supabase.from('dmca_notices').insert({
        claimant_name: data.claimant_name,
        claimant_email: data.claimant_email,
        copyrighted_work: data.copyrighted_work,
        infringing_url: data.infringing_url,
        statement: data.statement,
        signature: data.signature,
      });

      return NextResponse.json({ ok: true, message: 'Notice received for review' });
    },
  );
}

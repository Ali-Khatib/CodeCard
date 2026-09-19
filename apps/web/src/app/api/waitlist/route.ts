import { NextResponse } from 'next/server';
import { waitlistSignupSchema } from '@codecard/validation';
import { secureJsonRoute } from '@/lib/security/secure-route';
import { createServiceClient } from '@/lib/supabase/server';
import { sendWaitlistConfirmationEmail } from '@/lib/waitlist/send-waitlist-confirmation';

/**
 * Public waitlist intake (intentional).
 *
 * Stores emails for launch mail. Confirmation is sent when Resend is configured.
 * Identity is not required; client roles never read this table.
 */
export async function POST(request: Request) {
  return secureJsonRoute(
    request,
    {
      schema: waitlistSignupSchema,
      rateLimitType: 'waitlist',
      maxBodyBytes: 8 * 1024,
      killSwitch: 'waitlist',
    },
    async (data) => {
      if (data.website.trim().length > 0) {
        return NextResponse.json({ ok: true, status: 'joined' });
      }

      const supabase = await createServiceClient();
      const { data: inserted, error } = await supabase
        .from('waitlist_signups')
        .insert({ email: data.email, source: 'landing' })
        .select('id')
        .maybeSingle();

      if (error?.code === '23505') {
        return NextResponse.json({ ok: true, status: 'already' });
      }

      if (error || !inserted?.id) {
        throw new Error('waitlist insert failed');
      }

      const sent = await sendWaitlistConfirmationEmail(data.email);
      if (sent) {
        await supabase
          .from('waitlist_signups')
          .update({ confirmation_sent_at: new Date().toISOString() })
          .eq('id', inserted.id);
      }

      return NextResponse.json({ ok: true, status: 'joined' });
    },
  );
}

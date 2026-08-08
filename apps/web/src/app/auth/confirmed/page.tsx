import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import {
  EMAIL_CONFIRMED_SUBTITLE,
  EMAIL_CONFIRMED_TITLE,
  NEW_ACCOUNT_SETUP_GUIDE,
} from '@/lib/auth/email-confirmed';

/**
 * Post–email-confirmation landing. Reached via
 * /auth/callback?redirect=/auth/confirmed after the user opens the Supabase link.
 */
export default function AuthEmailConfirmedPage() {
  return (
    <AuthShell
      mode="other"
      showCollage
      title={EMAIL_CONFIRMED_TITLE}
      subtitle={EMAIL_CONFIRMED_SUBTITLE}
    >
      <div className="space-y-6" data-testid="auth-email-confirmed">
        <div className="space-y-3">
          <Link
            href="/sign-in?redirect=%2Fdashboard"
            className="cc-btn-pill-primary flex w-full justify-center py-2.5 text-[15px]"
            data-testid="auth-confirmed-sign-in"
          >
            Sign in to your CodeCard
          </Link>
          <Link
            href="/dashboard"
            className="cc-btn-pill-ghost flex w-full justify-center py-2.5 text-[15px]"
            data-testid="auth-confirmed-open-workspace"
          >
            Already signed in? Open workspace
          </Link>
        </div>

        <section
          className="rounded-2xl border border-[rgba(34,34,34,0.08)] bg-[#fcf1e7]/70 px-4 py-4"
          aria-labelledby="new-account-guide-heading"
          data-testid="auth-confirmed-setup-guide"
        >
          <h2
            id="new-account-guide-heading"
            className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#5c5856]"
          >
            New account guide
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6f6c69]">
            After you sign in, build your card in this order. Each step names the
            exact place in the left sidebar.
          </p>
          <ol className="mt-4 space-y-3">
            {NEW_ACCOUNT_SETUP_GUIDE.map((step, index) => (
              <li key={step.id} className="flex gap-3 text-[14px] leading-snug text-[#232324]">
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#232324] text-[11px] font-semibold text-[#efedeb]"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div>
                  <p>
                    <span className="font-medium">{step.where}</span>
                    <span className="text-[#6f6c69]">. {step.what}</span>
                  </p>
                  <Link
                    href={step.href}
                    className="mt-1 inline-block text-[13px] text-[#7c5cbf] underline-offset-2 hover:underline"
                  >
                    Go to {step.where}
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <Link
          href="/"
          className="block text-center text-[14px] text-[#7a7876] underline-offset-2 hover:text-[#222222] hover:underline"
        >
          Back to landing
        </Link>
      </div>
    </AuthShell>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const SETTINGS_ROWS = ['Custom domain', 'QR & NFC links', 'Branding', 'Billing'] as const;

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-graphite">Settings</p>
        <h1 className="mt-2 font-display text-[28px] font-medium text-phosphor">Workspace settings</h1>
        <p className="mt-2 text-[15px] text-lichen">Signed in as {user!.email}</p>
      </div>

      <div className="space-y-3">
        {SETTINGS_ROWS.map((row) => {
          const content = (
            <>
              <span className="text-[15px] text-lichen">{row}</span>
              <span className="h-5 w-9 rounded-full bg-charcoal" aria-hidden />
            </>
          );

          if (row === 'Billing') {
            return (
              <Link
                key={row}
                href="/dashboard/billing"
                className="cc-workspace-tile flex items-center justify-between rounded-[10px] border border-border/40 px-4 py-3 transition-colors hover:border-reactor/30"
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={row}
              className="cc-workspace-tile flex items-center justify-between rounded-[10px] border border-border/40 px-4 py-3"
            >
              {content}
            </div>
          );
        })}
      </div>

      <form action={signOut}>
        <button type="submit" className="cc-btn-pill-ghost px-4 py-2 text-[14px]">
          Sign out
        </button>
      </form>
    </div>
  );
}

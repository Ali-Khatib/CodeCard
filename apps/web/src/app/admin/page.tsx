import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { enforceGlobalAdminAccess } from '@/lib/security/admin-route-gate';
import { Card, CardContent, CardHeader, CardTitle } from '@codecard/ui';

export default async function AdminPage() {
  // WS11-T002: authorize (global admin only) before any rendering or data fetch.
  await enforceGlobalAdminAccess();

  const supabase = await createClient();

  const { data: reports } = await supabase
    .from('moderation_reports')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: dmcaNotices } = await supabase
    .from('dmca_notices')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 px-6 py-4">
        <Link href="/dashboard" className="font-semibold">
          ← Dashboard
        </Link>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold">Moderation</h1>
        <p className="mt-1 text-zinc-400">Review reports and DMCA notices</p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Pending reports</h2>
          <div className="mt-4 space-y-4">
            {reports?.length === 0 && (
              <p className="text-sm text-zinc-500">No pending reports.</p>
            )}
            {reports?.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {report.target_type}: {report.target_id}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-400">{report.reason}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">DMCA notices</h2>
          <div className="mt-4 space-y-4">
            {dmcaNotices?.length === 0 && (
              <p className="text-sm text-zinc-500">No pending DMCA notices.</p>
            )}
            {dmcaNotices?.map((notice) => (
              <Card key={notice.id}>
                <CardHeader>
                  <CardTitle className="text-base">{notice.claimant_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-400">{notice.infringing_url}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

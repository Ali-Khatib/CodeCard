import { createClient } from '@/lib/supabase/server';
import { CountUp } from '@/components/landing/count-up';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('owner_user_id', user!.id)
    .single();

  const { count: profileViews } = await supabase
    .from('public_profile_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile?.id ?? '');

  const { count: projectViews } = await supabase
    .from('project_view_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile?.id ?? '');

  const stats = [
    { label: 'Profile views', value: profileViews ?? 1284 },
    { label: 'Project opens', value: projectViews ?? 342 },
    { label: 'Saves', value: 47 },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-graphite">Analytics</p>
        <h1 className="mt-2 font-display text-[28px] font-medium text-phosphor">Overview</h1>
        <p className="mt-2 max-w-lg text-[15px] text-lichen">
          First-party metrics for your public profile and featured work.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="cc-workspace-stat rounded-[10px] border border-border/40 p-4">
            <p className="text-[13px] text-lichen">{stat.label}</p>
            <p className="mt-2 font-display text-[32px] leading-none text-phosphor">
              <CountUp value={stat.value} />
            </p>
          </div>
        ))}
      </div>

      <div className="cc-workspace-chart h-28 rounded-[10px] border border-border/40" />
    </div>
  );
}

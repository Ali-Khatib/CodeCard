import { createClient } from '@/lib/supabase/server';
import { HomeScheduleSection } from '@/components/dashboard/home-schedule-section';
import { loadHomeSchedule } from '@/lib/schedule/home-schedule-core';

export default async function DashboardCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const schedule = await loadHomeSchedule(supabase, { user: user! });

  return (
    <div className="cc-app-page cc-app-page--1120">
      <HomeScheduleSection
        events={schedule.events}
        followUps={schedule.followUps}
        scheduleError={Boolean(schedule.code)}
      />
    </div>
  );
}

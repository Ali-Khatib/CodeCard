import { HomeScheduleSection } from '@/components/dashboard/home-schedule-section';
import { DEMO_CONNECTIONS, DEMO_OWNER_EVENTS } from '@/lib/dashboard/workspace-demo';
import { followUpsToHomeItems } from '@/lib/dashboard/connections-summary';
import { LIVE_DEMO_WORKSPACE_HREF } from '@/lib/marketing/demo-url';

export default function DemoCalendarPage() {
  return (
    <div className="cc-app-page cc-app-page--1120">
      <HomeScheduleSection
        events={DEMO_OWNER_EVENTS}
        followUps={followUpsToHomeItems(DEMO_CONNECTIONS)}
        preview
        basePath={LIVE_DEMO_WORKSPACE_HREF}
      />
    </div>
  );
}

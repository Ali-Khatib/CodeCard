import { DashboardCircleView } from '@/components/dashboard/dashboard-circle-view';
import { DEMO_CIRCLE_FEED } from '@/lib/dashboard/circle-demo';

export default function PreviewCirclePage() {
  return <DashboardCircleView items={DEMO_CIRCLE_FEED} />;
}

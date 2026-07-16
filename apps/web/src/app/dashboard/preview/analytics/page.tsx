import { PreviewAnalyticsView } from '@/components/dashboard/preview-analytics-view';

/**
 * Preview-only sample analytics route.
 * Authenticated owners use `/dashboard/analytics` with real aggregates.
 */
export default function PreviewAnalyticsPage() {
  return (
    <div aria-label="Preview demo sample analytics">
      <PreviewAnalyticsView displayName="Alex Chen" />
    </div>
  );
}

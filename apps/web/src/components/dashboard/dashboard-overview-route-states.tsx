'use client';

import { useRouter } from 'next/navigation';
import { AppButton, AppCard, PageHeader } from '@/components/dashboard/ui/dashboard-ui';

type DashboardOverviewRouteStateProps = {
  title: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
};

function DashboardOverviewRouteState({
  title,
  description,
  retryLabel = 'Try again',
  onRetry,
}: DashboardOverviewRouteStateProps) {
  const router = useRouter();

  return (
    <div className="cc-app-page cc-app-page--1120">
      <PageHeader eyebrow="Home" title="Dashboard" description="Your CodeCard workspace overview." />
      <AppCard className="max-w-2xl space-y-4">
        <h2 className="text-[20px] font-medium text-[var(--app-ink)]">{title}</h2>
        <p className="text-[15px] leading-relaxed text-[var(--app-smoke)]">{description}</p>
        <AppButton
          type="button"
          variant="primary"
          onClick={() => (onRetry ? onRetry() : router.refresh())}
        >
          {retryLabel}
        </AppButton>
      </AppCard>
    </div>
  );
}

export function DashboardOverviewMissingState() {
  return (
    <DashboardOverviewRouteState
      title="Profile not available"
      description="We could not load your profile record. Signup provisioning should normally create this automatically. Try again, or contact support if the problem continues."
    />
  );
}

export function DashboardOverviewLoadErrorState({ onRetry }: { onRetry?: () => void } = {}) {
  return (
    <DashboardOverviewRouteState
      title="Could not load dashboard"
      description="Something went wrong while loading your profile completion data. Please try again."
      onRetry={onRetry}
    />
  );
}

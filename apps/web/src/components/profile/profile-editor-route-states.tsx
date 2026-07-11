'use client';

import { useRouter } from 'next/navigation';
import { AppButton, AppCard, PageHeader } from '@/components/dashboard/ui/dashboard-ui';

type ProfileEditorRouteStateProps = {
  title: string;
  description: string;
  retryLabel?: string;
};

function ProfileEditorRouteState({
  title,
  description,
  retryLabel = 'Try again',
  onRetry,
}: ProfileEditorRouteStateProps & { onRetry?: () => void }) {
  const router = useRouter();

  return (
    <div className="cc-app-page cc-app-page--1120">
      <PageHeader eyebrow="Profile" title="Public identity" description="Edit the information visitors see on your CodeCard." />
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

export function ProfileEditorMissingState() {
  return (
    <ProfileEditorRouteState
      title="Profile not available"
      description="We could not load your profile record. Signup provisioning should normally create this automatically. Try again, or contact support if the problem continues."
    />
  );
}

export function ProfileEditorLoadErrorState({ onRetry }: { onRetry?: () => void } = {}) {
  return (
    <ProfileEditorRouteState
      title="Could not load profile"
      description="Something went wrong while loading your profile editor. Your changes are safe. Please try again."
      onRetry={onRetry}
    />
  );
}

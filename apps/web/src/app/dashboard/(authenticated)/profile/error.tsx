'use client';

import { ProfileEditorLoadErrorState } from '@/components/profile/profile-editor-route-states';

export default function DashboardProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ProfileEditorLoadErrorState onRetry={reset} />;
}

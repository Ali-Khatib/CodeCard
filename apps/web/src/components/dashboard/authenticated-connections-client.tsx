'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeConnectionAction } from '@/app/actions/connections';
import { DashboardConnectionsView } from '@/components/dashboard/dashboard-connections-view';
import type { AuthenticatedConnectionCard } from '@/lib/connections/map-owner-connection';

export function AuthenticatedConnectionsClient({
  initialConnections,
}: {
  initialConnections: AuthenticatedConnectionCard[];
}) {
  const router = useRouter();
  const [connections, setConnections] = useState(initialConnections);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConnections(initialConnections);
  }, [initialConnections]);

  const onRemove = useCallback(
    async (connectionId: string) => {
      const target = connections.find((c) => c.id === connectionId);
      const confirmed = window.confirm(
        `Remove ${target?.name ?? 'this person'} from your Connections? This does not delete their CodeCard.`,
      );
      if (!confirmed) {
        throw new Error('cancelled');
      }

      setError(null);
      const result = await removeConnectionAction({
        connectionId,
        targetProfileId: target?.savedProfileId,
        targetSlug: target?.profileSlug,
      });
      if (!result.success) {
        setError(result.error ?? 'Could not remove Connection.');
        throw new Error(result.error ?? 'Could not remove Connection.');
      }
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      router.refresh();
    },
    [connections, router],
  );

  return (
    <div>
      {error && (
        <p className="mb-4 text-[14px] text-[var(--app-danger,#b42318)]" role="alert">
          {error}{' '}
          <button
            type="button"
            className="underline"
            onClick={() => {
              setError(null);
              router.refresh();
            }}
          >
            Retry
          </button>
        </p>
      )}
      <DashboardConnectionsView
        connections={connections}
        variant="authenticated"
        onRemoveConnection={onRemove}
      />
    </div>
  );
}

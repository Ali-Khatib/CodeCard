'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeConnectionAction } from '@/app/actions/connections';
import {
  addConnectionToCollectionAction,
  removeConnectionFromCollectionAction,
} from '@/app/actions/collections';
import { DashboardConnectionsView } from '@/components/dashboard/dashboard-connections-view';
import { ConnectionsCollectionsPanel } from '@/components/dashboard/connections-collections-panel';
import { ConnectionPrivateDetails } from '@/components/dashboard/connection-private-details';
import type { AuthenticatedConnectionCard } from '@/lib/connections/map-owner-connection';
import type { OwnerCollection } from '@/lib/connections/collections-core';

export function AuthenticatedConnectionsClient({
  initialConnections,
  initialCollections,
  initialMemberships,
}: {
  initialConnections: AuthenticatedConnectionCard[];
  initialCollections: OwnerCollection[];
  initialMemberships: Record<string, string[]>;
}) {
  const router = useRouter();
  const [connections, setConnections] = useState(initialConnections);
  const [collections, setCollections] = useState(initialCollections);
  const [memberships, setMemberships] = useState(initialMemberships);
  const [error, setError] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const [detailsId, setDetailsId] = useState<string | null>(null);

  useEffect(() => {
    setConnections(initialConnections);
  }, [initialConnections]);

  useEffect(() => {
    setCollections(initialCollections);
  }, [initialCollections]);

  useEffect(() => {
    setMemberships(initialMemberships);
  }, [initialMemberships]);

  const detailsConnection = detailsId
    ? connections.find((c) => c.id === detailsId) ?? null
    : null;

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
      setMemberships((prev) => {
        const next = { ...prev };
        delete next[connectionId];
        return next;
      });
      router.refresh();
    },
    [connections, router],
  );

  const onToggleMembership = useCallback(
    async (connectionId: string, collectionId: string, assigned: boolean) => {
      setError(null);
      if (assigned) {
        const result = await removeConnectionFromCollectionAction({
          connectionId,
          collectionId,
        });
        if (!result.success) {
          setError(result.error ?? 'Could not update collection.');
          throw new Error(result.error ?? 'Could not update collection.');
        }
        setMemberships((prev) => ({
          ...prev,
          [connectionId]: (prev[connectionId] ?? []).filter((id) => id !== collectionId),
        }));
        setCollections((prev) =>
          prev.map((c) =>
            c.id === collectionId
              ? { ...c, connectionCount: Math.max(0, c.connectionCount - 1) }
              : c,
          ),
        );
      } else {
        const result = await addConnectionToCollectionAction({
          connectionId,
          collectionId,
        });
        if (!result.success) {
          setError(result.error ?? 'Could not update collection.');
          throw new Error(result.error ?? 'Could not update collection.');
        }
        setMemberships((prev) => {
          const current = prev[connectionId] ?? [];
          if (current.includes(collectionId)) return prev;
          return { ...prev, [connectionId]: [...current, collectionId] };
        });
        setCollections((prev) =>
          prev.map((c) =>
            c.id === collectionId ? { ...c, connectionCount: c.connectionCount + 1 } : c,
          ),
        );
      }
      router.refresh();
    },
    [router],
  );

  return (
    <div className="space-y-8">
      {error && (
        <p className="text-[14px] text-[var(--app-danger,#b42318)]" role="alert">
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
      <ConnectionsCollectionsPanel
        initialCollections={collections}
        onCollectionsChange={setCollections}
      />
      <DashboardConnectionsView
        connections={connections}
        variant="authenticated"
        onRemoveConnection={onRemove}
        collections={collections}
        memberships={memberships}
        onToggleMembership={onToggleMembership}
        onOpenPrivateDetails={setDetailsId}
      />
      {detailsConnection ? (
        <ConnectionPrivateDetails
          connectionId={detailsConnection.id}
          connectionName={detailsConnection.name}
          initialNote={detailsConnection.privateNote}
          initialContext={detailsConnection.context}
          initialConnectedAt={detailsConnection.connectedAtIso}
          open
          onClose={() => setDetailsId(null)}
          onSaved={({ privateNote, context }) => {
            setConnections((prev) =>
              prev.map((c) =>
                c.id === detailsConnection.id
                  ? {
                      ...c,
                      privateNote,
                      context,
                      note: privateNote?.trim() || c.note,
                      metAt: context?.trim() || c.metAt,
                    }
                  : c,
              ),
            );
          }}
        />
      ) : null}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { DashboardConnectionsView } from '@/components/dashboard/dashboard-connections-view';
import type { AuthenticatedConnectionCard } from '@/lib/connections/map-owner-connection';
import type { OwnerCollection } from '@/lib/connections/collections-core';

/**
 * Browser harness for Connections management UI (mocked — no live Supabase).
 * Enabled only when CODECARD_E2E_FIXTURES=1.
 */
export function ConnectionsHarness() {
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connections, setConnections] = useState<AuthenticatedConnectionCard[]>([]);
  const [collections, setCollections] = useState<OwnerCollection[]>([]);
  const [memberships, setMemberships] = useState<Record<string, string[]>>({});
  const [mode, setMode] = useState<'profile' | 'dashboard'>('profile');
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const bobCard: AuthenticatedConnectionCard = {
    id: 'e2e-conn-1',
    name: 'Bob Smith',
    role: 'Engineer',
    company: 'Berlin',
    metAt: 'Connected',
    date: 'Jul 17, 2026',
    source: 'Manual',
    note: 'Engineer',
    followUp: 'none',
    tags: [],
    profileSlug: 'bob-smith',
    savedProfileId: '22222222-2222-4222-8222-222222222222',
    isPublicTarget: true,
    privateNote: null,
    context: null,
    connectedAtIso: '2026-07-17T00:00:00.000Z',
  };

  return (
    <main
      className="min-h-[100dvh] overflow-x-hidden bg-[var(--app-canvas)] p-4 text-[var(--app-ink)] sm:p-8"
      data-e2e-ready={ready ? 'true' : 'false'}
      data-e2e-connected={connected ? 'true' : 'false'}
      data-e2e-count={String(connections.length)}
      data-e2e-collections={String(collections.length)}
      data-e2e-memberships={String(
        Object.values(memberships).reduce((sum, ids) => sum + ids.length, 0),
      )}
      data-e2e-note={connections[0]?.privateNote ? 'true' : 'false'}
    >
      <div className="mx-auto flex max-w-[1040px] flex-col gap-6">
        <h1 className="text-[24px] font-semibold">Connections save flow fixture</h1>
        <p className="text-[14px] text-[var(--app-smoke)]">
          Mocked UI for Connections management without production accounts.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="cc-app-btn cc-app-btn--ghost !h-10"
            onClick={() => setMode('profile')}
          >
            Public profile
          </button>
          <button
            type="button"
            className="cc-app-btn cc-app-btn--ghost !h-10"
            onClick={() => setMode('dashboard')}
          >
            Connections dashboard
          </button>
        </div>

        {mode === 'profile' ? (
          <section className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-paper)] p-6">
            <h2 className="text-[20px] font-medium">Bob Smith</h2>
            <p className="mt-1 text-[15px] text-[var(--app-smoke)]">Engineer · Berlin</p>
            <div className="mt-4 flex flex-col gap-2">
              {connected ? (
                <button
                  type="button"
                  className="cc-app-btn cc-app-btn--ghost !h-10"
                  disabled={pending}
                  aria-busy={pending}
                  aria-label="Remove Bob Smith from Connections"
                  onClick={async () => {
                    if (!window.confirm('Remove Bob Smith from your Connections?')) return;
                    setPending(true);
                    await new Promise((r) => setTimeout(r, 40));
                    setConnected(false);
                    setConnections([]);
                    setMemberships({});
                    setStatus('Removed Bob Smith from your Connections.');
                    setPending(false);
                  }}
                >
                  {pending ? 'Updating…' : 'Remove connection'}
                </button>
              ) : (
                <button
                  type="button"
                  className="cc-app-btn cc-app-btn--primary !h-10"
                  disabled={pending}
                  aria-busy={pending}
                  aria-label="Add Bob Smith as a Connection"
                  onClick={async () => {
                    setPending(true);
                    await new Promise((r) => setTimeout(r, 40));
                    setConnected(true);
                    setConnections([bobCard]);
                    setStatus('Added Bob Smith to your Connections.');
                    setPending(false);
                  }}
                >
                  {pending ? 'Saving…' : 'Add connection'}
                </button>
              )}
              <p className="sr-only" role="status" aria-live="polite">
                {status ?? ''}
              </p>
              {status ? <p className="text-[13px] text-[var(--app-smoke)]">{status}</p> : null}
            </div>
          </section>
        ) : (
          <>
            <section
              className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-paper)] p-5"
              aria-labelledby="fixture-collections-heading"
            >
              <h2 id="fixture-collections-heading" className="text-[18px] font-medium">
                Collections
              </h2>
              <p className="mt-1 text-[14px] text-[var(--app-smoke)]">
                Private folders for organizing people you saved. Only you can see them.
              </p>
              {collections.length === 0 ? (
                <button
                  type="button"
                  className="cc-app-btn cc-app-btn--primary mt-4 !h-10"
                  aria-label="Create Recruiters collection"
                  onClick={() => {
                    setCollections([
                      {
                        id: 'e2e-col-recruiters',
                        name: 'Recruiters',
                        description: null,
                        createdAt: '2026-07-17T00:00:00.000Z',
                        updatedAt: '2026-07-17T00:00:00.000Z',
                        connectionCount: 0,
                      },
                    ]);
                  }}
                >
                  Create Recruiters collection
                </button>
              ) : (
                <ul className="mt-4">
                  {collections.map((c) => (
                    <li key={c.id} className="text-[15px] text-[var(--app-ink)]">
                      {c.name} · {c.connectionCount}{' '}
                      {c.connectionCount === 1 ? 'Connection' : 'Connections'}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <DashboardConnectionsView
              connections={connections}
              variant="authenticated"
              collections={collections}
              memberships={memberships}
              onToggleMembership={async (connectionId, collectionId, assigned) => {
                setMemberships((prev) => {
                  const current = prev[connectionId] ?? [];
                  return {
                    ...prev,
                    [connectionId]: assigned
                      ? current.filter((id) => id !== collectionId)
                      : [...current, collectionId],
                  };
                });
                setCollections((prev) =>
                  prev.map((c) =>
                    c.id === collectionId
                      ? {
                          ...c,
                          connectionCount: Math.max(0, c.connectionCount + (assigned ? -1 : 1)),
                        }
                      : c,
                  ),
                );
              }}
              onOpenPrivateDetails={() => {
                setNoteDraft(connections[0]?.privateNote ?? '');
                setDetailsOpen(true);
              }}
              onRemoveConnection={async (id) => {
                const confirmed = window.confirm(
                  'Remove Bob Smith from your Connections? This does not delete their CodeCard.',
                );
                if (!confirmed) throw new Error('cancelled');
                setConnections((prev) => prev.filter((c) => c.id !== id));
                setConnected(false);
                setMemberships({});
                setStatus('Removed Bob Smith from your Connections.');
              }}
            />

            {detailsOpen ? (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="fixture-note-title"
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
              >
                <div className="w-full max-w-lg rounded-[20px] border border-[var(--app-border)] bg-[var(--app-paper)] p-5">
                  <h2 id="fixture-note-title" className="text-[20px] font-medium">
                    Private details · Bob Smith
                  </h2>
                  <p className="mt-2 text-[14px] text-[var(--app-smoke)]">
                    Only you can see this information.
                  </p>
                  <label htmlFor="fixture-note" className="mt-4 mb-1 block text-[13px]">
                    Private note
                  </label>
                  <textarea
                    id="fixture-note"
                    className="cc-app-input min-h-[120px]"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="cc-app-btn cc-app-btn--primary !h-10"
                      onClick={() => {
                        setConnections((prev) =>
                          prev.map((c) => ({
                            ...c,
                            privateNote: noteDraft || null,
                            note: noteDraft || c.note,
                          })),
                        );
                        setDetailsOpen(false);
                        setStatus('Private details saved.');
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="cc-app-btn cc-app-btn--ghost !h-10"
                      onClick={() => setDetailsOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}

        <section
          className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-paper)] p-5"
          aria-labelledby="fixture-privacy-heading"
          data-e2e-privacy-panel="true"
        >
          <h2 id="fixture-privacy-heading" className="text-[18px] font-medium">
            As Bob (target)
          </h2>
          <p className="mt-1 text-[14px] text-[var(--app-smoke)]">
            Target users never see who saved them, private notes, or collection membership.
          </p>
          <ul className="mt-3 space-y-1 text-[14px] text-[var(--app-ink)]">
            <li data-e2e-privacy-saves="hidden">Who saved me: not visible</li>
            <li data-e2e-privacy-notes="hidden">Private notes about me: not visible</li>
            <li data-e2e-privacy-collections="hidden">Collections I am in: not visible</li>
          </ul>
          {connections[0]?.privateNote ? (
            <p className="sr-only" data-e2e-owner-note-exists="true">
              Owner has a private note (not shown to target).
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

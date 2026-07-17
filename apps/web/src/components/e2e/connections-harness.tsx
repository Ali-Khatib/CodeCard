'use client';

import { useEffect, useState } from 'react';
import { DashboardConnectionsView } from '@/components/dashboard/dashboard-connections-view';
import type { AuthenticatedConnectionCard } from '@/lib/connections/map-owner-connection';

/**
 * Browser harness for Connections save/remove UI (mocked — no live Supabase).
 * Enabled only when CODECARD_E2E_FIXTURES=1.
 */
export function ConnectionsHarness() {
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connections, setConnections] = useState<AuthenticatedConnectionCard[]>([]);
  const [mode, setMode] = useState<'profile' | 'dashboard'>('profile');
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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
  };

  return (
    <main
      className="min-h-[100dvh] overflow-x-hidden bg-[var(--app-canvas)] p-4 text-[var(--app-ink)] sm:p-8"
      data-e2e-ready={ready ? 'true' : 'false'}
      data-e2e-connected={connected ? 'true' : 'false'}
      data-e2e-count={String(connections.length)}
    >
      <div className="mx-auto flex max-w-[1040px] flex-col gap-6">
        <h1 className="text-[24px] font-semibold">Connections save flow fixture</h1>
        <p className="text-[14px] text-[var(--app-smoke)]">
          Mocked UI for add/remove Connection without production accounts.
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
              {connected && !status ? (
                <p className="text-[13px] text-[var(--app-smoke)]">Connected</p>
              ) : null}
            </div>
          </section>
        ) : (
          <DashboardConnectionsView
            connections={connections}
            variant="authenticated"
            onRemoveConnection={async (id) => {
              const confirmed = window.confirm(
                'Remove Bob Smith from your Connections? This does not delete their CodeCard.',
              );
              if (!confirmed) throw new Error('cancelled');
              setConnections((prev) => prev.filter((c) => c.id !== id));
              setConnected(false);
              setStatus('Removed Bob Smith from your Connections.');
            }}
          />
        )}
      </div>
    </main>
  );
}

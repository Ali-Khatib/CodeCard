'use client';

import { useEffect, useState } from 'react';
import { AuthenticatedCircleView } from '@/components/dashboard/authenticated-circle-view';
import type { CircleFeedItem, CircleFeedState } from '@/lib/circle/circle-activity-contract';

/**
 * Mocked Circle UI harness (no live Supabase / production accounts).
 * Enabled only when CODECARD_E2E_FIXTURES=1.
 */
export function CircleHarness() {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'empty' | 'no_activity' | 'feed'>('empty');

  useEffect(() => {
    setReady(true);
  }, []);

  const sampleItem: CircleFeedItem = {
    eventId: 'e2e-event-1',
    eventType: 'project_published',
    createdAt: '2026-07-17T12:00:00.000Z',
    actor: {
      profileId: '22222222-2222-4222-8222-222222222222',
      slug: 'bob-smith',
      displayName: 'Bob Smith',
      headline: 'Engineer',
      avatarPublicUrl: null,
    },
    target: {
      targetType: 'project',
      targetId: '33333333-3333-4333-8333-333333333333',
      title: 'PipelineX',
      summary: 'Deploy previews that never block the main branch',
      publicPathKey: '33333333-3333-4333-8333-333333333333',
      previewImageUrl: null,
      technologies: ['TypeScript'],
    },
    activitySentence: 'Bob Smith published a new project',
  };

  const researchItem: CircleFeedItem = {
    ...sampleItem,
    eventId: 'e2e-event-2',
    eventType: 'research_published',
    createdAt: '2026-07-17T13:00:00.000Z',
    target: {
      targetType: 'research',
      targetId: '44444444-4444-4444-8444-444444444444',
      title: 'Graph Limits',
      summary: 'A short abstract about graphs.',
      publicPathKey: 'graph-limits',
      previewImageUrl: null,
      authors: ['Bob Smith'],
      venue: 'NeurIPS',
    },
    activitySentence: 'Bob Smith published a research paper',
  };

  let feed: CircleFeedState;
  if (mode === 'empty') {
    feed = { status: 'no_connections' };
  } else if (mode === 'no_activity') {
    feed = { status: 'no_activity', connectionCount: 1 };
  } else {
    feed = {
      status: 'feed',
      connectionCount: 1,
      items: [researchItem, sampleItem],
      nextCursor: null,
    };
  }

  return (
    <main
      className="min-h-[100dvh] overflow-x-hidden bg-[var(--app-canvas)] p-4 text-[var(--app-ink)] sm:p-8"
      data-e2e-ready={ready ? 'true' : 'false'}
      data-e2e-circle-mode={mode}
    >
      <div className="mx-auto flex max-w-[1040px] flex-col gap-4">
        <h1 className="text-[24px] font-semibold">Circle feed fixture</h1>
        <p className="text-[14px] text-[var(--app-smoke)]">
          Mocked authenticated Circle states without production accounts.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="cc-app-btn cc-app-btn--ghost !h-10"
            onClick={() => setMode('empty')}
          >
            No connections state
          </button>
          <button
            type="button"
            className="cc-app-btn cc-app-btn--ghost !h-10"
            onClick={() => setMode('no_activity')}
          >
            No activity state
          </button>
          <button
            type="button"
            className="cc-app-btn cc-app-btn--primary !h-10"
            onClick={() => setMode('feed')}
          >
            Populated feed
          </button>
        </div>
        <AuthenticatedCircleView feed={feed} />
      </div>
    </main>
  );
}

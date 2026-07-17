'use client';

import { useEffect, useMemo, useState } from 'react';
import { AuthenticatedCircleView } from '@/components/dashboard/authenticated-circle-view';
import type {
  CircleFeedCursor,
  CircleFeedFilter,
  CircleFeedItem,
  CircleFeedState,
} from '@/lib/circle/circle-activity-contract';

/**
 * Mocked Circle UI harness (no live Supabase / production accounts).
 * Enabled only when CODECARD_E2E_FIXTURES=1.
 */
export function CircleHarness() {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<
    'empty' | 'no_activity' | 'feed' | 'filtered_empty' | 'paginated'
  >('empty');
  const [seenCalls, setSeenCalls] = useState(0);

  useEffect(() => {
    setReady(true);
  }, []);

  const projectItem: CircleFeedItem = {
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
    ...projectItem,
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

  const updateItem: CircleFeedItem = {
    ...projectItem,
    eventId: 'e2e-event-3',
    eventType: 'project_updated',
    createdAt: '2026-07-17T14:00:00.000Z',
    activitySentence: 'Bob Smith updated a project',
  };

  const olderProject: CircleFeedItem = {
    ...projectItem,
    eventId: 'e2e-event-4',
    eventType: 'project_published',
    createdAt: '2026-07-10T12:00:00.000Z',
    target: {
      ...projectItem.target,
      targetId: '55555555-5555-4555-8555-555555555555',
      title: 'Older Pipeline',
      publicPathKey: '55555555-5555-4555-8555-555555555555',
    },
    activitySentence: 'Bob Smith published a new project',
  };

  const allItems = [updateItem, researchItem, projectItem, olderProject];

  function filterItems(filter: CircleFeedFilter): CircleFeedItem[] {
    switch (filter) {
      case 'projects':
        return allItems.filter((i) => i.target.targetType === 'project');
      case 'research':
        return allItems.filter((i) => i.target.targetType === 'research');
      case 'updates':
        return allItems.filter(
          (i) => i.eventType === 'project_updated' || i.eventType === 'research_updated',
        );
      default:
        return allItems;
    }
  }

  const page1Cursor: CircleFeedCursor = {
    createdAt: researchItem.createdAt,
    id: researchItem.eventId,
    filter: 'all',
  };

  const initialFeed: CircleFeedState = useMemo(() => {
    if (mode === 'empty') return { status: 'no_connections' };
    if (mode === 'no_activity') return { status: 'no_activity', connectionCount: 1 };
    if (mode === 'filtered_empty') {
      return { status: 'filtered_empty', connectionCount: 1, filter: 'updates' };
    }
    if (mode === 'paginated') {
      return {
        status: 'feed',
        connectionCount: 1,
        filter: 'all',
        items: [researchItem, projectItem],
        nextCursor: page1Cursor,
      };
    }
    return {
      status: 'feed',
      connectionCount: 1,
      filter: 'all',
      items: [researchItem, projectItem],
      nextCursor: null,
    };
  }, [mode]);

  const feedLoader = async (input: {
    filter: CircleFeedFilter;
    cursor: CircleFeedCursor | null;
  }): Promise<CircleFeedState> => {
    const filtered = filterItems(input.filter);
    if (filtered.length === 0) {
      return { status: 'filtered_empty', connectionCount: 1, filter: input.filter };
    }
    if (input.cursor) {
      const start = filtered.findIndex((i) => i.eventId === input.cursor?.id);
      const slice = filtered.slice(start >= 0 ? start + 1 : 0);
      return {
        status: 'feed',
        connectionCount: 1,
        filter: input.filter,
        items: slice,
        nextCursor: null,
      };
    }
    const page = filtered.slice(0, 2);
    const hasMore = filtered.length > 2;
    return {
      status: 'feed',
      connectionCount: 1,
      filter: input.filter,
      items: page,
      nextCursor: hasMore
        ? { createdAt: page[page.length - 1]!.createdAt, id: page[page.length - 1]!.eventId, filter: input.filter }
        : null,
    };
  };

  return (
    <main
      className="min-h-[100dvh] overflow-x-hidden bg-[var(--app-canvas)] p-4 text-[var(--app-ink)] sm:p-8"
      data-e2e-ready={ready ? 'true' : 'false'}
      data-e2e-circle-mode={mode}
      data-e2e-circle-seen-calls={String(seenCalls)}
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
          <button
            type="button"
            className="cc-app-btn cc-app-btn--ghost !h-10"
            onClick={() => setMode('filtered_empty')}
          >
            Filtered empty
          </button>
          <button
            type="button"
            className="cc-app-btn cc-app-btn--ghost !h-10"
            onClick={() => setMode('paginated')}
          >
            Paginated feed
          </button>
        </div>
        <AuthenticatedCircleView
          key={mode}
          initialFeed={initialFeed}
          initialLastSeenAt="2026-07-17T11:00:00.000Z"
          feedLoader={feedLoader}
          markSeen={async () => {
            setSeenCalls((n) => n + 1);
            return { ok: true };
          }}
        />
      </div>
    </main>
  );
}

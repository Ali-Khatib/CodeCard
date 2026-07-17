'use client';

import { useEffectEvent, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CIRCLE_FEED_FILTERS,
  CIRCLE_FEED_FILTER_LABELS,
  type CircleFeedCursor,
  type CircleFeedFilter,
  type CircleFeedItem,
  type CircleFeedState,
} from '@/lib/circle/circle-activity-contract';
import { listCircleFeedAction } from '@/app/actions/circle';
import { DashFilterBar } from '@/components/dashboard/dash-filter-bar';
import { FadeInView } from '@/components/dashboard/fade-in-view';
import { AppButton, AppCard, AppMono, PageHeader } from '@/components/dashboard/ui/dashboard-ui';

function formatActivityTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

function targetHref(item: CircleFeedItem): string {
  if (item.target.targetType === 'project') {
    return `/${item.actor.slug}/projects/${item.target.publicPathKey}`;
  }
  return `/${item.actor.slug}/research/${item.target.publicPathKey}`;
}

function targetTypeLabel(item: CircleFeedItem): string {
  return item.target.targetType === 'project' ? 'Project' : 'Research';
}

function CircleEmptyNoConnections() {
  return (
    <section
      className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-paper)] px-6 py-10 text-center"
      aria-labelledby="circle-empty-connections-title"
    >
      <h2
        id="circle-empty-connections-title"
        className="text-[22px] font-medium tracking-[-0.02em] text-[var(--app-ink)]"
      >
        Your Circle starts with your Connections
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-[15px] text-[var(--app-smoke)]">
        Add people whose work you care about to see their latest projects and research here.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <AppButton variant="primary" href="/profiles">
          Find people to add
        </AppButton>
        <AppButton variant="ghost" href="/dashboard/connections">
          Open Connections
        </AppButton>
      </div>
    </section>
  );
}

function CircleEmptyNoActivity() {
  return (
    <section
      className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-paper)] px-6 py-10 text-center"
      aria-labelledby="circle-empty-activity-title"
    >
      <h2
        id="circle-empty-activity-title"
        className="text-[22px] font-medium tracking-[-0.02em] text-[var(--app-ink)]"
      >
        Nothing new yet
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-[15px] text-[var(--app-smoke)]">
        New projects and research from your Connections will appear here when they publish.
      </p>
      <div className="mt-6">
        <AppButton variant="ghost" href="/dashboard/connections">
          Manage Connections
        </AppButton>
      </div>
    </section>
  );
}

function CircleFilteredEmpty({ onReset }: { onReset: () => void }) {
  return (
    <section
      className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-paper)] px-6 py-10 text-center"
      aria-labelledby="circle-filtered-empty-title"
    >
      <h2
        id="circle-filtered-empty-title"
        className="text-[22px] font-medium tracking-[-0.02em] text-[var(--app-ink)]"
      >
        No Circle updates match this filter.
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-[15px] text-[var(--app-smoke)]">
        Try another work type, or view all activity from your Connections.
      </p>
      <div className="mt-6">
        <AppButton variant="primary" onClick={onReset}>
          View all activity
        </AppButton>
      </div>
    </section>
  );
}

function CircleActivityCard({ item, index }: { item: CircleFeedItem; index: number }) {
  const href = targetHref(item);
  const profileHref = `/${item.actor.slug}`;
  const ctaLabel =
    item.target.targetType === 'research'
      ? `Read paper: ${item.target.title}`
      : `View project: ${item.target.title}`;

  return (
    <li>
      <FadeInView delay={Math.min(0.06 + index * 0.04, 0.3)}>
        <AppCard className="overflow-hidden !p-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-[var(--app-border)] px-5 py-4">
            <Link
              href={profileHref}
              className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--app-border)] bg-[var(--app-bone)]"
              aria-label={`${item.actor.displayName}'s CodeCard`}
            >
              {item.actor.avatarPublicUrl ? (
                <Image
                  src={item.actor.avatarPublicUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center text-sm font-medium"
                  aria-hidden
                >
                  {item.actor.displayName[0] ?? '?'}
                </span>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-[var(--app-ink)]">
                <Link href={profileHref} className="hover:underline">
                  {item.actor.displayName}
                </Link>
              </p>
              <p className="text-[13px] text-[var(--app-smoke)]">{item.activitySentence}</p>
            </div>
            <time
              className="text-[13px] text-[var(--app-smoke)]"
              dateTime={item.createdAt}
              title={item.createdAt}
            >
              {formatActivityTimestamp(item.createdAt)}
            </time>
          </div>

          <div className="grid md:grid-cols-[minmax(200px,320px)_1fr]">
            <div className="relative min-h-[160px] bg-[var(--app-bone)]">
              {item.target.previewImageUrl ? (
                <Image
                  src={item.target.previewImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 320px"
                />
              ) : null}
            </div>

            <div className="flex flex-col justify-between gap-4 p-5 sm:p-6">
              <div className="min-w-0">
                <AppMono>{targetTypeLabel(item)}</AppMono>
                <h3 className="mt-2 break-words text-[22px] font-medium tracking-[-0.025em] text-[var(--app-ink)] sm:text-[24px]">
                  <Link href={href} className="hover:underline">
                    {item.target.title}
                  </Link>
                </h3>
                {item.target.summary ? (
                  <p className="mt-2 line-clamp-3 max-w-lg text-[15px] text-[var(--app-smoke)]">
                    {item.target.summary}
                  </p>
                ) : null}
                {item.target.technologies && item.target.technologies.length > 0 ? (
                  <p className="mt-2 text-[13px] text-[var(--app-smoke)]">
                    {item.target.technologies.slice(0, 6).join(' · ')}
                  </p>
                ) : null}
                {item.target.authors && item.target.authors.length > 0 ? (
                  <p className="mt-2 text-[13px] text-[var(--app-smoke)]">
                    {item.target.authors.slice(0, 4).join(', ')}
                    {item.target.venue ? ` · ${item.target.venue}` : ''}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <AppButton variant="primary" href={href} ariaLabel={ctaLabel}>
                  {item.target.targetType === 'research' ? 'Read paper' : 'View project'}
                </AppButton>
                <AppButton
                  variant="ghost"
                  href={profileHref}
                  ariaLabel={`Open ${item.actor.displayName}'s CodeCard`}
                >
                  Their CodeCard
                </AppButton>
              </div>
            </div>
          </div>
        </AppCard>
      </FadeInView>
    </li>
  );
}

const FILTER_OPTIONS = CIRCLE_FEED_FILTERS.map((id) => CIRCLE_FEED_FILTER_LABELS[id]);

function labelToFilter(label: string): CircleFeedFilter {
  const entry = (Object.entries(CIRCLE_FEED_FILTER_LABELS) as Array<[CircleFeedFilter, string]>).find(
    ([, value]) => value === label,
  );
  return entry?.[0] ?? 'all';
}

export function AuthenticatedCircleView({ initialFeed }: { initialFeed: CircleFeedState }) {
  const [filter, setFilter] = useState<CircleFeedFilter>(
    initialFeed.status === 'feed' || initialFeed.status === 'filtered_empty'
      ? initialFeed.filter
      : 'all',
  );
  const [items, setItems] = useState<CircleFeedItem[]>(
    initialFeed.status === 'feed' ? initialFeed.items : [],
  );
  const [nextCursor, setNextCursor] = useState<CircleFeedCursor | null>(
    initialFeed.status === 'feed' ? initialFeed.nextCursor : null,
  );
  const [connectionCount, setConnectionCount] = useState(
    initialFeed.status === 'feed' ||
      initialFeed.status === 'no_activity' ||
      initialFeed.status === 'filtered_empty'
      ? initialFeed.connectionCount
      : 0,
  );
  const [pageStatus, setPageStatus] = useState<
    'ready' | 'filtered_empty' | 'no_activity' | 'no_connections' | 'error'
  >(
    initialFeed.status === 'no_connections'
      ? 'no_connections'
      : initialFeed.status === 'no_activity'
        ? 'no_activity'
        : initialFeed.status === 'filtered_empty'
          ? 'filtered_empty'
          : initialFeed.status === 'temporary_failure' || initialFeed.status === 'invalid_cursor'
            ? 'error'
            : 'ready',
  );
  const [errorMessage, setErrorMessage] = useState(
    initialFeed.status === 'temporary_failure' || initialFeed.status === 'invalid_cursor'
      ? initialFeed.error
      : null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const applyFeedResult = useEffectEvent((result: CircleFeedState, mode: 'replace' | 'append') => {
    if (result.status === 'unauthenticated') {
      setPageStatus('error');
      setErrorMessage('Sign in to view your Circle.');
      return;
    }
    if (result.status === 'temporary_failure' || result.status === 'invalid_cursor') {
      if (mode === 'append') {
        setLoadError(result.error);
        return;
      }
      setPageStatus('error');
      setErrorMessage(result.error);
      return;
    }
    if (result.status === 'no_connections') {
      setPageStatus('no_connections');
      setItems([]);
      setNextCursor(null);
      setConnectionCount(0);
      setLoadError(null);
      return;
    }
    if (result.status === 'no_activity') {
      setPageStatus('no_activity');
      setItems([]);
      setNextCursor(null);
      setConnectionCount(result.connectionCount);
      setLoadError(null);
      return;
    }
    if (result.status === 'filtered_empty') {
      setPageStatus('filtered_empty');
      setItems([]);
      setNextCursor(null);
      setConnectionCount(result.connectionCount);
      setLoadError(null);
      return;
    }

    setPageStatus('ready');
    setConnectionCount(result.connectionCount);
    setNextCursor(result.nextCursor);
    setLoadError(null);
    setErrorMessage(null);
    setItems((prev) => {
      if (mode === 'replace') return result.items;
      const seen = new Set(prev.map((item) => item.eventId));
      const merged = [...prev];
      for (const item of result.items) {
        if (!seen.has(item.eventId)) merged.push(item);
      }
      return merged;
    });
  });

  const loadPage = (nextFilter: CircleFeedFilter, cursor: CircleFeedCursor | null, mode: 'replace' | 'append') => {
    startTransition(async () => {
      const result = await listCircleFeedAction({
        filter: nextFilter,
        cursor,
      });
      applyFeedResult(result, mode);
    });
  };

  const onFilterChange = (label: string) => {
    const next = labelToFilter(label);
    if (next === filter && !pending) return;
    setFilter(next);
    setLoadError(null);
    loadPage(next, null, 'replace');
  };

  const onLoadMore = () => {
    if (!nextCursor || pending) return;
    setLoadError(null);
    loadPage(filter, nextCursor, 'append');
  };

  const showFilters = pageStatus !== 'no_connections';

  return (
    <div className="cc-app-page cc-app-page--1040 overflow-x-hidden">
      <PageHeader
        title="Circle"
        description="Public projects and research from people you’ve saved as Connections."
      />

      {showFilters ? (
        <div className="mb-6">
          <DashFilterBar
            options={FILTER_OPTIONS}
            value={CIRCLE_FEED_FILTER_LABELS[filter]}
            onChange={onFilterChange}
          />
          <p className="sr-only" aria-live="polite">
            Filter: {CIRCLE_FEED_FILTER_LABELS[filter]}
          </p>
        </div>
      ) : null}

      {pageStatus === 'error' ? (
        <section className="space-y-4" aria-live="polite">
          <p className="text-[14px] text-[var(--app-smoke)]" role="alert">
            {errorMessage ?? 'Could not load Circle right now. Please try again.'}
          </p>
          <AppButton
            variant="primary"
            onClick={() => loadPage(filter, null, 'replace')}
            ariaLabel="Retry loading Circle"
          >
            Retry
          </AppButton>
        </section>
      ) : null}

      {pageStatus === 'no_connections' ? <CircleEmptyNoConnections /> : null}
      {pageStatus === 'no_activity' ? <CircleEmptyNoActivity /> : null}
      {pageStatus === 'filtered_empty' ? (
        <CircleFilteredEmpty onReset={() => onFilterChange(CIRCLE_FEED_FILTER_LABELS.all)} />
      ) : null}

      {pageStatus === 'ready' ? (
        <>
          {items.length === 0 && nextCursor ? (
            <div className="mb-4">
              <AppButton variant="primary" onClick={onLoadMore} ariaLabel="Load more Circle activity">
                {pending ? 'Loading…' : 'Load more'}
              </AppButton>
            </div>
          ) : null}
          <ul className="space-y-4" aria-label="Circle activity">
            {items.map((item, index) => (
              <CircleActivityCard key={item.eventId} item={item} index={index} />
            ))}
          </ul>
          {nextCursor ? (
            <div className="mt-6 flex flex-col items-start gap-3">
              {loadError ? (
                <p className="text-[14px] text-[var(--app-smoke)]" role="alert">
                  {loadError}
                </p>
              ) : null}
              <AppButton
                variant="primary"
                onClick={onLoadMore}
                ariaLabel="Load more Circle activity"
              >
                {pending ? 'Loading…' : 'Load more'}
              </AppButton>
              <p className="sr-only" aria-live="polite">
                {pending ? 'Loading more Circle activity' : ''}
              </p>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

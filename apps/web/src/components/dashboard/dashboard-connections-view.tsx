'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import Image from 'next/image';
import { LayoutGrid, Rows3 } from 'lucide-react';
import type { WorkspaceConnection } from '@/lib/dashboard/workspace-demo';
import { getUpcomingFollowUps } from '@/lib/dashboard/connections-summary';
import {
  connectionMeetingPointValue,
  filterAndSortConnections,
  uniqueConnectionLocations,
  uniqueConnectionMeetingPoints,
  type ConnectionsCollectionFilter,
  type ConnectionsLocationFilter,
  type ConnectionsMeetingPointFilter,
  type ConnectionsSortId,
} from '@/lib/connections/connections-filter';
import { EMPTY_STATE_COPY } from '@/lib/dashboard/empty-state-copy';
import { getPublicProfileLinkForClipboard } from '@/lib/sharing/qr';
import { moveIndex, weaveVisibleOrder } from '@/lib/connections/connections-order-core';
import DraggableWidgetGrid, { type WidgetItem } from '@/components/ui/draggable-widget-grid';
import { FadeInView } from './fade-in-view';
import { ReactiveBorder } from './reactive-border';
import { AsyncActionButton } from '@/components/ui/async-action-button';
import { AppButton, AppCard, PageHeader, SectionLabel } from './ui/dashboard-ui';

const CONNECTION_VIEW_MODES = [
  { id: 'list' as const, label: 'List view', icon: Rows3 },
  { id: 'grid' as const, label: 'Grid view', icon: LayoutGrid },
];
type ConnectionsViewMode = 'list' | 'grid';

type ViewConnection = WorkspaceConnection & {
  profileSlug?: string;
  isPublicTarget?: boolean;
  context?: string | null;
  privateNote?: string | null;
  connectedAtIso?: string | null;
};

function displayMeetingPoint(connection: ViewConnection): string {
  return connectionMeetingPointValue(connection) || 'Unassigned';
}

/** Nearest scrollable ancestor, or the window. */
function getScrollParent(el: HTMLElement | null): HTMLElement | Window {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return window;
}

function scrollByDelta(scroller: HTMLElement | Window, delta: number) {
  if (Math.abs(delta) < 0.5) return;
  if (scroller === window) {
    window.scrollBy({ top: delta, left: 0, behavior: 'instant' });
    return;
  }
  (scroller as HTMLElement).scrollTop += delta;
}

const SORT_OPTIONS: Array<{ id: ConnectionsSortId; label: string }> = [
  { id: 'custom', label: 'Your order' },
  { id: 'newest', label: 'Newest connected' },
  { id: 'oldest', label: 'Oldest connected' },
  { id: 'name_asc', label: 'Name A–Z' },
  { id: 'name_desc', label: 'Name Z–A' },
];

function connectionCodeCardHref(
  connection: ViewConnection,
  variant: 'demo' | 'authenticated',
): string | null {
  if (variant === 'authenticated') {
    return connection.profileSlug && connection.isPublicTarget !== false
      ? `/${connection.profileSlug}`
      : null;
  }
  return '/demo/card';
}

function ConnectionOpenCodeCardButton({
  href,
  name,
}: {
  href: string;
  name: string;
}) {
  return (
    <span
      className="cc-connection-blob__open"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <AppButton variant="primary" href={href} ariaLabel={`Open ${name}'s CodeCard`}>
        Open CodeCard
      </AppButton>
    </span>
  );
}

function ConnectionDragHandle({
  name,
  onDragStart,
  onMove,
}: {
  name: string;
  onDragStart: () => void;
  onMove: (direction: 'up' | 'down') => void;
}) {
  return (
    <button
      type="button"
      className="cc-connection-drag min-h-11 min-w-11"
      draggable
      aria-label={`Reorder ${name}`}
      title="Drag to reorder"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          onMove('up');
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          onMove('down');
        }
      }}
      onDragStart={(event) => {
        event.stopPropagation();
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', name);
        onDragStart();
      }}
    >
      <span aria-hidden>⋮⋮</span>
    </button>
  );
}

function ConnectionExpandedBody({
  connection,
  variant,
  onRemove,
  collections = [],
  membershipIds = [],
  onToggleMembership,
  onOpenPrivateDetails,
}: {
  connection: ViewConnection;
  variant: 'demo' | 'authenticated';
  onRemove?: (connectionId: string) => void | Promise<void>;
  collections?: Array<{ id: string; name: string }>;
  membershipIds?: string[];
  onToggleMembership?: (
    connectionId: string,
    collectionId: string,
    currentlyAssigned: boolean,
  ) => void | Promise<void>;
  onOpenPrivateDetails?: (connectionId: string) => void;
}) {
  if (variant === 'authenticated') {
    const href = connectionCodeCardHref(connection, 'authenticated');

    return (
      <div className="cc-connection-expand__grid">
        <dl className="cc-connection-meta">
          <div className="cc-connection-meta__item">
            <dt className="cc-connection-meta__label">Meeting point</dt>
            <dd className="cc-connection-meta__value">{displayMeetingPoint(connection)}</dd>
          </div>
          <div className="cc-connection-meta__item">
            <dt className="cc-connection-meta__label">Connected</dt>
            <dd className="cc-connection-meta__value">{connection.date}</dd>
          </div>
          {connection.country || connection.company ? (
            <div className="cc-connection-meta__item">
              <dt className="cc-connection-meta__label">Country / location</dt>
              <dd className="cc-connection-meta__value">
                {connection.country || connection.company}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="cc-connection-notes">
          <p className="cc-connection-notes__text">{connection.note}</p>
          {collections.length > 0 ? (
            <fieldset className="mt-4 space-y-2">
              <legend className="text-[13px] font-medium text-[var(--app-ink)]">
                Add to collection
              </legend>
              <p className="text-[14px] text-[var(--app-muted)]">Only you can see these folders.</p>
              <ul className="space-y-1.5">
                {collections.map((collection) => {
                  const assigned = membershipIds.includes(collection.id);
                  return (
                    <li key={collection.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-[14px] text-[var(--app-ink)]">
                        <input
                          type="checkbox"
                          checked={assigned}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            void onToggleMembership?.(connection.id, collection.id, assigned);
                          }}
                          aria-label={
                            assigned
                              ? `Remove ${connection.name} from ${collection.name}`
                              : `Add ${connection.name} to ${collection.name}`
                          }
                        />
                        <span>{collection.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ) : (
            <p className="mt-3 text-[13px] text-[var(--app-smoke)]">
              Create a collection above to organize this Connection.
            </p>
          )}
        </div>

        <div className="cc-connection-actions">
          {href ? (
            <AppButton variant="primary" href={href}>
              Open CodeCard
            </AppButton>
          ) : (
            <span className="cc-app-btn cc-app-btn--ghost opacity-60" aria-disabled="true">
              CodeCard unavailable
            </span>
          )}
          {onRemove ? (
            <AsyncActionButton
              variant="ghost"
              successLabel="Removed"
              ariaLabel={`Remove ${connection.name} from Connections`}
              onAction={async () => {
                await onRemove(connection.id);
              }}
            >
              Remove connection
            </AsyncActionButton>
          ) : null}
          {onOpenPrivateDetails ? (
            <AppButton
              variant="ghost"
              onClick={() => onOpenPrivateDetails(connection.id)}
              ariaLabel={`Edit private note for ${connection.name}`}
            >
              Private note
            </AppButton>
          ) : null}
        </div>
      </div>
    );
  }

  const followUp = `${connection.followUp.charAt(0).toUpperCase()}${connection.followUp.slice(1)}${
    connection.followUpDate ? ` · ${connection.followUpDate}` : ''
  }`;

  const metaItems = [
    { label: 'Meeting point', value: displayMeetingPoint(connection) },
    { label: 'Date', value: connection.date },
    ...(connection.country || connection.company
      ? [{ label: 'Country / location', value: connection.country || connection.company }]
      : []),
    { label: 'Follow-up', value: followUp },
    ...(connection.lastViewed ? [{ label: 'Last viewed', value: connection.lastViewed }] : []),
  ];

  return (
    <div className="cc-connection-expand__grid">
      <dl className="cc-connection-meta">
        {metaItems.map(({ label, value }) => (
          <div key={label} className="cc-connection-meta__item">
            <dt className="cc-connection-meta__label">{label}</dt>
            <dd className="cc-connection-meta__value">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="cc-connection-notes">
        <p className="cc-connection-notes__text">{connection.note}</p>
        {connection.tags.length > 0 && (
          <div className="cc-connection-tags">
            {connection.tags.map((t) => (
              <span key={t} className="cc-app-badge cc-app-badge--mint cc-connection-tag">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="cc-connection-actions">
        <AppButton variant="primary" href="/demo/card">
          Open CodeCard
        </AppButton>
      </div>
    </div>
  );
}

function ConnectionsFollowUps({
  followUps,
  onSelect,
}: {
  followUps: WorkspaceConnection[];
  onSelect: (event: MouseEvent<HTMLButtonElement>, id: string) => void;
}) {
  if (followUps.length === 0) return null;

  return (
    <AppCard tone="meringue" className="cc-connection-followups !p-6 md:!p-8">
      <div className="cc-connection-followups__head">
        <div>
          <SectionLabel>Upcoming follow-ups</SectionLabel>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--app-smoke)]">
            {followUps.length} scheduled — don&apos;t let warm intros go cold.
          </p>
        </div>
        <span className="cc-connection-followups__count">{followUps.length} due</span>
      </div>

      <ul className="cc-connection-followups__grid">
        {followUps.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="cc-connection-followup-card"
              onClick={(event) => onSelect(event, c.id)}
            >
              <div className="cc-connection-followup-card__avatar">
                {c.avatarUrl ? (
                  <Image src={c.avatarUrl} alt="" fill className="object-cover" sizes="48px" />
                ) : (
                  <span>{c.name[0]}</span>
                )}
              </div>

              <div className="cc-connection-followup-card__body">
                <div className="cc-connection-followup-card__top">
                  <div className="min-w-0">
                    <p className="cc-connection-followup-card__name">{c.name}</p>
                    <p className="cc-connection-followup-card__role">
                      {c.role} · {c.company}
                    </p>
                  </div>
                  <time className="cc-connection-followup-card__date">{c.followUpDate}</time>
                </div>
                <p className="cc-connection-followup-card__note">{c.note}</p>
                <span className="cc-connection-followup-card__cta">Open connection →</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </AppCard>
  );
}

function ConnectionCard({
  connection,
  expanded,
  onToggle,
  variant,
  onRemove,
  collections,
  membershipIds,
  onToggleMembership,
  onOpenPrivateDetails,
  dragHandle,
}: {
  connection: ViewConnection;
  expanded: boolean;
  onToggle: (event: MouseEvent<HTMLButtonElement>) => void;
  variant: 'demo' | 'authenticated';
  onRemove?: (connectionId: string) => void | Promise<void>;
  collections?: Array<{ id: string; name: string }>;
  membershipIds?: string[];
  onToggleMembership?: (
    connectionId: string,
    collectionId: string,
    currentlyAssigned: boolean,
  ) => void | Promise<void>;
  onOpenPrivateDetails?: (connectionId: string) => void;
  dragHandle?: ReactNode;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    setPanelHeight(expanded ? el.scrollHeight : 0);
  }, [expanded, connection.id]);

  return (
    <ReactiveBorder
      as="article"
      id={`connection-${connection.id}`}
      data-connection-id={connection.id}
      className={`cc-connection-blob${expanded ? ' cc-connection-blob--open' : ''}`}
      liftOnHover={!expanded}
      pressOnTap={false}
    >
      <div className="cc-connection-blob__row">
        {dragHandle}
        <button
        type="button"
        onMouseDown={(event) => {
          // Keep the click, skip focus — focus scroll is what yanks the page upward.
          event.preventDefault();
        }}
        onClick={onToggle}
        aria-expanded={expanded}
        className="cc-connection-blob__trigger"
      >
        <div className="cc-connection-blob__avatar">
          {connection.avatarUrl ? (
            <Image src={connection.avatarUrl} alt="" fill className="object-cover" sizes="40px" />
          ) : (
            <span className="cc-connection-blob__avatar-fallback">{connection.name[0]}</span>
          )}
        </div>
        <div className="cc-connection-blob__identity">
          <div className="cc-connection-blob__name-row">
            <p className="cc-connection-blob__name">{connection.name}</p>
          </div>
          <p className="cc-connection-blob__role">
            {connection.role}
            {connection.company ? ` · ${connection.company}` : ''}
          </p>
          {!expanded && (
            <p className="cc-connection-blob__preview">{connection.note}</p>
          )}
        </div>
        <div className="cc-connection-blob__summary">
          {!expanded && (
            <p className="cc-connection-blob__summary-label">{displayMeetingPoint(connection)}</p>
          )}
          <p className="cc-connection-blob__summary-value">{connection.date}</p>
        </div>
      </button>
      </div>
      {connectionCodeCardHref(connection, variant) ? (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
          <ConnectionOpenCodeCardButton
            href={connectionCodeCardHref(connection, variant)!}
            name={connection.name}
          />
        </div>
      ) : null}

      <div
        className="cc-connection-blob__expand-slot"
        style={{ height: panelHeight }}
        aria-hidden={!expanded}
      >
        <div ref={bodyRef} className="cc-connection-expand__body">
          <ConnectionExpandedBody
            connection={connection}
            variant={variant}
            onRemove={onRemove}
            collections={collections}
            membershipIds={membershipIds}
            onToggleMembership={onToggleMembership}
            onOpenPrivateDetails={onOpenPrivateDetails}
          />
        </div>
      </div>
    </ReactiveBorder>
  );
}

function ConnectionGridCard({
  connection,
  expanded,
  onToggle,
  variant,
  onRemove,
  collections,
  membershipIds,
  onToggleMembership,
  onOpenPrivateDetails,
  dragHandle,
}: {
  connection: ViewConnection;
  expanded: boolean;
  onToggle: (event: MouseEvent<HTMLElement>) => void;
  variant: 'demo' | 'authenticated';
  onRemove?: (connectionId: string) => void | Promise<void>;
  collections?: Array<{ id: string; name: string }>;
  membershipIds?: string[];
  onToggleMembership?: (
    connectionId: string,
    collectionId: string,
    currentlyAssigned: boolean,
  ) => void | Promise<void>;
  onOpenPrivateDetails?: (connectionId: string) => void;
  dragHandle?: ReactNode;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    setPanelHeight(expanded ? el.scrollHeight : 0);
  }, [expanded, connection.id]);

  return (
    <ReactiveBorder
      as="article"
      id={`connection-${connection.id}`}
      data-connection-id={connection.id}
      className={`cc-connection-grid-card${expanded ? ' cc-connection-grid-card--open' : ''} h-full`}
      liftOnHover={!expanded}
      pressOnTap={false}
    >
      {dragHandle}
      <div
        role="button"
        tabIndex={0}
        onClick={(event) => onToggle(event)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle(event as unknown as MouseEvent<HTMLElement>);
          }
        }}
        aria-expanded={expanded}
        className="cc-connection-grid-card__trigger"
      >
        <div className="cc-connection-grid-card__avatar">
          {connection.avatarUrl ? (
            <Image src={connection.avatarUrl} alt="" fill className="object-cover" sizes="72px" />
          ) : (
            <span className="cc-connection-grid-card__avatar-fallback">{connection.name[0]}</span>
          )}
        </div>
        <p className="cc-connection-grid-card__name">{connection.name}</p>
        <p className="cc-connection-grid-card__role">{connection.role}</p>
      </div>
      {connectionCodeCardHref(connection, variant) ? (
        <div className="flex justify-center px-4 pb-4">
          <ConnectionOpenCodeCardButton
            href={connectionCodeCardHref(connection, variant)!}
            name={connection.name}
          />
        </div>
      ) : null}

      <div
        className="cc-connection-grid-card__expand-slot"
        style={{ height: panelHeight }}
        aria-hidden={!expanded}
      >
        <div ref={bodyRef} className="cc-connection-grid-card__expand-body">
          <ConnectionExpandedBody
            connection={connection}
            variant={variant}
            onRemove={onRemove}
            collections={collections}
            membershipIds={membershipIds}
            onToggleMembership={onToggleMembership}
            onOpenPrivateDetails={onOpenPrivateDetails}
          />
        </div>
      </div>
    </ReactiveBorder>
  );
}

const SHARE_LINK_COPIED_FLAG = 'cc-share-link-copied';

function ShareYourCodeCardButton({ profileSlug }: { profileSlug?: string | null }) {
  return (
    <AppButton
      variant="primary"
      href="/dashboard#share"
      ariaLabel="Share your CodeCard"
      onClick={() => {
        const url = getPublicProfileLinkForClipboard(profileSlug);
        try {
          if (url) {
            void navigator.clipboard.writeText(url);
            sessionStorage.setItem(SHARE_LINK_COPIED_FLAG, '1');
          } else {
            sessionStorage.setItem(SHARE_LINK_COPIED_FLAG, '0');
          }
        } catch {
          sessionStorage.setItem(SHARE_LINK_COPIED_FLAG, '0');
        }
      }}
    >
      {EMPTY_STATE_COPY.connections.primaryCta}
    </AppButton>
  );
}

function ConnectionsEmptyState({ profileSlug }: { profileSlug?: string | null }) {
  const copy = EMPTY_STATE_COPY.connections;
  const publicHref = profileSlug ? `/${profileSlug}` : '/dashboard#profile';
  return (
    <div className="cc-app-page cc-app-page--1040 space-y-8">
      <PageHeader title={copy.title} description={copy.description} />
      <FadeInView delay={0}>
        <div className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-paper)] px-6 py-10 md:px-10 md:py-14">
          <p className="max-w-xl text-[16px] leading-relaxed text-[var(--app-smoke)]">
            {copy.body}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ShareYourCodeCardButton profileSlug={profileSlug} />
            <AppButton variant="ghost" href={publicHref}>
              {copy.secondaryCta}
            </AppButton>
          </div>
        </div>
      </FadeInView>
    </div>
  );
}

export function DashboardConnectionsView({
  connections,
  basePath = '/dashboard',
  variant = 'demo',
  profileSlug = null,
  onRemoveConnection,
  collections = [],
  memberships = {},
  onToggleMembership,
  onOpenPrivateDetails,
  onReorderConnections,
}: {
  connections: ViewConnection[];
  basePath?: string;
  variant?: 'demo' | 'authenticated';
  profileSlug?: string | null;
  onRemoveConnection?: (connectionId: string) => void | Promise<void>;
  collections?: Array<{ id: string; name: string }>;
  memberships?: Record<string, string[]>;
  onToggleMembership?: (
    connectionId: string,
    collectionId: string,
    currentlyAssigned: boolean,
  ) => void | Promise<void>;
  onOpenPrivateDetails?: (connectionId: string) => void;
  onReorderConnections?: (orderedIds: string[]) => void | Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ConnectionsViewMode>('grid');
  const [collectionFilter, setCollectionFilter] = useState<ConnectionsCollectionFilter>('all');
  const [locationFilter, setLocationFilter] = useState<ConnectionsLocationFilter>('all');
  const [meetingPointFilter, setMeetingPointFilter] =
    useState<ConnectionsMeetingPointFilter>('all');
  const [sort, setSort] = useState<ConnectionsSortId>('custom');
  const [demoOrder, setDemoOrder] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const listPinTokenRef = useRef(0);
  const pendingListPinRef = useRef<{ id: string; top: number } | null>(null);

  const openConnection = useCallback((event: MouseEvent<HTMLButtonElement>, id: string) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.blur();

    // Cancel any list pin loop so it cannot fight this follow-up scroll.
    listPinTokenRef.current += 1;
    pendingListPinRef.current = null;
    setSelectedId(id);

    // Follow-ups only: scroll DOWN to the matching card. Never scroll upward.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const headerOffset = 112;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target =
          document.querySelector<HTMLElement>(`[data-connection-id="${CSS.escape(id)}"]`) ??
          document.getElementById(`connection-${id}`);
        if (!target) return;

        const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        if (top <= window.scrollY + 1) return;

        window.scrollTo({
          top,
          behavior: reduceMotion ? 'instant' : 'smooth',
        });
      });
    });
  }, []);

  const toggleConnection = useCallback((event: MouseEvent<HTMLElement>, id: string) => {
    event.preventDefault();
    event.stopPropagation();

    // Capture where the card sits before expand/collapse reflow.
    const el =
      document.querySelector<HTMLElement>(`[data-connection-id="${CSS.escape(id)}"]`) ??
      document.getElementById(`connection-${id}`);
    if (el) {
      pendingListPinRef.current = { id, top: el.getBoundingClientRect().top };
    } else {
      pendingListPinRef.current = null;
    }
    event.currentTarget.blur();
    setSelectedId((current) => (current === id ? null : id));
  }, []);

  // After expand/collapse commits, glue the clicked card in the viewport so
  // collapsing a card above cannot yank you to the top of the page.
  useLayoutEffect(() => {
    const pending = pendingListPinRef.current;
    if (!pending) return;
    pendingListPinRef.current = null;

    const { id, top: beforeTop } = pending;
    const token = ++listPinTokenRef.current;

    const apply = () => {
      if (token !== listPinTokenRef.current) return;
      const after =
        document.querySelector<HTMLElement>(`[data-connection-id="${CSS.escape(id)}"]`) ??
        document.getElementById(`connection-${id}`);
      if (!after) return;
      scrollByDelta(getScrollParent(after), after.getBoundingClientRect().top - beforeTop);
    };

    apply();
    const endAt = performance.now() + 500;
    const loop = () => {
      if (token !== listPinTokenRef.current) return;
      apply();
      if (performance.now() < endAt) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, [selectedId]);

  const connectionIdsKey = connections.map((c) => c.id).join('|');
  useEffect(() => {
    setDemoOrder(null);
  }, [connectionIdsKey]);

  const orderedConnections = useMemo(() => {
    if (!demoOrder) return connections;
    const map = new Map(connections.map((c) => [c.id, c]));
    return demoOrder.flatMap((id, index) => {
      const item = map.get(id);
      return item ? [{ ...item, sortOrder: index }] : [];
    });
  }, [connections, demoOrder]);

  const collectionIds = useMemo(() => new Set(collections.map((c) => c.id)), [collections]);
  const locationOptions = useMemo(
    () => uniqueConnectionLocations(orderedConnections),
    [orderedConnections],
  );
  const meetingPointOptions = useMemo(
    () => uniqueConnectionMeetingPoints(orderedConnections),
    [orderedConnections],
  );
  const locationOptionKeys = useMemo(
    () => new Set(locationOptions.map((loc) => loc.toLowerCase())),
    [locationOptions],
  );
  const meetingPointOptionKeys = useMemo(
    () => new Set(meetingPointOptions.map((p) => p.toLowerCase())),
    [meetingPointOptions],
  );
  const hasUnknownLocations = useMemo(
    () => orderedConnections.some((c) => !(c.country ?? c.company ?? '').trim()),
    [orderedConnections],
  );
  const hasUnassignedMeetingPoints = useMemo(
    () => orderedConnections.some((c) => !connectionMeetingPointValue(c)),
    [orderedConnections],
  );

  useEffect(() => {
    if (
      collectionFilter !== 'all' &&
      collectionFilter !== 'uncategorized' &&
      !collectionIds.has(collectionFilter)
    ) {
      setCollectionFilter('all');
    }
  }, [collectionFilter, collectionIds]);

  useEffect(() => {
    if (locationFilter === 'all') return;
    if (locationFilter === 'unknown') {
      if (!hasUnknownLocations) setLocationFilter('all');
      return;
    }
    if (!locationOptionKeys.has(locationFilter.toLowerCase())) {
      setLocationFilter('all');
    }
  }, [locationFilter, locationOptionKeys, hasUnknownLocations]);

  useEffect(() => {
    if (meetingPointFilter === 'all') return;
    if (meetingPointFilter === 'unassigned') {
      if (!hasUnassignedMeetingPoints) setMeetingPointFilter('all');
      return;
    }
    if (!meetingPointOptionKeys.has(meetingPointFilter.toLowerCase())) {
      setMeetingPointFilter('all');
    }
  }, [meetingPointFilter, meetingPointOptionKeys, hasUnassignedMeetingPoints]);

  const filtered = useMemo(
    () =>
      filterAndSortConnections({
        connections: orderedConnections,
        query,
        collectionFilter: variant === 'authenticated' ? collectionFilter : 'all',
        locationFilter,
        meetingPointFilter,
        memberships: variant === 'authenticated' ? memberships : {},
        sort,
      }),
    [
      orderedConnections,
      query,
      variant,
      collectionFilter,
      locationFilter,
      meetingPointFilter,
      memberships,
      sort,
    ],
  );

  const commitOrder = useCallback(
    (nextIds: string[]) => {
      setSort('custom');
      if (onReorderConnections) {
        void onReorderConnections(nextIds);
        return;
      }
      setDemoOrder(nextIds);
    },
    [onReorderConnections],
  );

  const widgetItems = useMemo<WidgetItem[]>(
    () =>
      filtered.map((connection) => ({
        id: connection.id,
        size: 'sm' as const,
        label: connection.name,
      })),
    [filtered],
  );
  const widgetById = useMemo(
    () => new Map(filtered.map((connection) => [connection.id, connection])),
    [filtered],
  );

  const reorderVisible = useCallback(
    (fromId: string, toId: string) => {
      const visibleIds = filtered.map((c) => c.id);
      const from = visibleIds.indexOf(fromId);
      const to = visibleIds.indexOf(toId);
      if (from < 0 || to < 0 || from === to) return;
      commitOrder(
        weaveVisibleOrder(
          orderedConnections.map((c) => c.id),
          moveIndex(visibleIds, from, to),
        ),
      );
    },
    [filtered, orderedConnections, commitOrder],
  );

  const moveVisible = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const visibleIds = filtered.map((c) => c.id);
      const from = visibleIds.indexOf(id);
      const to = direction === 'up' ? from - 1 : from + 1;
      if (from < 0 || to < 0 || to >= visibleIds.length) return;
      reorderVisible(id, visibleIds[to]!);
    },
    [filtered, reorderVisible],
  );

  const filtersActive =
    Boolean(query.trim()) ||
    meetingPointFilter !== 'all' ||
    locationFilter !== 'all' ||
    (variant === 'authenticated' && collectionFilter !== 'all') ||
    sort !== 'custom';

  const clearFilters = () => {
    setQuery('');
    setCollectionFilter('all');
    setLocationFilter('all');
    setMeetingPointFilter('all');
    setSort('custom');
  };

  const upcomingFollowUps = useMemo(
    () => (variant === 'demo' ? getUpcomingFollowUps(connections) : []),
    [connections, variant],
  );

  if (variant === 'authenticated' && connections.length === 0) {
    return <ConnectionsEmptyState profileSlug={profileSlug} />;
  }

  return (
    <div className="cc-app-page cc-app-page--1040 space-y-8">
      <PageHeader
        title={variant === 'authenticated' ? 'Your Connections' : 'People you saved'}
        description={
          variant === 'authenticated'
            ? 'People you met. Open their CodeCard anytime.'
            : 'Sample people from in-person QR scans.'
        }
        actions={
          <AppButton variant="primary" href={`${basePath}#share`}>
            Share CodeCard
          </AppButton>
        }
      />

      <div className="cc-connections-sections flex flex-col gap-4">
        <FadeInView delay={0}>
          <div className="space-y-4">
            <div className="cc-connections-toolbar">
              <div className="cc-connections-toolbar__search">
                <svg
                  className="cc-connections-toolbar__search-icon"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden
                >
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                  <path
                    d="M10.5 10.5 14 14"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search connections…"
                  className="cc-app-input"
                  aria-label="Search connections"
                />
              </div>

              {variant === 'authenticated' ? (
                <div className="flex flex-wrap gap-2">
                  <label className="sr-only" htmlFor="connections-meeting-point-filter">
                    Filter by meeting point
                  </label>
                  <select
                    id="connections-meeting-point-filter"
                    className="cc-app-input w-auto min-w-[10rem]"
                    value={meetingPointFilter}
                    onChange={(e) =>
                      setMeetingPointFilter(e.target.value as ConnectionsMeetingPointFilter)
                    }
                  >
                    <option value="all">All meeting points</option>
                    {hasUnassignedMeetingPoints ? (
                      <option value="unassigned">Unassigned</option>
                    ) : null}
                    {meetingPointOptions.map((point) => (
                      <option key={point.toLowerCase()} value={point}>
                        {point}
                      </option>
                    ))}
                  </select>
                  <label className="sr-only" htmlFor="connections-location-filter">
                    Filter by country or location
                  </label>
                  <select
                    id="connections-location-filter"
                    className="cc-app-input w-auto min-w-[10rem]"
                    value={locationFilter}
                    onChange={(e) =>
                      setLocationFilter(e.target.value as ConnectionsLocationFilter)
                    }
                  >
                    <option value="all">All countries / locations</option>
                    {hasUnknownLocations ? (
                      <option value="unknown">No location</option>
                    ) : null}
                    {locationOptions.map((loc) => (
                      <option key={loc.toLowerCase()} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <label className="sr-only" htmlFor="connections-collection-filter">
                    Filter by collection
                  </label>
                  <select
                    id="connections-collection-filter"
                    className="cc-app-input w-auto min-w-[10rem]"
                    value={collectionFilter}
                    onChange={(e) =>
                      setCollectionFilter(e.target.value as ConnectionsCollectionFilter)
                    }
                  >
                    <option value="all">All Connections</option>
                    <option value="uncategorized">Uncategorized</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <label className="sr-only" htmlFor="connections-sort">
                    Sort Connections
                  </label>
                  <select
                    id="connections-sort"
                    className="cc-app-input w-auto min-w-[10rem]"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as ConnectionsSortId)}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <label className="sr-only" htmlFor="connections-meeting-point-filter">
                    Filter by meeting point
                  </label>
                  <select
                    id="connections-meeting-point-filter"
                    className="cc-app-input w-auto min-w-[10rem]"
                    value={meetingPointFilter}
                    onChange={(e) =>
                      setMeetingPointFilter(e.target.value as ConnectionsMeetingPointFilter)
                    }
                  >
                    <option value="all">All meeting points</option>
                    {hasUnassignedMeetingPoints ? (
                      <option value="unassigned">Unassigned</option>
                    ) : null}
                    {meetingPointOptions.map((point) => (
                      <option key={point.toLowerCase()} value={point}>
                        {point}
                      </option>
                    ))}
                  </select>
                  <label className="sr-only" htmlFor="connections-location-filter">
                    Filter by country or location
                  </label>
                  <select
                    id="connections-location-filter"
                    className="cc-app-input w-auto min-w-[10rem]"
                    value={locationFilter}
                    onChange={(e) =>
                      setLocationFilter(e.target.value as ConnectionsLocationFilter)
                    }
                  >
                    <option value="all">All countries / locations</option>
                    {hasUnknownLocations ? (
                      <option value="unknown">No location</option>
                    ) : null}
                    {locationOptions.map((loc) => (
                      <option key={loc.toLowerCase()} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="cc-projects-view-toggle" role="group" aria-label="Connections view">
                {CONNECTION_VIEW_MODES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={`cc-projects-view-toggle__btn ${
                      viewMode === id ? 'cc-projects-view-toggle__btn--active' : ''
                    }`}
                    onClick={() => setViewMode(id)}
                    aria-pressed={viewMode === id}
                    aria-label={label}
                    title={label}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </FadeInView>

        {variant === 'demo' ? (
          <FadeInView delay={0.08} className="cc-connections-followups-section">
            <ConnectionsFollowUps
              followUps={upcomingFollowUps}
              onSelect={openConnection}
            />
          </FadeInView>
        ) : null}

        <FadeInView delay={0.06} className="cc-connections-results-section">
          {viewMode === 'list' ? (
            <ul className="cc-connection-list">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  className={draggingId === c.id ? 'cc-connection-item--dragging' : undefined}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggingId) reorderVisible(draggingId, c.id);
                    setDraggingId(null);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                >
                  <ConnectionCard
                    connection={c}
                    expanded={selectedId === c.id}
                    onToggle={(event) => toggleConnection(event, c.id)}
                    variant={variant}
                    onRemove={onRemoveConnection}
                    collections={collections}
                    membershipIds={memberships[c.id] ?? []}
                    onToggleMembership={onToggleMembership}
                    onOpenPrivateDetails={onOpenPrivateDetails}
                    dragHandle={
                      <ConnectionDragHandle
                        name={c.name}
                        onDragStart={() => setDraggingId(c.id)}
                        onMove={(direction) => moveVisible(c.id, direction)}
                      />
                    }
                  />
                </li>
              ))}
            </ul>
          ) : (
            <DraggableWidgetGrid
              className="cc-workspace-widget-grid cc-workspace-widget-grid--connections"
              items={widgetItems}
              maxColumns={4}
              cellSize={210}
              gap={14}
              radius={22}
              onChange={(next) => {
                commitOrder(
                  weaveVisibleOrder(
                    orderedConnections.map((c) => c.id),
                    next.map((item) => item.id),
                  ),
                );
              }}
              renderItem={(item) => {
                const c = widgetById.get(item.id);
                if (!c) return null;
                return (
                  <ConnectionGridCard
                    connection={c}
                    expanded={selectedId === c.id}
                    onToggle={(event) => toggleConnection(event, c.id)}
                    variant={variant}
                    onRemove={onRemoveConnection}
                    collections={collections}
                    membershipIds={memberships[c.id] ?? []}
                    onToggleMembership={onToggleMembership}
                    onOpenPrivateDetails={onOpenPrivateDetails}
                  />
                );
              }}
            />
          )}

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              {connections.length > 0 ? (
                <>
                  <p className="text-[15px] text-[var(--app-smoke)]">
                    No Connections match these filters.
                  </p>
                  {filtersActive ? (
                    <button
                      type="button"
                      className="cc-app-btn cc-app-btn--ghost mt-4 !h-10"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </button>
                  ) : null}
                </>
              ) : (
                <p className="text-[15px] text-[var(--app-smoke)]">
                  No connections match this filter.
                </p>
              )}
            </div>
          )}
        </FadeInView>
      </div>
    </div>
  );
}

'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { HiBars3BottomLeft, HiSquares2X2 } from 'react-icons/hi2';
import type { WorkspaceConnection } from '@/lib/dashboard/workspace-demo';
import { getUpcomingFollowUps } from '@/lib/dashboard/connections-summary';
import { DashFilterBar } from './dash-filter-bar';
import { FadeInView } from './fade-in-view';
import { ReactiveBorder } from './reactive-border';
import { AsyncActionButton } from '@/components/ui/async-action-button';
import { CopyLinkButton } from '@/components/ui/copy-link-button';
import { AppButton, AppCard, PageHeader, SectionLabel } from './ui/dashboard-ui';

const SOURCES = ['All', 'NFC', 'QR', 'Conference', 'LinkedIn', 'Manual'] as const;
const CONNECTION_VIEW_MODES = [
  { id: 'list' as const, label: 'List view', icon: HiBars3BottomLeft },
  { id: 'grid' as const, label: 'Grid view', icon: HiSquares2X2 },
];
type ConnectionsViewMode = 'list' | 'grid';

type ViewConnection = WorkspaceConnection & {
  profileSlug?: string;
  isPublicTarget?: boolean;
};

function connectionEmail(connection: WorkspaceConnection) {
  const local = connection.name.toLowerCase().replace(/\s+/g, '.');
  const domain = connection.company.toLowerCase().replace(/[^a-z0-9]/g, '') || 'mail';
  return `${local}@${domain}.com`;
}

function ConnectionExpandedBody({
  connection,
  variant,
  onRemove,
}: {
  connection: ViewConnection;
  variant: 'demo' | 'authenticated';
  onRemove?: (connectionId: string) => void | Promise<void>;
}) {
  if (variant === 'authenticated') {
    const href =
      connection.profileSlug && connection.isPublicTarget !== false
        ? `/${connection.profileSlug}`
        : null;

    return (
      <div className="cc-connection-expand__grid">
        <dl className="cc-connection-meta">
          <div className="cc-connection-meta__item">
            <dt className="cc-connection-meta__label">Connected</dt>
            <dd className="cc-connection-meta__value">{connection.date}</dd>
          </div>
          {connection.company ? (
            <div className="cc-connection-meta__item">
              <dt className="cc-connection-meta__label">Location</dt>
              <dd className="cc-connection-meta__value">{connection.company}</dd>
            </div>
          ) : null}
        </dl>

        <div className="cc-connection-notes">
          <p className="cc-connection-notes__text">{connection.note}</p>
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
        </div>
      </div>
    );
  }

  const followUp = `${connection.followUp.charAt(0).toUpperCase()}${connection.followUp.slice(1)}${
    connection.followUpDate ? ` · ${connection.followUpDate}` : ''
  }`;

  const metaItems = [
    { label: 'Met at', value: connection.metAt },
    { label: 'Date', value: connection.date },
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
        <AppButton variant="primary">Open CodeCard</AppButton>
        <CopyLinkButton
          getText={() => connectionEmail(connection)}
          variant="ghost"
          successLabel="Copied"
        >
          Copy email
        </CopyLinkButton>
        <AsyncActionButton
          variant="ghost"
          successLabel="Scheduled"
          onAction={async () => {
            await new Promise((r) => setTimeout(r, 400));
          }}
        >
          Add follow-up
        </AsyncActionButton>
      </div>
    </div>
  );
}

function ConnectionsFollowUps({
  followUps,
  onSelect,
}: {
  followUps: WorkspaceConnection[];
  onSelect: (id: string) => void;
}) {
  if (followUps.length === 0) return null;

  return (
    <AppCard tone="blush" className="cc-connection-followups !p-6 md:!p-8">
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
              onClick={() => onSelect(c.id)}
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
}: {
  connection: ViewConnection;
  expanded: boolean;
  onToggle: () => void;
  variant: 'demo' | 'authenticated';
  onRemove?: (connectionId: string) => void | Promise<void>;
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
      className={`cc-connection-blob${expanded ? ' cc-connection-blob--open' : ''}`}
      liftOnHover={!expanded}
      pressOnTap={false}
    >
      <button
        type="button"
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
            {expanded && (
              <span className="cc-app-badge cc-app-badge--blush cc-connection-blob__source-badge">
                {connection.source}
              </span>
            )}
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
            <p className="cc-connection-blob__summary-label">{connection.metAt}</p>
          )}
          <p className="cc-connection-blob__summary-value">{connection.date}</p>
          {!expanded && (
            <span className="cc-app-badge cc-app-badge--blush cc-connection-blob__source-badge">
              {connection.source}
            </span>
          )}
        </div>
      </button>

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
}: {
  connection: ViewConnection;
  expanded: boolean;
  onToggle: () => void;
  variant: 'demo' | 'authenticated';
  onRemove?: (connectionId: string) => void | Promise<void>;
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
      className={`cc-connection-grid-card${expanded ? ' cc-connection-grid-card--open' : ''}`}
      liftOnHover={!expanded}
      pressOnTap={false}
    >
      <button
        type="button"
        onClick={onToggle}
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
      </button>

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
          />
        </div>
      </div>
    </ReactiveBorder>
  );
}

function ConnectionsEmptyState() {
  return (
    <div className="cc-app-page cc-app-page--1040 space-y-8">
      <PageHeader
        title="Build a network you can actually remember"
        description="Save people whose work matters to you. Add Connections from their public CodeCard, then organize and follow their work from here."
      />
      <FadeInView delay={0}>
        <div className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-paper)] px-6 py-10 md:px-10 md:py-14">
          <p className="max-w-xl text-[16px] leading-relaxed text-[var(--app-smoke)]">
            Open a person&apos;s CodeCard and choose{' '}
            <strong className="font-medium text-[var(--app-ink)]">Add connection</strong>. Your
            list stays private — only you can see who you saved.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <AppButton variant="primary" href="/profiles">
              Explore CodeCards
            </AppButton>
            <AppButton variant="ghost" href="/dashboard/profile">
              Share your CodeCard
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
  onRemoveConnection,
}: {
  connections: ViewConnection[];
  basePath?: string;
  variant?: 'demo' | 'authenticated';
  onRemoveConnection?: (connectionId: string) => void | Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<(typeof SOURCES)[number]>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ConnectionsViewMode>('list');

  const filtered = useMemo(() => {
    return connections.filter((c) => {
      if (variant === 'demo' && source !== 'All' && c.source !== source) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.note.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
      );
    });
  }, [connections, query, source, variant]);

  const upcomingFollowUps = useMemo(
    () => (variant === 'demo' ? getUpcomingFollowUps(connections) : []),
    [connections, variant],
  );

  if (variant === 'authenticated' && connections.length === 0) {
    return <ConnectionsEmptyState />;
  }

  return (
    <div className="cc-app-page cc-app-page--1040 space-y-8">
      <PageHeader
        title={variant === 'authenticated' ? 'Your Connections' : 'People you saved'}
        description={
          variant === 'authenticated'
            ? 'People whose work you saved from their public CodeCard.'
            : 'Private context for everyone you meet.'
        }
        actions={
          <AppButton variant="primary" href={`${basePath}/profile`}>
            Share CodeCard
          </AppButton>
        }
      />

      <div className="cc-connections-sections flex flex-col gap-4">
        <FadeInView delay={0}>
          <div className="space-y-4">
            <div className="cc-connections-toolbar">
              <div className="relative max-w-md flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-smoke)]"
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
                  className="cc-app-input pl-9"
                  aria-label="Search connections"
                />
              </div>

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
            {variant === 'demo' ? (
              <DashFilterBar options={SOURCES} value={source} onChange={setSource} />
            ) : null}
          </div>
        </FadeInView>

        {variant === 'demo' ? (
          <FadeInView delay={0.08} className="cc-connections-followups-section">
            <ConnectionsFollowUps
              followUps={upcomingFollowUps}
              onSelect={(id) => setSelectedId(id)}
            />
          </FadeInView>
        ) : null}

        <FadeInView delay={0.06} className="cc-connections-results-section">
          {viewMode === 'list' ? (
            <ul className="cc-connection-list">
              {filtered.map((c) => (
                <li key={c.id}>
                  <ConnectionCard
                    connection={c}
                    expanded={selectedId === c.id}
                    onToggle={() => setSelectedId(selectedId === c.id ? null : c.id)}
                    variant={variant}
                    onRemove={onRemoveConnection}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="cc-connection-grid">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  className={selectedId === c.id ? 'cc-connection-grid__item--open' : undefined}
                >
                  <ConnectionGridCard
                    connection={c}
                    expanded={selectedId === c.id}
                    onToggle={() => setSelectedId(selectedId === c.id ? null : c.id)}
                    variant={variant}
                    onRemove={onRemoveConnection}
                  />
                </li>
              ))}
            </ul>
          )}

          {filtered.length === 0 && (
            <p className="py-16 text-center text-[15px] text-[var(--app-smoke)]">
              No connections match this filter.
            </p>
          )}
        </FadeInView>
      </div>
    </div>
  );
}

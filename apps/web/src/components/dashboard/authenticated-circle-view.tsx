import Image from 'next/image';
import Link from 'next/link';
import type { CircleFeedItem, CircleFeedState } from '@/lib/circle/circle-activity-contract';
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
        Add people whose work you want to follow. Their new projects, research and professional
        updates will appear here.
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
        You’re connected. New projects, research and public updates from your network will appear
        here when they publish.
      </p>
      <div className="mt-6">
        <AppButton variant="ghost" href="/dashboard/connections">
          Manage Connections
        </AppButton>
      </div>
    </section>
  );
}

function CircleActivityCard({ item, index }: { item: CircleFeedItem; index: number }) {
  const href = targetHref(item);
  const profileHref = `/${item.actor.slug}`;
  const ctaLabel =
    item.target.targetType === 'research' ? `Read paper: ${item.target.title}` : `View project: ${item.target.title}`;

  return (
    <li>
      <FadeInView delay={0.06 + index * 0.05}>
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
                <span className="flex h-full w-full items-center justify-center text-sm font-medium" aria-hidden>
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

export function AuthenticatedCircleView({ feed }: { feed: CircleFeedState }) {
  return (
    <div className="cc-app-page cc-app-page--1040 overflow-x-hidden">
      <PageHeader
        title="Circle"
        description="Public projects and research from people you’ve saved as Connections."
      />

      {feed.status === 'unauthenticated' ? (
        <p className="text-[14px] text-[var(--app-smoke)]" role="alert">
          Sign in to view your Circle.
        </p>
      ) : null}

      {feed.status === 'temporary_failure' ? (
        <section className="space-y-4" aria-live="polite">
          <p className="text-[14px] text-[var(--app-smoke)]" role="alert">
            {feed.error}
          </p>
          <AppButton variant="primary" href="/dashboard/circle">
            Retry
          </AppButton>
        </section>
      ) : null}

      {feed.status === 'no_connections' ? <CircleEmptyNoConnections /> : null}

      {feed.status === 'no_activity' ? <CircleEmptyNoActivity /> : null}

      {feed.status === 'feed' ? (
        <ul className="space-y-4" aria-label="Circle activity">
          {feed.items.map((item, index) => (
            <CircleActivityCard key={item.eventId} item={item} index={index} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

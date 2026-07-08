'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { DashFilterBar } from './dash-filter-bar';
import { FadeInView } from './fade-in-view';
import { AppButton, AppCard, AppMono, PageHeader } from './ui/dashboard-ui';
import {
  CIRCLE_FILTER_OPTIONS,
  DEMO_CIRCLE_FEED,
  type CircleFeedItem,
  type CircleFilter,
} from '@/lib/dashboard/circle-demo';

function matchesCircleFilter(item: CircleFeedItem, filter: CircleFilter): boolean {
  if (filter === 'All') return true;
  if (filter === 'New') return Boolean(item.isNew);
  return item.category === filter;
}

export function DashboardCircleView({ items = DEMO_CIRCLE_FEED }: { items?: CircleFeedItem[] }) {
  const [filter, setFilter] = useState<CircleFilter>('All');

  const filtered = useMemo(
    () => items.filter((item) => matchesCircleFilter(item, filter)),
    [items, filter],
  );

  return (
    <div className="cc-app-page cc-app-page--1040">
      <PageHeader
        title="Circle"
        description="Projects from people you've saved or connected with."
      />

      <FadeInView delay={0}>
      <DashFilterBar options={CIRCLE_FILTER_OPTIONS} value={filter} onChange={setFilter} />
      </FadeInView>

      <ul className="space-y-4">
        {filtered.map((item, index) => (
          <li key={item.id}>
            <FadeInView delay={0.08 + index * 0.08}>
            <AppCard className="overflow-hidden !p-0">
              <div className="flex flex-wrap items-center gap-3 border-b border-[var(--app-border)] px-5 py-4">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--app-border)] bg-[var(--app-bone)]">
                  {item.avatarUrl ? (
                    <Image src={item.avatarUrl} alt="" fill className="object-cover" sizes="40px" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-medium">
                      {item.connectionName[0]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[15px] font-medium text-[var(--app-ink)]">{item.connectionName}</p>
                  <p className="text-[13px] text-[var(--app-smoke)]">{item.connectionRole}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-[minmax(240px,360px)_1fr]">
                <div className="relative min-h-[180px] bg-[var(--app-bone)]">
                  {item.posterUrl ? (
                    <Image src={item.posterUrl} alt="" fill className="object-cover" sizes="360px" />
                  ) : null}
                </div>

                <div className="flex flex-col justify-between p-6">
                  <div>
                    {item.isNew && (
                      <span className="cc-app-badge cc-app-badge--mint mb-3 inline-flex">New</span>
                    )}
                    <AppMono>Featured project</AppMono>
                    <h3 className="mt-3 text-[24px] font-medium tracking-[-0.025em] text-[var(--app-ink)]">
                      {item.projectTitle}
                    </h3>
                    <p className="mt-2 max-w-lg text-[15px] text-[var(--app-smoke)]">{item.projectTagline}</p>
                    <p className="mt-3 text-[13px] text-[var(--app-smoke)]">{item.updatedAt}</p>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <AppButton variant="primary">View project</AppButton>
                    <AppButton variant="ghost">Their CodeCard</AppButton>
                  </div>
                </div>
              </div>
            </AppCard>
            </FadeInView>
          </li>
        ))}
      </ul>
    </div>
  );
}

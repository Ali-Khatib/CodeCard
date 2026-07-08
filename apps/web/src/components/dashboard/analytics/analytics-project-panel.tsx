'use client';

import Image from 'next/image';
import { CountUp } from '@/components/landing/count-up';
import type { ProjectAnalyticsDetail } from '@/lib/dashboard/analytics-data';
import { AppCard, MetricLabel, SectionLabel } from '../ui/dashboard-ui';

function formatTime(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function AnalyticsProjectPanel({ projects }: { projects: ProjectAnalyticsDetail[] }) {
  return (
    <section>
      <SectionLabel>Per-project analytics</SectionLabel>
      <p className="mt-2 text-[14px] text-[var(--app-smoke)]">
        Time on page, downloads, GitHub clicks, and how people found each project
      </p>

      <div className="mt-5 space-y-4">
        {projects.map((project) => (
          <AppCard key={project.id} className="!p-5 md:!p-6">
            <div className="flex flex-wrap items-start gap-4">
              {project.posterUrl && (
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-[10px] border border-[var(--app-border)] bg-[var(--app-bone)]">
                  <Image src={project.posterUrl} alt="" fill className="object-cover" sizes="96px" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--app-ink)]">
                  {project.title}
                </h3>
                <p className="mt-1 text-[13px] text-[var(--app-smoke)]">
                  Top sources: {project.topReferrers.join(' · ')}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="cc-analytics-stat-block">
                <MetricLabel>Views</MetricLabel>
                <p className="mt-1 text-[22px] font-medium text-[var(--app-ink)]">
                  <CountUp value={project.views} />
                </p>
              </div>
              <div className="cc-analytics-stat-block">
                <MetricLabel>Avg time</MetricLabel>
                <p className="mt-1 text-[22px] font-medium text-[var(--app-ink)]">
                  {formatTime(project.avgTimeSec)}
                </p>
              </div>
              <div className="cc-analytics-stat-block">
                <MetricLabel>GitHub clicks</MetricLabel>
                <p className="mt-1 text-[22px] font-medium text-[var(--app-ink)]">
                  <CountUp value={project.githubClicks} />
                </p>
              </div>
              <div className="cc-analytics-stat-block">
                <MetricLabel>Demo clicks</MetricLabel>
                <p className="mt-1 text-[22px] font-medium text-[var(--app-ink)]">
                  <CountUp value={project.demoClicks} />
                </p>
              </div>
              <div className="cc-analytics-stat-block">
                <MetricLabel>Resume downloads</MetricLabel>
                <p className="mt-1 text-[22px] font-medium text-[var(--app-ink)]">
                  <CountUp value={project.resumeDownloads} />
                </p>
              </div>
              <div className="cc-analytics-stat-block">
                <MetricLabel>Saves</MetricLabel>
                <p className="mt-1 text-[22px] font-medium text-[var(--app-ink)]">
                  <CountUp value={project.saves} />
                </p>
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    </section>
  );
}

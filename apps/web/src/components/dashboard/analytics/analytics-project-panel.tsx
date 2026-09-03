'use client';

import Image from 'next/image';
import { CountUp } from '@/components/landing/count-up';
import type { ProjectAnalyticsDetail } from '@/lib/dashboard/analytics-data';
import { AppCard, MetricLabel, SectionLabel, SectionSubtitle } from '../ui/dashboard-ui';

function formatTime(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const METRICS = [
  { key: 'views', label: 'Views', get: (p: ProjectAnalyticsDetail) => p.views, format: 'count' as const },
  {
    key: 'avgTime',
    label: 'Avg time',
    get: (p: ProjectAnalyticsDetail) => p.avgTimeSec,
    format: 'time' as const,
  },
  {
    key: 'github',
    label: 'GitHub clicks',
    get: (p: ProjectAnalyticsDetail) => p.githubClicks,
    format: 'count' as const,
  },
  {
    key: 'demo',
    label: 'Demo clicks',
    get: (p: ProjectAnalyticsDetail) => p.demoClicks,
    format: 'count' as const,
  },
  {
    key: 'resume',
    label: 'Resume downloads',
    get: (p: ProjectAnalyticsDetail) => p.resumeDownloads,
    format: 'count' as const,
  },
  { key: 'saves', label: 'Saves', get: (p: ProjectAnalyticsDetail) => p.saves, format: 'count' as const },
] as const;

export function AnalyticsProjectPanel({ projects }: { projects: ProjectAnalyticsDetail[] }) {
  return (
    <section>
      <SectionLabel>Per-project analytics</SectionLabel>
      <SectionSubtitle>
        Time on page, downloads, GitHub clicks, and how people found each project
      </SectionSubtitle>

      <div className="mt-6 space-y-5">
        {projects.map((project, index) => (
          <AppCard
            key={project.id}
            className={`cc-analytics-project-card !p-0 overflow-hidden ${
              index % 2 === 0 ? 'cc-analytics-project-card--warm' : 'cc-analytics-project-card--cool'
            }`}
          >
            <div className="cc-analytics-project-card__head">
              {project.posterUrl && (
                <div className="cc-analytics-project-card__poster">
                  <Image src={project.posterUrl} alt="" fill className="object-cover" sizes="128px" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="cc-analytics-project-card__title">{project.title}</h3>
                {project.topReferrers.length > 0 ? (
                  <div className="cc-analytics-project-card__sources" aria-label="Top sources">
                    {project.topReferrers.map((source) => (
                      <span key={source} className="cc-analytics-project-card__source-chip">
                        {source}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="cc-analytics-project-card__metrics">
              {METRICS.map((metric) => {
                const raw = metric.get(project);
                return (
                  <div key={metric.key} className="cc-analytics-project-metric">
                    <MetricLabel>{metric.label}</MetricLabel>
                    <p className="cc-analytics-project-metric__value">
                      {metric.format === 'time' ? (
                        formatTime(raw)
                      ) : (
                        <CountUp value={raw} />
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </AppCard>
        ))}
      </div>
    </section>
  );
}

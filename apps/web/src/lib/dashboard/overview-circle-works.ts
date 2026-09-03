import type { CircleFeedItem as AuthCircleFeedItem } from '@/lib/circle/circle-activity-contract';
import type { CircleFeedItem as DemoCircleFeedItem } from '@/lib/dashboard/circle-demo';
import { publicDemoProjectHref } from '@/lib/marketing/demo-url';

/** Compact Circle highlight shown on Home (max 3). */
export type OverviewCircleWork = {
  id: string;
  personName: string;
  personRole: string | null;
  avatarUrl: string | null;
  title: string;
  tagline: string | null;
  href: string;
  when: string;
  kind: 'project' | 'research';
};

export type OverviewCircleWorksEmpty = 'none' | 'no_connections' | 'error';

const DEMO_PROJECT_BY_TITLE: Record<string, string> = {
  PipelineX: 'demo-1',
  Pulse: 'demo-3',
  SchemaSync: 'demo-2',
  TraceKit: 'demo-1',
};

function formatActivityWhen(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

/** Map authenticated Circle feed rows into Home highlights. */
export function overviewCircleWorksFromAuthFeed(
  items: AuthCircleFeedItem[],
  limit = 3,
): OverviewCircleWork[] {
  return items.slice(0, limit).map((item) => ({
    id: item.eventId,
    personName: item.actor.displayName,
    personRole: item.actor.headline,
    avatarUrl: item.actor.avatarPublicUrl,
    title: item.target.title,
    tagline: item.target.summary,
    href:
      item.target.targetType === 'project'
        ? `/${item.actor.slug}/projects/${item.target.publicPathKey}`
        : `/${item.actor.slug}/research/${item.target.publicPathKey}`,
    when: formatActivityWhen(item.createdAt),
    kind: item.target.targetType,
  }));
}

/** Map demo Circle feed rows into Home highlights (live demo only). */
export function overviewCircleWorksFromDemoFeed(
  items: DemoCircleFeedItem[],
  limit = 3,
): OverviewCircleWork[] {
  return items.slice(0, limit).map((item) => {
    const demoProjectId = DEMO_PROJECT_BY_TITLE[item.projectTitle] ?? 'demo-1';
    return {
      id: item.id,
      personName: item.connectionName,
      personRole: item.connectionRole,
      avatarUrl: item.avatarUrl ?? null,
      title: item.projectTitle,
      tagline: item.projectTagline,
      href: publicDemoProjectHref('demo', demoProjectId),
      when: item.updatedAt,
      kind: 'project' as const,
    };
  });
}

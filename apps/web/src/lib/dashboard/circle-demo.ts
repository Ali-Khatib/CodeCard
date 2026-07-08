import { DEMO_FEATURED_PROJECTS } from '@/lib/projects/demo-data';
import { DEMO_CONNECTIONS } from '@/lib/dashboard/workspace-demo';

export type CircleFeedItem = {
  id: string;
  connectionId: string;
  connectionName: string;
  connectionRole: string;
  avatarUrl?: string;
  projectId: string;
  projectTitle: string;
  projectTagline: string;
  posterUrl?: string;
  updatedAt: string;
  isNew?: boolean;
  category: 'Recruiters' | 'Engineers' | 'Founders' | 'Conferences';
};

/** Featured work from people in your Circle — demo feed */
export const DEMO_CIRCLE_FEED: CircleFeedItem[] = [
  {
    id: 'cf1',
    connectionId: 'c1',
    connectionName: 'Jordan Lee',
    connectionRole: 'Staff Engineer · Vercel',
    avatarUrl: DEMO_CONNECTIONS[0].avatarUrl,
    projectId: 'jordan-pipeline',
    projectTitle: 'PipelineX',
    projectTagline: 'Deploy previews that never block the main branch',
    posterUrl: DEMO_FEATURED_PROJECTS[0].posterUrl ?? undefined,
    updatedAt: '2h ago',
    isNew: true,
    category: 'Engineers',
  },
  {
    id: 'cf2',
    connectionId: 'c2',
    connectionName: 'Samira Okonkwo',
    connectionRole: 'Technical Recruiter · Stripe',
    avatarUrl: DEMO_CONNECTIONS[1].avatarUrl,
    projectId: 'samira-pulse',
    projectTitle: 'Pulse',
    projectTagline: 'Observability for small teams',
    posterUrl: DEMO_FEATURED_PROJECTS[2].posterUrl ?? undefined,
    updatedAt: 'Yesterday',
    isNew: true,
    category: 'Recruiters',
  },
  {
    id: 'cf3',
    connectionId: 'c4',
    connectionName: 'Elena Vasquez',
    connectionRole: 'Engineering Manager · Notion',
    avatarUrl: DEMO_CONNECTIONS[3].avatarUrl,
    projectId: 'elena-schemasync',
    projectTitle: 'SchemaSync',
    projectTagline: 'Database migrations without the drama',
    posterUrl: DEMO_FEATURED_PROJECTS[1].posterUrl ?? undefined,
    updatedAt: '3 days ago',
    category: 'Engineers',
  },
  {
    id: 'cf4',
    connectionId: 'c3',
    connectionName: 'Chris Park',
    connectionRole: 'Founder · Stealth',
    avatarUrl: DEMO_CONNECTIONS[2].avatarUrl,
    projectId: 'chris-trace',
    projectTitle: 'TraceKit',
    projectTagline: 'OpenTelemetry setup in one afternoon',
    posterUrl: DEMO_FEATURED_PROJECTS[0].posterUrl ?? undefined,
    updatedAt: '1 week ago',
    category: 'Founders',
  },
];

export const CIRCLE_FILTER_OPTIONS = ['All', 'New', 'Recruiters', 'Engineers', 'Founders', 'Conferences'] as const;
export type CircleFilter = (typeof CIRCLE_FILTER_OPTIONS)[number];

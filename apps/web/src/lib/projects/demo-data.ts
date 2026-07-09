import type { FeaturedProject } from '@/lib/projects/featured';

/** Product-style mock screenshots — fallback when no photo URL */
const mock = (title: string, subtitle: string) =>
  `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <rect fill="#030014" width="1600" height="1000"/>
  <rect fill="#060317" x="48" y="48" width="1504" height="72" rx="12"/>
  <rect fill="#10093a" x="48" y="152" width="360" height="800" rx="12"/>
  <rect fill="#10093a" x="440" y="152" width="1112" height="420" rx="12"/>
  <rect fill="#1f1f23" x="440" y="600" width="540" height="352" rx="12"/>
  <rect fill="#1f1f23" x="1012" y="600" width="540" height="352" rx="12"/>
  <circle fill="#9382ff" cx="88" cy="84" r="12" opacity="0.6"/>
  <text x="120" y="92" fill="#918ea0" font-family="system-ui,sans-serif" font-size="22">${title}</text>
  <text x="480" y="220" fill="#f4f0ff" font-family="system-ui,sans-serif" font-size="36" font-weight="600">${subtitle}</text>
  <text x="480" y="270" fill="#54525f" font-family="system-ui,sans-serif" font-size="18">Live product interface preview</text>
</svg>`)}`;

const unsplash = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const DEMO_PROFILE = {
  display_name: 'Alex Chen',
  headline: 'Senior AI Engineer · Stripe',
  bio: 'I ship tools that help teams move faster. Previously early engineer at infra startups.',
  avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
  accentColor: '#9382ff',
  location: 'San Francisco',
  followers: 1240,
  links: [
    { type: 'github', label: null, url: 'https://github.com' },
    { type: 'linkedin', label: null, url: 'https://linkedin.com' },
    { type: 'website', label: null, url: 'https://example.com' },
    { type: 'twitter', label: null, url: 'https://x.com' },
  ],
};

export const DEMO_FEATURED_PROJECTS: FeaturedProject[] = [
  {
    id: 'demo-1',
    title: 'DevFlow',
    tagline: 'CI/CD pipelines that actually make sense',
    description:
      'DevFlow turns messy YAML into readable pipelines with instant feedback, environment previews, and zero config sprawl.\n\nTeams ship 3× faster on average while cutting failed deploys by half.\n\nThe visual editor maps 1:1 to your GitHub Actions config. No lock-in, no black box.\n\nIncludes drift detection, rollback in one click, and per-PR preview environments wired to your container registry.',
    technologies: [
      'TypeScript',
      'React',
      'Next.js',
      'Node.js',
      'Docker',
      'PostgreSQL',
      'Redis',
      'AWS',
      'Terraform',
      'GitHub Actions',
    ],
    domains: ['Cloud Computing'],
    focusAreas: ['DevOps', 'CI/CD'],
    posterUrl: unsplash('1555066931-4365d14bab8c'),
    videoUrl: 'https://cdn.coverr.co/videos/coverr-software-developer-working-on-code-5635/1080p.mp4',
    links: [
      { type: 'repo', label: 'GitHub', url: 'https://github.com' },
      { type: 'live', label: 'Live demo', url: 'https://example.com' },
    ],
    screenshots: [
      unsplash('1460925895917-afdab827c52f'),
      unsplash('1551288049-bebda4e38f71'),
      mock('DevFlow', 'Deploy history'),
      mock('DevFlow', 'Environment preview'),
    ],
  },
  {
    id: 'demo-2',
    title: 'SchemaSync',
    tagline: 'Database migrations without the drama',
    description:
      'SchemaSync tracks migration state across every environment and surfaces drift before it hits production.\n\nAuto-generated rollback scripts, schema diff visualizations, and Slack alerts when staging diverges from main.\n\nBuilt in Rust for speed. Diffing a 400-table schema takes under 200ms.\n\nSupports PostgreSQL, MySQL, and SQLite with a unified migration timeline your whole team can audit.',
    technologies: ['Rust', 'PostgreSQL', 'SQLite', 'Docker', 'gRPC', 'CLI'],
    domains: ['Cloud Computing'],
    focusAreas: ['Databases'],
    posterUrl: mock('SchemaSync', 'Schema diff'),
    videoUrl: 'https://cdn.coverr.co/videos/coverr-typing-on-a-computer-keyboard-8445/1080p.mp4',
    links: [
      { type: 'live', label: 'Demo', url: 'https://example.com' },
      { type: 'repo', label: 'GitHub', url: 'https://github.com' },
    ],
    screenshots: [
      unsplash('1558494949-ef010cbdcc31'),
      unsplash('1555949963-aa79dcee981c'),
      mock('SchemaSync', 'Drift report'),
      mock('SchemaSync', 'Migration timeline'),
    ],
  },
  {
    id: 'demo-3',
    title: 'Pulse',
    tagline: 'Observability for small teams',
    description:
      'Pulse gives indie teams Grafana-grade visibility without the ops overhead.\n\nOne dashboard for logs, metrics, and traces, with smart defaults that actually work out of the box.\n\nAI-assisted alert routing cuts noise by 60%, and the service map auto-discovers dependencies from OpenTelemetry spans.\n\nDeploy the agent in 30 seconds; no YAML archaeology required.',
    technologies: [
      'React',
      'TypeScript',
      'Python',
      'FastAPI',
      'Grafana',
      'Prometheus',
      'OpenTelemetry',
      'ClickHouse',
    ],
    domains: ['Artificial Intelligence'],
    focusAreas: ['Observability', 'LLMs'],
    posterUrl: unsplash('1551288049-bebda4e38f71'),
    videoUrl: 'https://cdn.coverr.co/videos/coverr-data-center-servers-5695/1080p.mp4',
    links: [
      { type: 'repo', label: 'GitHub', url: 'https://github.com' },
      { type: 'website', label: 'Docs', url: 'https://example.com/docs' },
    ],
    screenshots: [
      unsplash('1504868584819-f8e8b4b6d7e3'),
      unsplash('1518186285589-2f7649de83e0'),
      mock('Pulse', 'Alert routing'),
      mock('Pulse', 'Service map'),
      unsplash('1550751827-4bd374c3f58b'),
    ],
  },
];

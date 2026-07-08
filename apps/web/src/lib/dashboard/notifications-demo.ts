export type DashboardNotification = {
  id: string;
  type: 'project' | 'save' | 'recap' | 'activity';
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  href?: string;
};

export const DEMO_NOTIFICATIONS: DashboardNotification[] = [
  {
    id: 'n1',
    type: 'project',
    title: 'Jordan Lee shipped something new',
    body: 'PipelineX — deploy previews that never block the main branch.',
    time: '2h ago',
    unread: true,
    href: '/dashboard/preview/circle',
  },
  {
    id: 'n2',
    type: 'save',
    title: '12 new saves on your CodeCard',
    body: 'Most came from GitHub and QR scans at DevConf.',
    time: '5h ago',
    unread: true,
    href: '/dashboard/preview/analytics',
  },
  {
    id: 'n3',
    type: 'project',
    title: 'Samira Okonkwo updated Pulse',
    body: 'New demo video on her featured project.',
    time: 'Yesterday',
    unread: true,
    href: '/dashboard/preview/circle',
  },
  {
    id: 'n4',
    type: 'recap',
    title: 'Your weekly recap is ready',
    body: '1,284 profile views · +18% · DevFlow led project opens.',
    time: 'Mon',
    unread: false,
    href: '/dashboard/preview/analytics',
  },
  {
    id: 'n5',
    type: 'activity',
    title: 'QR scan at Berlin meetup',
    body: 'Someone opened DevFlow from your card.',
    time: '3 days ago',
    unread: false,
    href: '/dashboard/preview',
  },
];

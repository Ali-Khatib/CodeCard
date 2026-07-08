import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { DEMO_PROFILE } from '@/lib/projects/demo-data';

export type WorkspaceActivity = {
  id: string;
  text: string;
  time: string;
};

export type WorkspaceConnection = {
  id: string;
  name: string;
  role: string;
  company: string;
  metAt: string;
  date: string;
  source: 'NFC' | 'QR' | 'Conference' | 'LinkedIn' | 'Manual';
  note: string;
  followUp: 'none' | 'scheduled' | 'done';
  followUpDate?: string;
  avatarUrl?: string;
  tags: string[];
  lastViewed?: string;
};

export const DEMO_WORKSPACE = {
  displayName: DEMO_PROFILE.display_name,
  email: 'alex.chen@stripe.com',
  username: 'alexchen',
  avatarUrl: DEMO_PROFILE.avatar_url,
  profileSlug: 'demo',
  completion: 78,
  profileReach: 1284,
};

export const DEMO_OVERVIEW_ACTIVITY: WorkspaceActivity[] = [
  { id: '1', text: 'DevFlow opened from LinkedIn', time: '4m ago' },
  { id: '2', text: 'Profile viewed from GitHub', time: '22m ago' },
  { id: '3', text: 'Saved after DevConf', time: '1h ago' },
  { id: '4', text: 'QR scanned at Berlin meetup', time: '3h ago' },
  { id: '5', text: 'SchemaSync clicked from Twitter', time: '5h ago' },
];

export const DEMO_CONNECTIONS: WorkspaceConnection[] = [
  {
    id: 'c1',
    name: 'Jordan Lee',
    role: 'Staff Engineer',
    company: 'Vercel',
    metAt: 'DevConf SF',
    date: 'Jun 12, 2026',
    source: 'Conference',
    note: 'Interested in DevFlow CI story. Send case study.',
    followUp: 'scheduled',
    followUpDate: 'Jul 2, 2026',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    tags: ['hiring', 'infra'],
    lastViewed: '2 days ago',
  },
  {
    id: 'c2',
    name: 'Samira Okonkwo',
    role: 'Technical Recruiter',
    company: 'Stripe',
    metAt: 'NFC tap',
    date: 'Jun 8, 2026',
    source: 'NFC',
    note: 'Warm intro for platform team. Follow up after Pulse launch.',
    followUp: 'none',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    tags: ['recruiter'],
    lastViewed: 'Yesterday',
  },
  {
    id: 'c3',
    name: 'Chris Park',
    role: 'Founder',
    company: 'Stealth',
    metAt: 'LinkedIn DM',
    date: 'May 28, 2026',
    source: 'LinkedIn',
    note: 'Wants to collaborate on observability tooling.',
    followUp: 'done',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    tags: ['founder', 'partnership'],
    lastViewed: '1 week ago',
  },
  {
    id: 'c4',
    name: 'Elena Vasquez',
    role: 'Engineering Manager',
    company: 'Notion',
    metAt: 'QR at booth',
    date: 'May 20, 2026',
    source: 'QR',
    note: 'Asked about SchemaSync migration story.',
    followUp: 'scheduled',
    followUpDate: 'Jun 30, 2026',
    tags: ['manager'],
    lastViewed: '3 days ago',
  },
  {
    id: 'c5',
    name: 'Priya Shah',
    role: 'Product Designer',
    company: 'Figma',
    metAt: 'Manual entry',
    date: 'Jul 1, 2026',
    source: 'Manual',
    note: 'Met through mutual — interested in portfolio layout ideas.',
    followUp: 'none',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    tags: ['design', 'collab'],
    lastViewed: 'Today',
  },
  {
    id: 'c6',
    name: 'Marcus Webb',
    role: 'VP Engineering',
    company: 'Datadog',
    metAt: 'KubeCon hallway',
    date: 'Jun 22, 2026',
    source: 'Conference',
    note: 'Wants observability case study for platform team.',
    followUp: 'scheduled',
    followUpDate: 'Jul 12, 2026',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    tags: ['hiring', 'enterprise'],
    lastViewed: 'Yesterday',
  },
];

export const DEMO_PROFILE_LINKS: ProfileLinkItem[] = DEMO_PROFILE.links;

export const DEMO_SUGGESTED_STEP = {
  title: 'Add a demo video to DevFlow',
  detail: 'Profiles with hero video get 2.4× more project opens.',
  href: '/dashboard/projects',
};

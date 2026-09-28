import { LIVE_DEMO_WORKSPACE_HREF } from '@/lib/marketing/demo-url';

export type GuideShotId =
  | 'home-desk'
  | 'home-share'
  | 'home-identity'
  | 'home-calendar'
  | 'home-work'
  | 'home-reach'
  | 'home-circle'
  | 'work-projects'
  | 'work-project'
  | 'work-research'
  | 'connections-list'
  | 'connections-open'
  | 'circle-feed'
  | 'analytics-review'
  | 'analytics-reach'
  | 'analytics-projects'
  | 'analytics-research'
  | 'analytics-audience'
  | 'settings-identity'
  | 'settings-signin'
  | 'settings-plan'
  | 'settings-export';

export type GuideSectionId =
  | 'home'
  | 'work'
  | 'connections'
  | 'circle'
  | 'analytics'
  | 'settings';

export type GuideShot = {
  id: string;
  title: string;
  caption: string;
  shot: GuideShotId;
};

export type GuideSection = {
  id: GuideSectionId;
  nav: string;
  title: string;
  kicker: string;
  lead: string;
  points: string[];
  demoHref: string;
  demoLabel: string;
  shots: GuideShot[];
};

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'home',
    nav: 'Home',
    title: 'Home',
    kicker: '01 · Home',
    lead: 'Edit the card, share it, and keep the calendar. Visitors never see this page.',
    points: [
      'Greeting, public or private, and how complete the card is.',
      'Copy the link, show the QR, or preview the public page.',
      'Photo, headline, bio, links, and skills.',
      'Events and follow-ups on the selected day.',
      'Project and research counts. Open Your Work to edit them.',
      'Profile views and project opens. Full numbers are on Analytics.',
      'New work from people already in Connections.',
    ],
    demoHref: LIVE_DEMO_WORKSPACE_HREF,
    demoLabel: 'Open Home in the live demo',
    shots: [
      {
        id: 'home-desk',
        title: 'Greeting and next step',
        caption:
          'Public or private, how complete the card is, and the next action.',
        shot: 'home-desk',
      },
      {
        id: 'home-share',
        title: 'Share the card',
        caption: 'Copy the link, show the QR, or preview the public page.',
        shot: 'home-share',
      },
      {
        id: 'home-identity',
        title: 'Photo, name, and bio',
        caption: 'Photo, headline, bio, links, and skills. Visitors read this first.',
        shot: 'home-identity',
      },
      {
        id: 'home-calendar',
        title: 'Calendar',
        caption: 'Events and follow-ups for the day you pick.',
        shot: 'home-calendar',
      },
      {
        id: 'home-work',
        title: 'Projects and research',
        caption: 'Counts and recent items. Open Your Work to add or edit them.',
        shot: 'home-work',
      },
      {
        id: 'home-reach',
        title: 'Views this week',
        caption: 'Profile views and project opens. Full numbers are on Analytics.',
        shot: 'home-reach',
      },
      {
        id: 'home-circle',
        title: 'Latest from Circle',
        caption: 'New work from people you already connected with.',
        shot: 'home-circle',
      },
    ],
  },
  {
    id: 'work',
    nav: 'Work',
    title: 'Your Work',
    kicker: '02 · Work',
    lead: 'Projects first, then research. Published items go on the card. Drafts stay private.',
    points: [
      'Each project can carry a short story, images, a mini presentation, and the stack you used.',
      'Publish a project to show it on the public card.',
      'Research sits under projects on the same page.',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/work`,
    demoLabel: 'Open Your Work in the live demo',
    shots: [
      {
        id: 'work-projects',
        title: 'Project list',
        caption: 'Every project. Switch list or grid. Publish one to show it on the card.',
        shot: 'work-projects',
      },
      {
        id: 'work-project',
        title: 'A project page',
        caption: 'Story, screenshots, stack, and slides.',
        shot: 'work-project',
      },
      {
        id: 'work-research',
        title: 'Research list',
        caption: 'Papers sit under projects. Publish one to show it on the card.',
        shot: 'work-research',
      },
    ],
  },
  {
    id: 'connections',
    nav: 'Connections',
    title: 'Connections',
    kicker: '03 · Connections',
    lead: 'People appear here after they scan your QR. You cannot search for strangers.',
    points: [
      'A Connection is created only by a QR scan.',
      'Search, filter, set a follow-up, and keep a private note.',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/connections`,
    demoLabel: 'Open Connections in the live demo',
    shots: [
      {
        id: 'connections-list',
        title: 'The list',
        caption: 'Search, filters, upcoming follow-ups, then every person you met.',
        shot: 'connections-list',
      },
      {
        id: 'connections-open',
        title: 'One person',
        caption: 'Where you met, your note, the follow-up, and a link to their card.',
        shot: 'connections-open',
      },
    ],
  },
  {
    id: 'circle',
    nav: 'Circle',
    title: 'Circle',
    kicker: '04 · Circle',
    lead: 'New projects and papers from people already in Connections.',
    points: [
      'You only see work from Connections.',
      'Open a project or paper, or open the person.',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/circle`,
    demoLabel: 'Open Circle in the live demo',
    shots: [
      {
        id: 'circle-feed',
        title: 'The feed',
        caption: 'Filter by All, New, Projects, or Research. Open the work or the person.',
        shot: 'circle-feed',
      },
    ],
  },
  {
    id: 'analytics',
    nav: 'Analytics',
    title: 'Analytics',
    kicker: '05 · Analytics',
    lead: 'Who opened the card, what they clicked, and what to change next.',
    points: [
      'A plain-language review says which project to move up.',
      'Ask the coach a question. It answers from your numbers.',
      'Reach, project opens, paper opens, and inferred roles.',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/analytics`,
    demoLabel: 'Open Analytics in the live demo',
    shots: [
      {
        id: 'analytics-review',
        title: 'Review and coach',
        caption: 'A short review, then a chat that answers from your numbers.',
        shot: 'analytics-review',
      },
      {
        id: 'analytics-reach',
        title: 'Reach',
        caption: 'Views, guests, and where the card was opened.',
        shot: 'analytics-reach',
      },
      {
        id: 'analytics-projects',
        title: 'Projects',
        caption: 'Time on each project, saves, and finishes.',
        shot: 'analytics-projects',
      },
      {
        id: 'analytics-research',
        title: 'Papers',
        caption: 'Opens, PDF downloads, and citation copies.',
        shot: 'analytics-research',
      },
      {
        id: 'analytics-audience',
        title: 'Audience',
        caption: 'Inferred roles and recent activity.',
        shot: 'analytics-audience',
      },
    ],
  },
  {
    id: 'settings',
    nav: 'Settings',
    title: 'Settings',
    kicker: '06 · Settings',
    lead: 'Username, visibility, sign-in, plan, export, and delete. Edit photo and bio on Home.',
    points: [
      'Visibility decides whether a shared link or QR works.',
      'Sign-in, plan, export, and delete stay here.',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/settings`,
    demoLabel: 'Open Settings in the live demo',
    shots: [
      {
        id: 'settings-identity',
        title: 'Username and visibility',
        caption: 'Public address and whether the card is open. Photo and bio stay on Home.',
        shot: 'settings-identity',
      },
      {
        id: 'settings-signin',
        title: 'Sign-in',
        caption: 'Email, password, and GitHub.',
        shot: 'settings-signin',
      },
      {
        id: 'settings-plan',
        title: 'Plan',
        caption: 'Free or Pro.',
        shot: 'settings-plan',
      },
      {
        id: 'settings-export',
        title: 'Export or delete',
        caption: 'Download your data, or delete the account. Delete cannot be undone.',
        shot: 'settings-export',
      },
    ],
  },
];

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

export type GuideCapability = {
  title: string;
  body: string;
};

export type GuideCallout = {
  n: number;
  title: string;
  body: string;
  x: string;
  y: string;
};

export type GuideWorkflowStep = {
  title: string;
  caption: string;
  shot?: GuideShotId;
};

export type GuideDetail = {
  title: string;
  body: string;
  shot: GuideShotId;
};

export type GuideSection = {
  id: GuideSectionId;
  nav: string;
  glanceTitle: string;
  glanceBody: string;
  title: string;
  kicker: string;
  lead: string;
  canDo: GuideCapability[];
  overviewShot: GuideShotId;
  callouts: GuideCallout[];
  workflow?: {
    title: string;
    steps: GuideWorkflowStep[];
    result: string;
  };
  details: GuideDetail[];
  demoHref: string;
  demoLabel: string;
};

export const GUIDE_STORY = {
  title: 'From first impression to follow-up',
  steps: [
    'Build your identity',
    'Show your work',
    'Meet someone',
    'Exchange CodeCards',
    'Save the connection',
    'Remember the context',
    'Follow up',
    'Stay connected',
    'Keep building',
  ],
  close: 'CodeCard turns a quick introduction into something that can actually continue.',
} as const;

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'home',
    nav: 'Home',
    glanceTitle: 'Your Card',
    glanceBody: 'Your identity, public page, link, and QR.',
    title: 'Home',
    kicker: '01 · Home',
    lead: 'This is where you edit the card. Visitors never see this page. They see what you publish.',
    canDo: [
      {
        title: 'Build your profile',
        body: 'Photo, name, headline, bio, links, and skills — the identity people read first.',
      },
      {
        title: 'Share it',
        body: 'Copy the link, show the QR, or preview the public page.',
      },
      {
        title: 'Show your work',
        body: 'See project and research counts, then open Your Work to edit them.',
      },
      {
        title: 'Stay organized',
        body: 'Events and follow-ups sit on the calendar next to the person they belong to.',
      },
    ],
    overviewShot: 'home-identity',
    callouts: [
      { n: 1, title: 'Your profile', body: 'Photo, name, headline, and bio.', x: '14%', y: '18%' },
      { n: 2, title: 'Links and skills', body: 'What people tap after they open the card.', x: '14%', y: '52%' },
      { n: 3, title: 'Preview', body: 'How the public card looks before you share it.', x: '72%', y: '28%' },
    ],
    details: [
      {
        title: 'Greeting and next step',
        body: 'Public or private, how complete the card is, and the next action.',
        shot: 'home-desk',
      },
      {
        title: 'Link and QR',
        body: 'Copy the link, show the QR, or preview the public page. A scan is how a Connection is created.',
        shot: 'home-share',
      },
      {
        title: 'Calendar',
        body: 'Events and follow-ups for the day you pick.',
        shot: 'home-calendar',
      },
      {
        title: 'Projects and research',
        body: 'Counts and recent items. Open Your Work to add or edit them.',
        shot: 'home-work',
      },
      {
        title: 'Views this week',
        body: 'Profile views and project opens. Full numbers are on Analytics.',
        shot: 'home-reach',
      },
      {
        title: 'Latest from Circle',
        body: 'New work from people you already connected with.',
        shot: 'home-circle',
      },
    ],
    demoHref: LIVE_DEMO_WORKSPACE_HREF,
    demoLabel: 'Open Home in the live demo',
  },
  {
    id: 'work',
    nav: 'Work',
    glanceTitle: 'Your Work',
    glanceBody: 'Projects and research you want people to see.',
    title: 'Your Work',
    kicker: '02 · Work',
    lead: 'Build a project, tell the story, then publish it. Drafts stay private.',
    canDo: [
      {
        title: 'Add a project',
        body: 'Title, story, screenshots, stack, links, and slides.',
      },
      {
        title: 'Add research',
        body: 'Papers sit under projects on the same page.',
      },
      {
        title: 'Publish',
        body: 'Published items appear on the public card. Drafts do not.',
      },
      {
        title: 'Switch layout',
        body: 'List is the default. Grid is there if you want it.',
      },
    ],
    overviewShot: 'work-projects',
    callouts: [
      { n: 1, title: 'Projects', body: 'Everything you have built.', x: '18%', y: '22%' },
      { n: 2, title: 'Published or draft', body: 'Only published items go on the card.', x: '78%', y: '38%' },
      { n: 3, title: 'Research', body: 'Papers live on this same page, under projects.', x: '18%', y: '78%' },
    ],
    workflow: {
      title: 'From a blank project to the card',
      steps: [
        {
          title: 'Build',
          caption: 'Create a project. It starts as a draft.',
          shot: 'work-projects',
        },
        {
          title: 'Tell the story',
          caption: 'Screenshots, stack, description, links, and slides.',
          shot: 'work-project',
        },
        {
          title: 'Publish',
          caption: 'Make it part of the public card. Drafts stay here.',
          shot: 'work-projects',
        },
        {
          title: 'Showcase',
          caption: 'Someone who opens your card can open the project from there.',
          shot: 'home-work',
        },
      ],
      result: 'A visitor does not just get a name. They can open the work you chose to show.',
    },
    details: [
      {
        title: 'A project page',
        body: 'Story, screenshots, stack, and slides. This is what a visitor sees after they tap a project.',
        shot: 'work-project',
      },
      {
        title: 'Research list',
        body: 'Papers sit under projects. Publish one to show it on the card.',
        shot: 'work-research',
      },
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/work`,
    demoLabel: 'Open Your Work in the live demo',
  },
  {
    id: 'connections',
    nav: 'Connections',
    glanceTitle: 'Your Connections',
    glanceBody: 'People who scan your QR, plus notes and follow-ups.',
    title: 'Connections',
    kicker: '03 · Connections',
    lead: 'People appear here after they scan your QR. You cannot search for strangers.',
    canDo: [
      {
        title: 'Meet in person',
        body: 'A Connection is created when someone scans your QR.',
      },
      {
        title: 'Save the context',
        body: 'Where you met, a private note, and the date.',
      },
      {
        title: 'Plan a follow-up',
        body: 'Set the next conversation so it does not live in another app.',
      },
      {
        title: 'Open their card',
        body: 'Go back to their public CodeCard when you need the work they showed you.',
      },
    ],
    overviewShot: 'connections-list',
    callouts: [
      { n: 1, title: 'Search and filters', body: 'Find someone by name, meeting point, or place.', x: '22%', y: '16%' },
      { n: 2, title: 'Follow-ups', body: 'Upcoming follow-ups sit at the top.', x: '22%', y: '36%' },
      { n: 3, title: 'The list', body: 'Everyone who scanned your QR.', x: '22%', y: '62%' },
    ],
    workflow: {
      title: 'Meet someone',
      steps: [
        {
          title: 'Show your QR',
          caption: 'Open Home and let them scan your CodeCard.',
          shot: 'home-share',
        },
        {
          title: 'They scan it',
          caption: 'CodeCard creates the Connection. There is no directory search.',
        },
        {
          title: 'They appear here',
          caption: 'Name, meeting point, and any follow-up you set.',
          shot: 'connections-list',
        },
        {
          title: 'Add context',
          caption: 'Where you met, your private note, and the date.',
          shot: 'connections-open',
        },
        {
          title: 'Plan the follow-up',
          caption: 'Pick the next date. It also shows on Home’s calendar.',
          shot: 'home-calendar',
        },
      ],
      result:
        'You do not just have a name. You remember who they are, where you met, what you talked about, and what to do next.',
    },
    details: [
      {
        title: 'One person',
        body: 'Where you met, your note, the follow-up, and a link to their card.',
        shot: 'connections-open',
      },
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/connections`,
    demoLabel: 'Open Connections in the live demo',
  },
  {
    id: 'circle',
    nav: 'Circle',
    glanceTitle: 'Your Circle',
    glanceBody: 'What your connections publish after you meet.',
    title: 'Circle',
    kicker: '04 · Circle',
    lead: 'New projects and papers from people already in Connections. Not a public feed.',
    canDo: [
      {
        title: 'See new work',
        body: 'Only from people you already met.',
      },
      {
        title: 'Open a project or paper',
        body: 'See what they published after you connected.',
      },
      {
        title: 'Go back to the person',
        body: 'Open their card if you want to follow up.',
      },
    ],
    overviewShot: 'circle-feed',
    callouts: [
      { n: 1, title: 'Filters', body: 'All, New, Projects, or Research.', x: '18%', y: '12%' },
      { n: 2, title: 'The person', body: 'Someone already in Connections.', x: '18%', y: '28%' },
      { n: 3, title: 'The work', body: 'A project or paper they published.', x: '55%', y: '58%' },
    ],
    details: [],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/circle`,
    demoLabel: 'Open Circle in the live demo',
  },
  {
    id: 'analytics',
    nav: 'Analytics',
    glanceTitle: 'Your Analytics',
    glanceBody: 'How the card and the work on it are being viewed.',
    title: 'Analytics',
    kicker: '05 · Analytics',
    lead: 'Who opened the card, what they clicked, and what to change next.',
    canDo: [
      {
        title: 'Read the review',
        body: 'A short read of what the traffic means, including which project to lead with.',
      },
      {
        title: 'Ask the coach',
        body: 'Ask a question. It answers from your numbers.',
      },
      {
        title: 'See what they opened',
        body: 'Projects, papers, and outbound links.',
      },
      {
        title: 'See who opened it',
        body: 'Inferred roles and recent activity.',
      },
    ],
    overviewShot: 'analytics-review',
    callouts: [
      { n: 1, title: 'The review', body: 'What the traffic means, in plain words.', x: '22%', y: '22%' },
      { n: 2, title: 'The coach', body: 'Ask “Which project should I put first?”', x: '22%', y: '62%' },
    ],
    details: [
      {
        title: 'Reach',
        body: 'Views, guests, and where the card was opened.',
        shot: 'analytics-reach',
      },
      {
        title: 'Projects',
        body: 'Time on each project, saves, and finishes.',
        shot: 'analytics-projects',
      },
      {
        title: 'Papers',
        body: 'Opens, PDF downloads, and citation copies.',
        shot: 'analytics-research',
      },
      {
        title: 'Audience',
        body: 'Inferred roles and recent activity.',
        shot: 'analytics-audience',
      },
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/analytics`,
    demoLabel: 'Open Analytics in the live demo',
  },
  {
    id: 'settings',
    nav: 'Settings',
    glanceTitle: 'Your Settings',
    glanceBody: 'Account, visibility, plan, and data.',
    title: 'Settings',
    kicker: '06 · Settings',
    lead: 'Username, visibility, sign-in, plan, export, and delete. Edit photo and bio on Home.',
    canDo: [
      {
        title: 'Public or private',
        body: 'Whether the link and QR work for visitors.',
      },
      {
        title: 'Sign-in',
        body: 'Email, password, and GitHub.',
      },
      {
        title: 'Plan',
        body: 'Free or Pro.',
      },
      {
        title: 'Export or delete',
        body: 'Download your data, or delete the account. Delete cannot be undone.',
      },
    ],
    overviewShot: 'settings-identity',
    callouts: [
      { n: 1, title: 'Username', body: 'The public address for the card.', x: '58%', y: '28%' },
      { n: 2, title: 'Visibility', body: 'Published or private.', x: '58%', y: '48%' },
      { n: 3, title: 'Categories', body: 'Sign-in, plan, export, and delete.', x: '18%', y: '42%' },
    ],
    details: [
      {
        title: 'Sign-in',
        body: 'Email, password, and GitHub.',
        shot: 'settings-signin',
      },
      {
        title: 'Plan',
        body: 'Free or Pro.',
        shot: 'settings-plan',
      },
      {
        title: 'Export or delete',
        body: 'Download your data, or delete the account. Delete cannot be undone.',
        shot: 'settings-export',
      },
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/settings`,
    demoLabel: 'Open Settings in the live demo',
  },
];

export function guideCoveredShots(): GuideShotId[] {
  const seen = new Set<GuideShotId>();
  for (const section of GUIDE_SECTIONS) {
    seen.add(section.overviewShot);
    for (const step of section.workflow?.steps ?? []) {
      if (step.shot) seen.add(step.shot);
    }
    for (const detail of section.details) seen.add(detail.shot);
  }
  return [...seen];
}

import { LIVE_DEMO_WORKSPACE_HREF } from '@/lib/marketing/demo-url';

export type GuideShotId =
  | 'home-overview'
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

export type GuideGroup = {
  title: string;
  body: string;
};

export type GuideGalleryShot = {
  title: string;
  body: string;
  shot: GuideShotId;
};

export type GuideWorkflowStep = {
  title: string;
  caption: string;
};

export type GuideSection = {
  id: GuideSectionId;
  nav: string;
  glanceTitle: string;
  glanceBody: string;
  kicker: string;
  title: string;
  lead: string;
  overviewShot: GuideShotId;
  canDoHeading: string;
  canDo: GuideCapability[];
  principle?: { title: string; body: string };
  workflow?: {
    title: string;
    steps: GuideWorkflowStep[];
    result: string;
  };
  groups?: GuideGroup[];
  aside?: { title: string; body: string };
  gallery?: GuideGalleryShot[];
  coveredShots: GuideShotId[];
  demoHref: string;
  demoLabel: string;
  quiet?: boolean;
};

export const GUIDE_CLOSE = {
  title: 'A meeting that can continue',
  body: 'CodeCard turns a quick introduction into something that can actually continue.',
} as const;

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'home',
    nav: 'Home',
    glanceTitle: 'Your Card',
    glanceBody: 'Build the profile people see.',
    kicker: '01 · Home',
    title: 'Your CodeCard, at a glance',
    lead: 'Manage your card, share it, and keep track of what’s happening.',
    overviewShot: 'home-overview',
    canDoHeading: 'What you can do',
    canDo: [
      {
        title: 'Build your profile',
        body: 'Photo, name, headline, bio, links, and skills.',
      },
      {
        title: 'Share your card',
        body: 'Copy the public link, use the share sheet, or show your QR. A link lets someone view the card — it does not create a Connection.',
      },
      {
        title: 'Manage your calendar',
        body: 'Events and follow-ups for the day you pick.',
      },
      {
        title: 'Show your work',
        body: 'See projects and research that appear on your public card.',
      },
      {
        title: 'See recent activity',
        body: 'Views this week, and new work from Circle.',
      },
      {
        title: 'Know what’s next',
        body: 'Whether the card is public, how complete it is, and the next useful action.',
      },
    ],
    coveredShots: [
      'home-overview',
      'home-desk',
      'home-share',
      'home-identity',
      'home-calendar',
      'home-work',
      'home-reach',
      'home-circle',
    ],
    demoHref: LIVE_DEMO_WORKSPACE_HREF,
    demoLabel: 'Open Home in the live demo',
  },
  {
    id: 'work',
    nav: 'Work',
    glanceTitle: 'Your Work',
    glanceBody: 'Showcase projects and research.',
    kicker: '02 · Work',
    title: 'Show people what you actually build',
    lead: 'Create projects and research that can become part of your public CodeCard.',
    overviewShot: 'work-projects',
    canDoHeading: 'What you can do',
    canDo: [
      {
        title: 'Create projects',
        body: 'Add, edit, and organize everything you have built.',
      },
      {
        title: 'Tell the story',
        body: 'Screenshots, stack, description, links, and slides.',
      },
      {
        title: 'Keep research nearby',
        body: 'Papers live on the same page, under projects.',
      },
      {
        title: 'Choose list or grid',
        body: 'List is the default. Grid is there if you want it.',
      },
    ],
    groups: [
      {
        title: 'Projects',
        body: 'Create and organize projects in list or grid view. Publish them when you’re ready for them to appear on your CodeCard.',
      },
      {
        title: 'Project pages',
        body: 'Each project can show the story, screenshots, technology stack, links, and slides — what someone sees after they tap it on your card.',
      },
      {
        title: 'Research',
        body: 'Keep papers alongside your projects and publish them to your card.',
      },
      {
        title: 'Drafts vs published',
        body: 'Drafts stay private. Published work appears on your public card.',
      },
    ],
    gallery: [
      {
        title: 'A project page',
        body: 'The story, screenshots, stack, and slides.',
        shot: 'work-project',
      },
      {
        title: 'Research',
        body: 'Papers sit under projects. Publish one to show it on the card.',
        shot: 'work-research',
      },
    ],
    coveredShots: ['work-projects', 'work-project', 'work-research'],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/work`,
    demoLabel: 'Open Your Work in the live demo',
  },
  {
    id: 'connections',
    nav: 'Connections',
    glanceTitle: 'Connections',
    glanceBody: 'Keep track of people you’ve met.',
    kicker: '03 · Connections',
    title: 'Turn a meeting into something you can follow up on',
    lead: 'Save the people you meet, remember the context, and plan the next conversation.',
    overviewShot: 'connections-list',
    canDoHeading: 'What you can do',
    principle: {
      title: 'Connections happen through QR scans.',
      body: 'A public link lets someone view a CodeCard. A QR scan is what allows the connection flow. There is no directory of strangers.',
    },
    workflow: {
      title: 'How a Connection starts',
      steps: [
        {
          title: 'Scan QR',
          caption: 'Open a CodeCard QR in person — yours or theirs.',
        },
        {
          title: 'Open CodeCard',
          caption: 'The public card opens from that scan.',
        },
        {
          title: 'Connect',
          caption: 'Save them. The other person can accept and add you too.',
        },
        {
          title: 'Add context',
          caption: 'Where you met, when, and a private note if you want.',
        },
        {
          title: 'Follow up',
          caption: 'Set, edit, or remove a follow-up. It also shows on Home.',
        },
      ],
      result:
        'You remember who they are, where you met, what you talked about, and what to do next.',
    },
    canDo: [
      {
        title: 'People you’ve met',
        body: 'Your connection list — everyone saved from a QR scan.',
      },
      {
        title: 'Meeting context',
        body: 'Where you met and when. You can edit this anytime.',
      },
      {
        title: 'Notes',
        body: 'A private note so you remember what you talked about.',
      },
      {
        title: 'Follow-ups',
        body: 'Add, edit, or remove the next date so it does not live in another app.',
      },
      {
        title: 'Their CodeCard',
        body: 'Open their public card again when you need the work they showed you.',
      },
    ],
    gallery: [
      {
        title: 'One person',
        body: 'Where you met, your note, the follow-up, and a link to their card.',
        shot: 'connections-open',
      },
    ],
    coveredShots: ['connections-list', 'connections-open', 'home-share'],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/connections`,
    demoLabel: 'Open Connections in the live demo',
  },
  {
    id: 'circle',
    nav: 'Circle',
    glanceTitle: 'Circle',
    glanceBody: 'See what your connections are building.',
    kicker: '04 · Circle',
    title: 'Keep up with the people you’ve met',
    lead: 'New projects and papers from people already in Connections. Not a public feed.',
    overviewShot: 'circle-feed',
    canDoHeading: 'What you can do',
    canDo: [
      {
        title: 'See new work',
        body: 'Projects published by people you’ve connected with.',
      },
      {
        title: 'See new research',
        body: 'Papers from those same people.',
      },
      {
        title: 'Filter',
        body: 'All, New, Projects, or Research.',
      },
      {
        title: 'Open their work',
        body: 'Jump into a project, paper, or their public card.',
      },
    ],
    aside: {
      title: 'Connections and Circle',
      body: 'Connections are the people you’ve met. Circle is what those people are doing afterward.',
    },
    coveredShots: ['circle-feed'],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/circle`,
    demoLabel: 'Open Circle in the live demo',
  },
  {
    id: 'analytics',
    nav: 'Analytics',
    glanceTitle: 'Analytics',
    glanceBody: 'Understand how people interact with your card.',
    kicker: '05 · Analytics',
    title: 'Understand what happens after you share your card',
    lead: 'Who opened it, what they clicked, and what to change next.',
    overviewShot: 'analytics-review',
    canDoHeading: 'What you can do',
    canDo: [
      {
        title: 'Review & Coach',
        body: 'A short read of the traffic, plus questions answered from your numbers.',
      },
      {
        title: 'Reach',
        body: 'Views, guests, and where the card was opened.',
      },
      {
        title: 'Projects',
        body: 'Time on each project, saves, and finishes.',
      },
      {
        title: 'Research',
        body: 'Opens, PDF downloads, and citation copies.',
      },
      {
        title: 'Audience',
        body: 'Inferred roles and recent activity.',
      },
    ],
    coveredShots: [
      'analytics-review',
      'analytics-reach',
      'analytics-projects',
      'analytics-research',
      'analytics-audience',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/analytics`,
    demoLabel: 'Open Analytics in the live demo',
  },
  {
    id: 'settings',
    nav: 'Settings',
    glanceTitle: 'Settings',
    glanceBody: 'Manage your account and preferences.',
    kicker: '06 · Settings',
    title: 'Manage your CodeCard',
    lead: 'Username, visibility, sign-in, plan, and your data. Edit photo and bio on Home.',
    overviewShot: 'settings-identity',
    canDoHeading: 'What you can do',
    canDo: [
      {
        title: 'Username & visibility',
        body: 'The public address, and whether the link and QR work for visitors.',
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
        title: 'Export',
        body: 'Download a copy of your data.',
      },
      {
        title: 'Delete account',
        body: 'Permanently delete the account. This cannot be undone.',
      },
    ],
    coveredShots: [
      'settings-identity',
      'settings-signin',
      'settings-plan',
      'settings-export',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/settings`,
    demoLabel: 'Open Settings in the live demo',
    quiet: true,
  },
];

export function guideCoveredShots(): GuideShotId[] {
  const seen = new Set<GuideShotId>();
  for (const section of GUIDE_SECTIONS) {
    seen.add(section.overviewShot);
    for (const shot of section.coveredShots) seen.add(shot);
    for (const item of section.gallery ?? []) seen.add(item.shot);
  }
  return [...seen];
}

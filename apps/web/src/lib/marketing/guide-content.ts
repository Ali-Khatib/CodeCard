import { LIVE_DEMO_WORKSPACE_HREF } from '@/lib/marketing/demo-url';

export type GuideShotId =
  | 'home-desk'
  | 'home-identity'
  | 'home-share'
  | 'home-calendar'
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
    title: 'Home is where you run your CodeCard',
    kicker: '01 · Home',
    lead:
      'This is the desk. Visitors never see it. You edit the card here, then publish what they should see.',
    points: [
      'Edit your photo, headline, bio, links, and skills. That is the identity on the card.',
      'Watch profile completion until it hits 100%, then Home suggests the next useful step.',
      'Preview and share the public CodeCard. The QR on that card is how people save you.',
      'Calendar and follow-ups sit on the same page, so the next conversation is not lost in another app.',
    ],
    demoHref: LIVE_DEMO_WORKSPACE_HREF,
    demoLabel: 'Open Home in the live demo',
    shots: [
      {
        id: 'home-desk',
        title: 'Start at the desk',
        caption:
          'Greeting, how complete the card is, and the next step. Stay here until the card is ready to share.',
        shot: 'home-desk',
      },
      {
        id: 'home-identity',
        title: 'Write who you are',
        caption:
          'Photo, headline, bio, links, and skills. This is the first thing a visitor reads on the card.',
        shot: 'home-identity',
      },
      {
        id: 'home-share',
        title: 'Share the card they scan',
        caption:
          'Copy the link, show the QR, and preview the public CodeCard. A scan is how a Connection is created.',
        shot: 'home-share',
      },
      {
        id: 'home-calendar',
        title: 'Keep the next meeting here',
        caption:
          'Pick a day. Events and follow-ups sit next to the person, so the next conversation is not lost.',
        shot: 'home-calendar',
      },
    ],
  },
  {
    id: 'work',
    nav: 'Work',
    title: 'Your Work holds projects and research',
    kicker: '02 · Work',
    lead:
      'Projects first. Then open one. Then research. Publish what visitors should open. Drafts stay private.',
    points: [
      'Each project can carry a short story, images, a mini presentation, and the stack you used.',
      'Add screenshots and a hero so people can see the product, not just the repo link.',
      'Research sits beside projects when a paper is part of the same introduction.',
      'Publish at least one project so the public card has real work to show.',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/work`,
    demoLabel: 'Open Your Work in the live demo',
    shots: [
      {
        id: 'work-projects',
        title: 'Projects in a list',
        caption:
          'This is the first view. Publish what people should open from the card. Drafts stay private.',
        shot: 'work-projects',
      },
      {
        id: 'work-project',
        title: 'Open a project',
        caption:
          'Story, screenshots, the stack, and the mini presentation. This is what a visitor sees after they tap a project.',
        shot: 'work-project',
      },
      {
        id: 'work-research',
        title: 'Then research',
        caption:
          'Papers sit under projects when a paper is part of the same introduction.',
        shot: 'work-research',
      },
    ],
  },
  {
    id: 'connections',
    nav: 'Connections',
    title: 'Connections are people you actually met',
    kicker: '03 · Connections',
    lead:
      'CodeCard does not let you search for strangers and add them. A Connection is created when someone scans your QR. After that, you keep the context so the follow-up is easy.',
    points: [
      'Connections can only be made through a QR scan, not a cold invite or a directory search.',
      'Register a follow-up, keep a private note, and remember the meeting point.',
      'Filter by where you met or where they are, so the list stays useful after a busy week.',
      'Open their public CodeCard again when you need to remember the work they showed you.',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/connections`,
    demoLabel: 'Open Connections in the live demo',
    shots: [
      {
        id: 'connections-list',
        title: 'People you actually met',
        caption:
          'List first. A Connection only appears after someone scans your QR. Upcoming follow-ups sit at the top.',
        shot: 'connections-list',
      },
      {
        id: 'connections-open',
        title: 'Open one person',
        caption:
          'Where you met, your private note, the follow-up, and a way back to their CodeCard.',
        shot: 'connections-open',
      },
    ],
  },
  {
    id: 'circle',
    nav: 'Circle',
    title: 'Circle is new work from people you already know',
    kicker: '04 · Circle',
    lead:
      'Circle is not a social feed you browse for strangers. It is a quiet list of new projects and papers from people you have already connected with.',
    points: [
      'You only see work from Connections, so the list stays small and useful.',
      'Open a piece of work, then go back to the person if you want to follow up.',
      'If Circle is empty, connect with someone in person first. The scan comes before the feed.',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/circle`,
    demoLabel: 'Open Circle in the live demo',
    shots: [
      {
        id: 'circle-feed',
        title: 'New work from people you know',
        caption:
          'Projects and papers from Connections only. If this is empty, scan someone in person first.',
        shot: 'circle-feed',
      },
    ],
  },
  {
    id: 'analytics',
    nav: 'Analytics',
    title: 'Analytics turns looks into a decision',
    kicker: '05 · Analytics',
    lead:
      'After the introduction you can see whether people opened the card, clicked a project, or used a link. The review and the coach sit at the top so the numbers become a next move, not a chart to stare at.',
    points: [
      'Profile views and project opens tell you if the card was actually used.',
      'A plain-language review says which project to move up, and what the traffic means.',
      'Ask the coach a question. It stays on your numbers and answers in decisions: what to lead with, what to leave.',
      'Link clicks show which outbound links visitors trusted.',
      'Use it to decide what to publish next, not to chase vanity numbers.',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/analytics`,
    demoLabel: 'Open Analytics in the live demo',
    shots: [
      {
        id: 'analytics-review',
        title: 'Read the review, then ask',
        caption:
          'Plain words first. Then ask the coach. Try “Which project should I put first?”',
        shot: 'analytics-review',
      },
      {
        id: 'analytics-reach',
        title: 'How people found the card',
        caption: 'Reach, visits, guests, and where the card was opened.',
        shot: 'analytics-reach',
      },
      {
        id: 'analytics-projects',
        title: 'Which projects they open',
        caption: 'Time on the page, saves, and which project people actually finish.',
        shot: 'analytics-projects',
      },
      {
        id: 'analytics-research',
        title: 'Which papers they open',
        caption: 'Opens, PDF downloads, and citation copies for the papers on the card.',
        shot: 'analytics-research',
      },
      {
        id: 'analytics-audience',
        title: 'Who opened it',
        caption: 'Roles inferred from the visit, plus the latest activity.',
        shot: 'analytics-audience',
      },
    ],
  },
  {
    id: 'settings',
    nav: 'Settings',
    title: 'Settings is the quiet control room',
    kicker: '06 · Settings',
    lead:
      'Publish or keep the card private. Change how the workspace looks. Manage the account. Nothing here is the introduction. It just keeps the card safe and usable.',
    points: [
      'Visibility decides whether a shared link or QR works for visitors.',
      'Appearance is for you in the workspace, not a second public brand.',
      'Account tools cover sign-in, export, and deletion when you need them.',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/settings`,
    demoLabel: 'Open Settings in the live demo',
    shots: [
      {
        id: 'settings-identity',
        title: 'Visibility and username',
        caption:
          'Username and whether the card is public. The photo and bio are edited on Home, not here.',
        shot: 'settings-identity',
      },
      {
        id: 'settings-signin',
        title: 'How you sign in',
        caption: 'Email, password, and GitHub. Visitors never see this.',
        shot: 'settings-signin',
      },
      {
        id: 'settings-plan',
        title: 'Plan and billing',
        caption: 'Free or Pro. This is billing, not the public card.',
        shot: 'settings-plan',
      },
      {
        id: 'settings-export',
        title: 'Export or delete',
        caption: 'Download a copy of your data, or delete the account. Deletion cannot be undone.',
        shot: 'settings-export',
      },
    ],
  },
];

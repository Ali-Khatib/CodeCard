import {
  LIVE_DEMO_PROFILE_HREF,
  LIVE_DEMO_WORKSPACE_HREF,
} from '@/lib/marketing/demo-url';

export type GuideFrameState =
  | 'profile'
  | 'projects'
  | 'research'
  | 'circle'
  | 'connections'
  | 'analysis'
  | 'settings';

export type GuideSectionId =
  | 'home'
  | 'work'
  | 'connections'
  | 'circle'
  | 'analytics'
  | 'settings';

export type GuideSection = {
  id: GuideSectionId;
  nav: string;
  title: string;
  kicker: string;
  lead: string;
  points: string[];
  demoHref: string;
  demoLabel: string;
  frame?: GuideFrameState;
  extra?: {
    title: string;
    body: string;
    href: string;
    hrefLabel: string;
  };
};

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'home',
    nav: 'Home',
    title: 'Home is where you run your CodeCard',
    kicker: 'Home',
    lead:
      'This is the desk. Edit who you are, see how the public card looks, and keep the next meeting next to the person. Visitors never see this screen. They see the CodeCard you publish.',
    points: [
      'Edit your photo, headline, bio, links, and skills. That is the identity on the card.',
      'Watch profile completion until it hits 100%, then Home suggests the next useful step.',
      'Preview and share the public CodeCard. The QR on that card is how people save you.',
      'Calendar and follow-ups sit on the same page, so the next conversation is not lost in another app.',
    ],
    demoHref: LIVE_DEMO_WORKSPACE_HREF,
    demoLabel: 'Open Home in the live demo',
    frame: 'profile',
    extra: {
      title: 'The CodeCard people actually scan',
      body:
        'When someone opens your public card or scans your QR, they get the visitor view: your face, your work, and a way to connect. That scan is the only way a Connection is created.',
      href: LIVE_DEMO_PROFILE_HREF,
      hrefLabel: 'Open the public CodeCard',
    },
  },
  {
    id: 'work',
    nav: 'Work',
    title: 'Your Work holds projects and research',
    kicker: 'Your Work',
    lead:
      'One place for what you ship. Projects first, then papers. Publish what visitors should open from your card. Drafts stay private until you say otherwise.',
    points: [
      'Each project can carry a short story, images, a mini presentation, and the stack you used.',
      'Add screenshots and a hero so people can see the product, not just the repo link.',
      'Research sits beside projects when a paper is part of the same introduction.',
      'Publish at least one project so the public card has real work to show.',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/work`,
    demoLabel: 'Open Your Work in the live demo',
    frame: 'projects',
  },
  {
    id: 'connections',
    nav: 'Connections',
    title: 'Connections are people you actually met',
    kicker: 'Connections',
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
    frame: 'connections',
  },
  {
    id: 'circle',
    nav: 'Circle',
    title: 'Circle is new work from people you already know',
    kicker: 'Circle',
    lead:
      'Circle is not a social feed you browse for strangers. It is a quiet list of new projects and papers from people you have already connected with.',
    points: [
      'You only see work from Connections, so the list stays small and useful.',
      'Open a piece of work, then go back to the person if you want to follow up.',
      'If Circle is empty, connect with someone in person first. The scan comes before the feed.',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/circle`,
    demoLabel: 'Open Circle in the live demo',
    frame: 'circle',
  },
  {
    id: 'analytics',
    nav: 'Analytics',
    title: 'Analytics shows how people used the card',
    kicker: 'Analytics',
    lead:
      'After the introduction, you can see whether people opened the card, clicked a project, or used a link. It is a glance, not a growth dashboard.',
    points: [
      'Profile views and project opens tell you if the card was actually used.',
      'A plain-language review says which project to move up, and what the traffic means.',
      'Link clicks show which outbound links visitors trusted.',
      'Use it to decide what to publish next, not to chase vanity numbers.',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/analytics`,
    demoLabel: 'Open Analytics in the live demo',
    frame: 'analysis',
  },
  {
    id: 'settings',
    nav: 'Settings',
    title: 'Settings is the quiet control room',
    kicker: 'Settings',
    lead:
      'Publish or keep the card private. Change how the workspace looks. Manage the account. Nothing here is the introduction. It just keeps the card safe and usable.',
    points: [
      'Visibility decides whether a shared link or QR works for visitors.',
      'Appearance is for you in the workspace, not a second public brand.',
      'Account tools cover sign-in, export, and deletion when you need them.',
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/settings`,
    demoLabel: 'Open Settings in the live demo',
    frame: 'settings',
  },
];

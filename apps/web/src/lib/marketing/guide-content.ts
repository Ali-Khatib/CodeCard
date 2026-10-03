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

/** Percent box inside the screenshot stage. */
export type GuideSpot = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type GuideScreen = {
  shot: GuideShotId;
  tab: string;
  callout: string;
  body: string;
  /** Visible text in the live screen that the highlight must land on. */
  anchor: string;
  spot: GuideSpot;
};

export type GuideSection = {
  id: GuideSectionId;
  nav: string;
  kicker: string;
  glanceTitle: string;
  glance: string;
  title: string;
  lead: string;
  canDoHeading: 'What you can do';
  canDo: GuideCapability[];
  screens: GuideScreen[];
  demoHref: string;
};

export const GUIDE_FLOW = [
  { n: '01', title: 'Build your card', body: 'Create your professional identity.' },
  { n: '02', title: 'Meet someone', body: 'A conference, university, meetup, interview, or event.' },
  { n: '03', title: 'Share your QR', body: 'They scan your CodeCard.' },
  { n: '04', title: 'Show your work', body: 'They see your projects, research, and links.' },
  { n: '05', title: 'Save the connection', body: 'Keep the person in your network.' },
  { n: '06', title: 'Remember the context', body: 'Where you met, what you discussed, private notes.' },
  { n: '07', title: 'Follow up', body: 'Remember to reconnect later.' },
] as const;

export const GUIDE_CLOSE = {
  title: "That's CodeCard.",
  body: 'Your professional identity for the moments that happen offline.',
  points: ['Build your card.', 'Show your work.', 'Meet people.', 'Remember the connection.'],
};

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'home',
    nav: 'Home',
    kicker: '01 · Home',
    glanceTitle: 'Your Card',
    glance: 'Your professional identity',
    title: 'Your professional introduction.',
    lead: 'Home is where you build the card people open. Name, headline, bio, skills, and links live here. Photo and bio are edited on Home, not in Settings.',
    canDoHeading: 'What you can do',
    canDo: [
      {
        title: 'Edit your card',
        body: 'Set the name, headline, bio, skills, and links visitors see.',
      },
      {
        title: 'Share your card',
        body: 'Show a QR code or copy the public link. Copying the link does not create a Connection. No app download required.',
      },
    ],
    screens: [
      {
        shot: 'home-identity',
        tab: 'Home',
        callout: 'This is your public card',
        body: 'This is the identity you hand someone digitally. They do not need an app or an account to view it.',
        anchor: 'How people see you',
        spot: { x: 8, y: 18, w: 84, h: 62 },
      },
      {
        shot: 'home-share',
        tab: 'Home',
        callout: 'Share your CodeCard',
        body: 'In person, they scan your QR and your public card opens. No app download required. Copying the public link does not create a Connection.',
        anchor: 'Get your QR code',
        spot: { x: 10, y: 16, w: 80, h: 58 },
      },
    ],
    demoHref: LIVE_DEMO_WORKSPACE_HREF,
  },
  {
    id: 'work',
    nav: 'Work',
    kicker: '02 · Work',
    glanceTitle: 'Your Work',
    glance: 'Projects and research',
    title: 'Show what you actually do.',
    lead: 'Saying “I am an AI engineer” is a label. Your Work is the proof: projects you built and research you published. Open a project to edit it, attach slides, and keep it a draft or publish it.',
    canDoHeading: 'What you can do',
    canDo: [
      { title: 'Projects', body: 'Add the things you have built, with links and media.' },
      { title: 'Project pages', body: 'Open one project to edit the page, including slides.' },
      { title: 'Research', body: 'Add papers and research projects beside your builds.' },
      { title: 'Drafts vs published', body: 'Drafts stay private. Published work appears on your public card.' },
    ],
    screens: [
      {
        shot: 'work-projects',
        tab: 'Work',
        callout: 'Your work lives here',
        body: 'Projects are the first thing someone can open after they scan you.',
        anchor: 'DevFlow',
        spot: { x: 7, y: 24, w: 86, h: 62 },
      },
      {
        shot: 'work-research',
        tab: 'Work',
        callout: 'Research sits with the builds',
        body: 'Papers and research projects live in the same tab, not on a separate social profile.',
        anchor: 'Retrieval Evaluation',
        spot: { x: 7, y: 22, w: 86, h: 64 },
      },
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/work`,
  },
  {
    id: 'connections',
    nav: 'Connections',
    kicker: '03 · Connections',
    glanceTitle: 'Connections',
    glance: 'People you have met',
    title: 'Remember the people you meet.',
    lead: 'CodeCard is not only the card you give someone. Connections are the people you have actually met. A public link lets someone view a CodeCard. A Connection starts when they scan your QR and save you.',
    canDoHeading: 'What you can do',
    canDo: [
      { title: 'People you’ve met', body: 'Everyone saved from an in-person QR scan.' },
      { title: 'Meeting context', body: 'Meeting point, the date you met, and a private note.' },
      { title: 'Notes', body: 'What you talked about stays on the person, not in a chat thread.' },
      { title: 'Follow-ups', body: 'Set a date while the conversation is still fresh.' },
      { title: 'Their CodeCard', body: 'Open the card they shared with you.' },
    ],
    screens: [
      {
        shot: 'connections-list',
        tab: 'Connections',
        callout: 'Who you met',
        body: 'Each person you saved from a scan stays in this list.',
        anchor: 'Elena Vasquez',
        spot: { x: 7, y: 30, w: 86, h: 46 },
      },
      {
        shot: 'connections-open',
        tab: 'Connections',
        callout: 'Add context',
        body: 'The note stays on the person: where you met and what you talked about. Edit them to add the date and a follow-up.',
        anchor: 'Met at the booth',
        spot: { x: 6, y: 18, w: 88, h: 58 },
      },
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/connections`,
  },
  {
    id: 'circle',
    nav: 'Circle',
    kicker: '04 · Circle',
    glanceTitle: 'Circle',
    glance: 'New work from people you met',
    title: 'Stay connected to people you’ve actually met.',
    lead: 'Circle helps you keep up with new work from people already in your network. Connections are the people. Circle is what those people are doing. Circle is not social media: no likes, no comments, no follower counts.',
    canDoHeading: 'What you can do',
    canDo: [
      {
        title: 'New work',
        body: 'Projects and papers from people already in Connections.',
      },
    ],
    screens: [
      {
        shot: 'circle-feed',
        tab: 'Circle',
        callout: 'Their new work',
        body: 'A private look at what people you have met are publishing. Not a public engagement feed.',
        anchor: 'PipelineX',
        spot: { x: 7, y: 28, w: 86, h: 62 },
      },
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/circle`,
  },
  {
    id: 'analytics',
    nav: 'Analytics',
    kicker: '05 · Analytics',
    glanceTitle: 'Analytics',
    glance: 'What people look at',
    title: 'See what people care about.',
    lead: 'After you share your card, Analytics shows how people interact with it. The page opens on Review & Coach, then Reach: profile views, project opens, saves, and QR scans. Project, research, and audience views sit further down.',
    canDoHeading: 'What you can do',
    canDo: [
      { title: 'Review & Coach', body: 'A short read on what the numbers are saying.' },
      { title: 'Profile views', body: 'How many people reached your card.' },
      { title: 'Project opens', body: 'Which work they actually opened.' },
    ],
    screens: [
      {
        shot: 'analytics-reach',
        tab: 'Analytics',
        callout: 'Profile views',
        body: 'The large number is people reached. Project opens and QR scans sit with it, so you can see what they looked at.',
        anchor: 'Profile reach',
        spot: { x: 6, y: 55, w: 88, h: 40 },
      },
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/analytics`,
  },
  {
    id: 'settings',
    nav: 'Settings',
    kicker: '06 · Settings',
    glanceTitle: 'Settings',
    glance: 'Account and privacy',
    title: 'Settings',
    lead: 'Manage your account, privacy, profile settings, and preferences. Username and public visibility, sign-in, plan, export, and delete live here.',
    canDoHeading: 'What you can do',
    canDo: [
      { title: 'Account', body: 'Username, visibility, sign-in, plan, export, and delete.' },
    ],
    screens: [
      {
        shot: 'settings-identity',
        tab: 'Settings',
        callout: 'Account controls',
        body: 'Profile, account, billing, and export sit in one list. Your photo and bio stay on Home.',
        anchor: 'CodeCard identity',
        spot: { x: 8, y: 16, w: 84, h: 48 },
      },
    ],
    demoHref: `${LIVE_DEMO_WORKSPACE_HREF}/settings`,
  },
];

export function guideCoveredShots(): GuideShotId[] {
  const seen = new Set<GuideShotId>();
  for (const section of GUIDE_SECTIONS) {
    for (const screen of section.screens) seen.add(screen.shot);
  }
  return [...seen];
}

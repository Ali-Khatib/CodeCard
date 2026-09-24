export type LandingPersonaLayout = 'image-end' | 'image-start';
export type LandingPersonaFrame = 'wide' | 'tall' | 'square';

export type LandingPersonaRail = 'top' | 'bottom';

export type LandingPersona = {
  id: string;
  number: string;
  title: string;
  headline: [string, string];
  lead: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition: string;
  accent: string;
  rail: LandingPersonaRail;
  layout: LandingPersonaLayout;
  frame: LandingPersonaFrame;
};

export const LANDING_PERSONAS: LandingPersona[] = [
  {
    id: 'create',
    number: '01',
    title: 'Create',
    headline: ['Build', 'your card'],
    lead: 'Build your CodeCard.',
    body: 'Add your projects, research, experience, skills, and anything else you want people to see. Keep the work that represents you in one place.',
    imageSrc: '/landing/personas/builders.jpg',
    imageAlt: 'People at neighboring desks building work on their computers',
    imagePosition: 'left center',
    accent: '#8c9288',
    rail: 'top',
    layout: 'image-end',
    frame: 'wide',
  },
  {
    id: 'meet',
    number: '02',
    title: 'Meet',
    headline: ['Meet', 'someone'],
    lead: 'Meet someone worth knowing.',
    body: 'At a conference, university, event, workplace, or anywhere else. When someone asks what you do, your CodeCard is ready to show them.',
    imageSrc: '/landing/personas/events.jpg',
    imageAlt: 'A speaker on stage in a conference hall',
    imagePosition: 'center',
    accent: '#86b54a',
    rail: 'bottom',
    layout: 'image-start',
    frame: 'wide',
  },
  {
    id: 'share',
    number: '03',
    title: 'Share',
    headline: ['One', 'link'],
    lead: 'Give them one link to everything.',
    body: "Share your CodeCard instantly. They can see your work, learn about you, and explore what you're building without searching through multiple platforms.",
    imageSrc: '/landing/personas/freelancers.jpg',
    imageAlt: 'A desk with a notebook and laptop ready to share work',
    imagePosition: 'center',
    accent: '#c45a22',
    rail: 'top',
    layout: 'image-end',
    frame: 'tall',
  },
  {
    id: 'connect',
    number: '04',
    title: 'Connect',
    headline: ['Save', 'the people'],
    lead: 'Save the people you meet.',
    body: 'Add someone to your connections and keep the context that matters — when you met, where you met, and what you talked about.',
    imageSrc: '/landing/personas/recruiters.jpg',
    imageAlt: 'Two people agreeing across a table after an introduction',
    imagePosition: 'center',
    accent: '#e95a0b',
    rail: 'bottom',
    layout: 'image-start',
    frame: 'tall',
  },
  {
    id: 'again',
    number: '05',
    title: 'Meet again',
    headline: ['Pick', 'up again'],
    lead: 'Know who you met and pick up where you left off.',
    body: 'Your connections stay with you after the event or conversation, so you can remember the person, revisit their CodeCard, and follow up when the time is right.',
    imageSrc: '/landing/personas/students.jpg',
    imageAlt: 'People working together again around a laptop',
    imagePosition: 'center',
    accent: '#5f8f68',
    rail: 'top',
    layout: 'image-end',
    frame: 'square',
  },
];

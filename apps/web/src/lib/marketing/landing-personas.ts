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
    id: 'builders',
    number: '01',
    title: 'The work',
    headline: ['Show', 'the work'],
    lead: 'Same person. Different moment.',
    body: 'You made something. Open it while you talk so they see the thing itself — not a job title, not a summary.',
    imageSrc: '/landing/personas/builders.jpg',
    imageAlt: 'People at neighboring desks opening work on their computers',
    imagePosition: 'left center',
    accent: '#7d94a8',
    rail: 'top',
    layout: 'image-end',
    frame: 'wide',
  },
  {
    id: 'recruiters',
    number: '02',
    title: 'The hire',
    headline: ['Read', 'the proof'],
    lead: 'Minutes, not a scavenger hunt.',
    body: 'Someone across the table has to decide. Put the projects next to the name so they are not hunting across five tabs.',
    imageSrc: '/landing/personas/recruiters.jpg',
    imageAlt: 'Two people agreeing across a table during a hiring conversation',
    imagePosition: 'center',
    accent: '#d06a32',
    rail: 'bottom',
    layout: 'image-start',
    frame: 'tall',
  },
  {
    id: 'events',
    number: '03',
    title: 'The room',
    headline: ['Keep', 'the intro'],
    lead: 'An event is a place, not a person.',
    body: 'You meet on the floor. The card keeps the person, the place, and the next step after you leave — whether you were speaking, hiring, or just introduced.',
    imageSrc: '/landing/personas/events.jpg',
    imageAlt: 'A speaker on stage in a conference hall',
    imagePosition: 'center',
    accent: '#e6b325',
    rail: 'top',
    layout: 'image-end',
    frame: 'wide',
  },
  {
    id: 'students',
    number: '04',
    title: 'The proof',
    headline: ['Lead', 'with work'],
    lead: 'A degree is not the whole story.',
    body: 'In school, out of school, both. Lead with projects and research so the diploma line is not the only thing in the room.',
    imageSrc: '/landing/personas/students.jpg',
    imageAlt: 'People working together with laptops in a library',
    imagePosition: 'center',
    accent: '#7f9148',
    rail: 'bottom',
    layout: 'image-start',
    frame: 'square',
  },
  {
    id: 'freelancers',
    number: '05',
    title: 'The brief',
    headline: ['Put', 'the case'],
    lead: 'When a chat becomes work.',
    body: 'Builder, student, hired, independent — same move. When the conversation turns into a job, show the case that actually fits.',
    imageSrc: '/landing/personas/freelancers.jpg',
    imageAlt: 'A desk with a notebook, laptop, and coffee for independent work',
    imagePosition: 'center',
    accent: '#c49a5a',
    rail: 'top',
    layout: 'image-end',
    frame: 'tall',
  },
];

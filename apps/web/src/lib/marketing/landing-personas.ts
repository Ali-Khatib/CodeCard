export type LandingPersonaLayout = 'image-end' | 'image-start';
export type LandingPersonaFrame = 'wide' | 'tall' | 'square';

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
  layout: LandingPersonaLayout;
  frame: LandingPersonaFrame;
};

export const LANDING_PERSONAS: LandingPersona[] = [
  {
    id: 'builders',
    number: '01',
    title: 'Builders',
    headline: ['Show', 'the work'],
    lead: 'Open the work in the room.',
    body: 'Show the project while you talk so people can see what you actually built.',
    imageSrc: '/landing/personas/builders.jpg',
    imageAlt: 'Software engineers building at neighboring desks',
    imagePosition: 'left center',
    layout: 'image-end',
    frame: 'wide',
  },
  {
    id: 'recruiters',
    number: '02',
    title: 'Recruiters',
    headline: ['Read', 'the proof'],
    lead: 'Read the work beside the person.',
    body: 'Projects and proof in one place — no hunting across five tabs.',
    imageSrc: '/landing/personas/recruiters.jpg',
    imageAlt: 'Two people agreeing across a hiring table',
    imagePosition: 'center',
    layout: 'image-start',
    frame: 'tall',
  },
  {
    id: 'events',
    number: '03',
    title: 'Events',
    headline: ['Keep', 'the room'],
    lead: 'Keep the person with the room.',
    body: 'The intro, the event, and the next step stay attached after you leave the floor.',
    imageSrc: '/landing/personas/events.jpg',
    imageAlt: 'Speaker presenting to a conference audience',
    imagePosition: 'center',
    layout: 'image-end',
    frame: 'wide',
  },
  {
    id: 'students',
    number: '04',
    title: 'Students',
    headline: ['Lead', 'with work'],
    lead: 'Lead with what you can do.',
    body: 'Put projects and research first, not just the degree.',
    imageSrc: '/landing/personas/students.jpg',
    imageAlt: 'University students collaborating with laptops on campus',
    imagePosition: 'center',
    layout: 'image-start',
    frame: 'square',
  },
  {
    id: 'freelancers',
    number: '05',
    title: 'Freelancers',
    headline: ['Put', 'the case'],
    lead: 'Put the matching case in front of them.',
    body: 'When a conversation turns into work, show the piece that fits.',
    imageSrc: '/landing/personas/freelancers.jpg',
    imageAlt: 'Independent work setup with a notebook, laptop, and coffee',
    imagePosition: 'center',
    layout: 'image-end',
    frame: 'tall',
  },
];

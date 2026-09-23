export type LandingPersonaLayout = 'image-end' | 'image-start';
export type LandingPersonaFrame = 'wide' | 'tall' | 'square';

export type LandingPersona = {
  id: string;
  number: string;
  title: string;
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
    lead: 'Open the work during the conversation.',
    body: 'Present projects in technical talks, meetups, interviews, and introductions with enough context for someone to actually understand what you built.',
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
    lead: 'Read the work beside the profile.',
    body: 'See projects, research, and practical work without making someone hunt across five different links to understand what they can actually do.',
    imageSrc: '/landing/personas/recruiters.jpg',
    imageAlt: 'Someone reviewing notes and a laptop during a hiring conversation',
    imagePosition: 'center',
    layout: 'image-start',
    frame: 'tall',
  },
  {
    id: 'events',
    number: '03',
    title: 'Events',
    lead: 'Keep the conference on the connection.',
    body: 'Meet someone at a conference, meetup, fair, or technical event, then keep the person, place, context, and next step attached to that introduction.',
    imageSrc: '/landing/personas/events.jpg',
    imageAlt: 'Audience at a technology conference watching a presentation',
    imagePosition: 'center top',
    layout: 'image-end',
    frame: 'wide',
  },
  {
    id: 'students',
    number: '04',
    title: 'Students',
    lead: 'Lead with what you can actually do.',
    body: 'Show projects, research, experiments, and practical work instead of letting a degree title be the only thing people see.',
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
    lead: 'Put the relevant case in front of them.',
    body: 'When a conversation turns into an opportunity, show the work that actually matches what the person needs.',
    imageSrc: '/landing/personas/freelancers.jpg',
    imageAlt: 'Freelancers and a client reviewing work together at a table',
    imagePosition: 'center',
    layout: 'image-end',
    frame: 'tall',
  },
];

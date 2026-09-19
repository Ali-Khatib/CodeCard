/**
 * Empty-state copy for first-session dashboard pages.
 * Clear and actionable — empty screens should invite the next step.
 */

export const EMPTY_STATE_COPY = {
  connections: {
    title: 'Your connections will appear here',
    description: 'Scan a CodeCard QR to connect with someone.',
    body: 'Meet in person. They scan your QR, see your public CodeCard, and connect. You can find them here later.',
    primaryCta: 'Share your CodeCard',
    secondaryCta: 'Open your profile',
  },
  projects: {
    title: 'Add your first project',
    description:
      'Show real work on your card: title, demo, stack, and outcome. Start with one project you are proud of.',
    cta: 'Create your first project',
  },
  research: {
    title: 'Add research when you have it',
    description:
      'Papers are optional. Published research can appear on your public CodeCard.',
    cta: 'Add research',
  },
  work: {
    title: 'Build your CodeCard',
    description: 'Create a project or add your research. Published items appear on your public CodeCard.',
    projectCta: 'Create project',
    researchCta: 'Add research',
  },
  circle: {
    noConnectionsTitle: 'Circle needs people first',
    noConnectionsDescription:
      'When someone scans your CodeCard QR in person, they appear in Connections — then their work shows up here.',
    noActivityTitle: 'Nothing new yet',
    noActivityDescription:
      'When your Connections publish projects or research, it shows up here.',
  },
  analytics: {
    title: 'Your analytics will appear here once people start viewing your CodeCard.',
    description: 'Share your CodeCard so people can open it. Views and project interest show up here.',
    viewCta: 'View CodeCard',
    shareCta: 'Share CodeCard',
  },
  home: {
    noProjects: 'No projects yet. Create one so visitors have work to open on your card.',
    noResearch: 'Papers are optional. Add one when you have something to cite.',
    noCircleWorks: 'When your Connections publish projects or research, the latest three show up here.',
    noCircleConnections:
      'Save people from in-person QR scans — then their public work appears here.',
    circleWorksError: 'Circle highlights could not be loaded. Open Circle to try again.',
    noEvents: 'No upcoming events yet. Add a conference, meetup, or coffee so it is on your calendar.',
    noFollowUps: 'Set a follow-up date on a Connection. Due reminders show up here.',
  },
} as const;

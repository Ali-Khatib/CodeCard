/**
 * Empty-state copy for first-session dashboard pages.
 * Clear and actionable — empty screens should invite the next step.
 */

export const EMPTY_STATE_COPY = {
  connections: {
    title: 'Meet in person. Scan to connect.',
    description:
      'CodeCard connections happen through physical QR scans — no searching, usernames, or digital invites.',
    body: 'Share your CodeCard QR so people you meet can scan it and connect with you.',
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
    title: 'Add a research paper',
    description:
      'Title, authors, venue, PDF, and links. Publish when you are ready.',
    cta: 'Create paper',
  },
  circle: {
    noConnectionsTitle: 'Circle needs people first',
    noConnectionsDescription:
      'When someone scans your CodeCard QR in person, they appear in Connections — then their work shows up here.',
    noActivityTitle: 'Nothing new yet',
    noActivityDescription:
      'When your Connections publish projects or research, it shows up here.',
  },
  home: {
    noProjects: 'No projects yet. Create one to feature on your card.',
    noResearch: 'No papers yet. Add one when you have something to show.',
    noCircleWorks: 'When your Connections publish projects or research, the latest three show up here.',
    noCircleConnections:
      'Save people from in-person QR scans — then their public work appears here.',
    circleWorksError: 'Circle highlights could not be loaded. Open Circle to try again.',
  },
} as const;

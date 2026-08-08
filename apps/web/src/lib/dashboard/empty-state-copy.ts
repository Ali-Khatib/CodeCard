/**
 * Hyped empty-state copy for first-session dashboard pages.
 * Casual and loud on purpose — empty screens should feel like a dare to start, not a tombstone.
 */

export const EMPTY_STATE_COPY = {
  connections: {
    title: 'Add people. Omg yes. Lets add peopleeee.',
    description:
      'Save the builders whose work you actually care about. Open their CodeCard, hit Add connection, and build a private list you can remember.',
    body: 'Your list stays private. Only you see who you saved.',
    primaryCta: 'Find people to add',
    secondaryCta: 'Share your CodeCard',
  },
  projects: {
    title: 'Add a project. Lets freaking go.',
    description:
      'Your card needs real work on it. Title, demo, stack, outcome. Make the first one loud.',
    cta: 'Create your first project',
  },
  research: {
    title: 'Drop a paper. Make it real.',
    description:
      'Title, authors, venue, PDF, links. Publish when you are ready. Blank research pages are boring. Fix that.',
    cta: 'Create paper',
  },
  circle: {
    noConnectionsTitle: 'Circle needs people first. Add someeee.',
    noConnectionsDescription:
      'Follow builders you trust, then this feed fills with what they ship.',
    noActivityTitle: 'Nothing new yet. Stay ready.',
    noActivityDescription:
      'When your Connections publish projects or research, it shows up here.',
  },
  home: {
    noProjects: 'No projects yet. Go make one and flex it on your card.',
    noResearch: 'No papers yet. Add one when you have something to show.',
  },
} as const;

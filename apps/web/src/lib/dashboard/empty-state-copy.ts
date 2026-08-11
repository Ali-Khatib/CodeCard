/**
 * Empty-state copy for first-session dashboard pages.
 * Clear and actionable — empty screens should invite the next step.
 */

export const EMPTY_STATE_COPY = {
  connections: {
    title: 'Add people you want to remember',
    description:
      'Save builders whose work you care about. Open their CodeCard, tap Add connection, and keep a private list only you can see.',
    body: 'Your list stays private. Only you see who you saved.',
    primaryCta: 'Find people to add',
    secondaryCta: 'Share your CodeCard',
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
      'Save people from public CodeCards. Their published work will show up here.',
    noActivityTitle: 'Nothing new yet',
    noActivityDescription:
      'When your Connections publish projects or research, it shows up here.',
  },
  home: {
    noProjects: 'No projects yet. Create one to feature on your card.',
    noResearch: 'No papers yet. Add one when you have something to show.',
  },
} as const;

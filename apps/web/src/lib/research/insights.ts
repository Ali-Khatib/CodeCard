export const RESEARCH_INSIGHTS = [
  {
    id: 'attention',
    title: 'Your work may never get read',
    stat: '~6 sec',
    finding:
      'Eye-tracking study: recruiters spent about six seconds on a résumé and fixed on name, title, and school. Project proof rarely got attention.',
    sourceId: 'pina-eye-tracking',
  },
  {
    id: 'prestige',
    title: 'Your school can decide first',
    stat: '3 countries',
    finding:
      'Cross-national experiment: institutional prestige cues influenced early screening across three countries, before direct capability assessment.',
    sourceId: 'mihut-prestige',
  },
  {
    id: 'proof',
    title: 'Buried skills do not get matched',
    stat: 'Up to 6.1×',
    finding:
      'LinkedIn 2025: skills-based hiring widens the pool up to 6.1× when skills are visible upfront. If yours are buried, you may never enter the match.',
    sourceId: 'linkedin-skills-2025',
  },
] as const;

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
    id: 'pedigree',
    title: 'The same résumé, different results',
    stat: 'Nearly +15 pts',
    finding:
      'Audit study: identical qualifications, different school and firm signals. Callbacks rose nearly 15 points for the privileged version. Skill was not what moved first.',
    sourceId: 'rivera-tilcsik',
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

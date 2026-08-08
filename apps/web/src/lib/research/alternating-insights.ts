export type AlternatingResearchInsight = {
  id: string;
  sourceId: string;
  category: string;
  accent: 'lavender' | 'peach' | 'mint';
  humanHeadline: string;
  humanBody: string;
  paperQuote: string;
  citation: string;
};

export const ALTERNATING_RESEARCH: AlternatingResearchInsight[] = [
  {
    id: 'attention',
    sourceId: 'pina-eye-tracking',
    category: 'Attention',
    accent: 'lavender',
    humanHeadline: 'Your best work might never get a glance.',
    humanBody:
      'Recruiters do not read résumés. They scan them. In those first seconds, eyes land on your name, your title, and where you went to school. The project you spent months on? It often never enters the frame.',
    paperQuote:
      'In one professional recruiter eye-tracking study, average initial résumé review lasted approximately six seconds before early screening decisions formed.',
    citation: 'Pina et al., 2019',
  },
  {
    id: 'prestige',
    sourceId: 'mihut-prestige',
    category: 'Signals',
    accent: 'peach',
    humanHeadline: 'Your school can decide first.',
    humanBody:
      'Before anyone tests what you can build, the education line can still steer the cut. Prestige cues shaped early screening across multiple countries in this experiment. Merit matters. It is not always what opens the gate.',
    paperQuote:
      'Institutional prestige cues influenced screening in multiple national contexts, though effect sizes varied.',
    citation: 'Mihut, 2020',
  },
  {
    id: 'proof',
    sourceId: 'linkedin-skills-2025',
    category: 'Skills',
    accent: 'mint',
    humanHeadline: 'Hidden skills do not get matched.',
    humanBody:
      'Platforms are moving toward skills-based hiring: wider pools, better matches. But only if your skills are visible upfront. Bury them at the bottom of a PDF and you may never enter the algorithm\'s consideration set.',
    paperQuote:
      'LinkedIn\'s 2025 platform analysis estimates up to 6.1× potential talent-pool expansion through skills-based matching when skills evidence is surfaced.',
    citation: 'LinkedIn Economic Graph Research, 2025',
  },
];

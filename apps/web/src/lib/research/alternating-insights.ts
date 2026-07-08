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
    id: 'pedigree',
    sourceId: 'rivera-tilcsik',
    category: 'Signals',
    accent: 'peach',
    humanHeadline: 'Same skills. Different door.',
    humanBody:
      'When two candidates look identical on paper, small signals like the school on your header or the firm on your last line can swing who gets called back. Merit is real. But it is not always what gets seen first.',
    paperQuote:
      'Higher-class signals increased callbacks for men by nearly 15 percentage points in this market, with qualifications held constant.',
    citation: 'Rivera & Tilcsik, 2016',
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

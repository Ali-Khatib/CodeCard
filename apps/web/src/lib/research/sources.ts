export interface ResearchSource {
  id: string;
  title: string;
  authors: string;
  year: number;
  studyType: string;
  sampleSize: string;
  finding: string;
  limitation: string;
  url: string;
}

export const RESEARCH_SOURCES: Record<string, ResearchSource> = {
  'guillory-linkedin-deception': {
    id: 'guillory-linkedin-deception',
    title: 'The Effect of LinkedIn on Deception in Resumes',
    authors: 'Guillory & Hancock',
    year: 2012,
    studyType: 'Between-subjects experiment',
    sampleSize: '119 participants writing résumés',
    finding:
      'Public LinkedIn résumés were not less deceptive overall. People lied less about work experience and responsibilities, and more about interests and hobbies, than on a traditional résumé.',
    limitation:
      'A lab résumé task, not a field study of real hiring. It shows how a public profile changes the kind of deception, not that every LinkedIn connection is false.',
    url: 'https://doi.org/10.1089/cyber.2011.0389',
  },
  'van-dijck-linkedin-identity': {
    id: 'van-dijck-linkedin-identity',
    title: 'Performing the Self on Facebook and LinkedIn',
    authors: 'van Dijck',
    year: 2013,
    studyType: 'Interface analysis',
    sampleSize: 'Comparative reading of two platform interfaces',
    finding:
      'LinkedIn’s interface pushes a single professional persona: skills, recommendations, and a narrative written to be evaluated by people who do not know you.',
    limitation:
      'This is an interface analysis, not a survey of how often those connections are strangers.',
    url: 'https://doi.org/10.1177/0163443712468605',
  },
  'nisbett-wilson-halo': {
    id: 'nisbett-wilson-halo',
    title: 'The Halo Effect',
    authors: 'Nisbett & Wilson',
    year: 1977,
    studyType: 'Experiment',
    sampleSize: 'Viewers of staged warm and cold interviews with the same instructor',
    finding:
      'A global impression changed ratings of appearance, manner, and accent. People who disliked the instructor still believed those details had caused the dislike, not the other way around.',
    limitation:
      'A classroom interview, not a hiring or conference study. The mechanism is the point: one strong impression spills onto everything else.',
    url: 'https://doi.org/10.1037/0022-3514.35.4.250',
  },
  'gopalakrishna-trade-show': {
    id: 'gopalakrishna-trade-show',
    title: 'A Three-Stage Model of Industrial Trade Show Performance',
    authors: 'Gopalakrishna & Lilien',
    year: 1995,
    studyType: 'Field model of exhibitors',
    sampleSize: '85 firms at one major trade show',
    finding:
      'A booth has to attract someone, get a real conversation, and then convert that contact. Attraction, contact, and conversion are different problems, and a crowded floor makes the middle step the fragile one.',
    limitation:
      'One 1991 industrial show. It measures exhibitor performance, not how a visitor remembers a person they met.',
    url: 'https://doi.org/10.1287/mksc.14.1.22',
  },
  'smith-trade-show-followup': {
    id: 'smith-trade-show-followup',
    title: 'The Complementary Effect of Trade Shows on Personal Selling',
    authors: 'Smith, Gopalakrishna & Smith',
    year: 2004,
    studyType: 'Field study',
    sampleSize: 'Industrial distributors, attendees compared with non-attendees',
    finding:
      'Follow-up selling was more productive when the customer had already seen the product at the show. The booth did not replace the later conversation. It made that conversation work better.',
    limitation:
      'Business-to-business selling, not a study of personal networking cards. The result is about following up a meeting, not about collecting contacts.',
    url: 'https://doi.org/10.1016/j.ijresmar.2003.04.003',
  },
  'larkin-simon-diagrams': {
    id: 'larkin-simon-diagrams',
    title: 'Why a Diagram Is (Sometimes) Worth Ten Thousand Words',
    authors: 'Larkin & Simon',
    year: 1987,
    studyType: 'Cognitive model',
    sampleSize: 'Worked problems in mathematics and physics',
    finding:
      'A diagram can put the relation you need in one place, so a person recognizes it instead of searching through a paragraph. A sentence and a picture can say the same thing and still not be equally easy to use.',
    limitation:
      'The examples are textbook problems, not project cards. It supports showing the work, not a claim that every image persuades.',
    url: 'https://doi.org/10.1111/j.1551-6708.1987.tb00863.x',
  },
  'pina-eye-tracking': {
    id: 'pina-eye-tracking',
    title: 'Recruiter Eye-Tracking During Résumé Screening',
    authors: 'Pina et al.',
    year: 2019,
    studyType: 'Eye-tracking experiment',
    sampleSize: 'Professional recruiters reviewing candidate résumés',
    finding:
      'In one professional recruiter eye-tracking study, average initial résumé review lasted approximately six seconds before early screening decisions formed.',
    limitation:
      'Findings reflect one study context; recruiter behavior varies by role, market, and organization.',
    url: 'https://doi.org/10.1016/j.jvb.2019.03.004',
  },
  'theladders-eye-tracking': {
    id: 'theladders-eye-tracking',
    title: 'TheLadders Recruiter Eye-Tracking Study',
    authors: 'TheLadders (industry research)',
    year: 2012,
    studyType: 'Eye-tracking study',
    sampleSize: '30 professional recruiters',
    finding:
      'In this study, recruiters spent roughly 80% of review time on name, current title/company, previous title/company, dates, and education, with project evidence often receiving little initial attention.',
    limitation:
      'Industry-sponsored study with a modest sample; not all recruiters behave identically across sectors.',
    url: 'https://www.theladders.com/static/images/basicSite/pdfs/TheLadders-EyeTracking-StudyC2.pdf',
  },
  'urquidi-prestige': {
    id: 'urquidi-prestige',
    title: 'University Reputation Correspondence Experiment',
    authors: 'Urquidi et al.',
    year: 2021,
    studyType: 'Correspondence experiment',
    sampleSize: 'Varies by treatment arm in experiment design',
    finding:
      'University prestige signals affected early screening outcomes before direct capability assessment in this experimental design.',
    limitation: 'Laboratory-style experiment; real hiring involves more context than correspondence tests.',
    url: 'https://doi.org/10.1177/00113921211012345',
  },
  'mihut-prestige': {
    id: 'mihut-prestige',
    title: 'Three-Country Prestige Experiment',
    authors: 'Mihut',
    year: 2020,
    studyType: 'Cross-national experiment',
    sampleSize: 'Three-country comparative sample',
    finding:
      'Institutional prestige cues influenced screening in multiple national contexts, though effect sizes varied.',
    limitation: 'Cross-country designs complicate generalization to any single labor market.',
    url: 'https://doi.org/10.1086/707222',
  },
  'schmidt-hunter': {
    id: 'schmidt-hunter',
    title: 'Personnel Selection Synthesis',
    authors: 'Schmidt & Hunter',
    year: 1998,
    studyType: 'Meta-analytic synthesis',
    sampleSize: 'Decades of validity research aggregated',
    finding:
      'Structured assessments of demonstrated performance and work samples show meaningful predictive validity in personnel selection research.',
    limitation: 'Synthesis reflects historical research; modern job markets evolve.',
    url: 'https://doi.org/10.1037/0033-2909.124.2.262',
  },
  'roth-work-sample': {
    id: 'roth-work-sample',
    title: 'Work-Sample Meta-Analysis',
    authors: 'Roth et al.',
    year: 2005,
    studyType: 'Meta-analysis',
    sampleSize: 'Aggregated work-sample validity studies',
    finding:
      'Work-sample assessments demonstrate meaningful predictive validity for job performance in meta-analytic research.',
    limitation: 'Validity depends on job type, sample construction, and assessment quality.',
    url: 'https://doi.org/10.1037/0021-9010.90.1.128',
  },
  'sackett-validity': {
    id: 'sackett-validity',
    title: 'Modern Validity Reappraisal',
    authors: 'Sackett et al.',
    year: 2022,
    studyType: 'Validity reappraisal',
    sampleSize: 'Reanalysis of selection validity literature',
    finding:
      'Modern reappraisals recommend conservative claims about selection method validity and call for context-specific interpretation.',
    limitation: 'Scholarly debate continues; no single metric replaces holistic evaluation.',
    url: 'https://doi.org/10.1037/apl0000994',
  },
  'linkedin-skills-2025': {
    id: 'linkedin-skills-2025',
    title: 'Skills-Based Hiring 2025',
    authors: 'LinkedIn Economic Graph Research',
    year: 2025,
    studyType: 'Platform analysis',
    sampleSize: 'LinkedIn global talent data',
    finding:
      'LinkedIn’s 2025 platform analysis estimates up to 6.1× potential talent-pool expansion through skills-based matching when skills evidence is surfaced.',
    limitation: 'Platform analysis; potential expansion is not guaranteed hiring outcome.',
    url: 'https://economicgraph.linkedin.com/research/skills-based-hiring',
  },
  'burning-glass-hbs': {
    id: 'burning-glass-hbs',
    title: 'Skills-Based Hiring (Burning Glass / HBS)',
    authors: 'Burning Glass Institute & Harvard Business School',
    year: 2022,
    studyType: 'Labor-market analysis',
    sampleSize: 'Large U.S. job-posting and career data',
    finding:
      'Skills-based approaches can broaden candidate pools when job requirements focus on demonstrable skills rather than credential proxies alone.',
    limitation: 'Observational labor-market data; adoption varies by employer.',
    url: 'https://www.hbs.edu/managing-the-future-of-work/research/Pages/default.aspx',
  },
  'wang-cognitive-load': {
    id: 'wang-cognitive-load',
    title: 'Website Complexity and Cognitive Load',
    authors: 'Wang et al.',
    year: 2014,
    studyType: 'Experimental usability study',
    sampleSize: 'Controlled user-task experiments',
    finding:
      'Visual complexity increases cognitive load and can reduce comprehension speed in interface evaluation tasks.',
    limitation: 'Lab settings may not capture all real-world browsing contexts.',
    url: 'https://doi.org/10.1016/j.intcom.2014.01.001',
  },
  'nng-recognition': {
    id: 'nng-recognition',
    title: 'Recognition Over Recall',
    authors: 'Nielsen Norman Group',
    year: 2020,
    studyType: 'UX research synthesis',
    sampleSize: 'Decades of usability research',
    finding:
      'Interfaces that make options visible (recognition) outperform those requiring users to remember information (recall).',
    limitation: 'Heuristic guidance; implementation quality still matters.',
    url: 'https://www.nngroup.com/articles/recognition-and-recall/',
  },
  'springer-disclosure': {
    id: 'springer-disclosure',
    title: 'Progressive Disclosure',
    authors: 'Springer & Whittaker',
    year: 2019,
    studyType: 'HCI research review',
    sampleSize: 'Review of disclosure patterns in interface design',
    finding:
      'Progressive disclosure reduces initial complexity while keeping deeper detail available on demand.',
    limitation: 'Poor disclosure hierarchy can hide critical information.',
    url: 'https://doi.org/10.1145/3290605.3300416',
  },
};

export const EVIDENCE_RAIL_STATS = [
  {
    id: 'six-seconds',
    figure: '~6 seconds',
    label: 'Average initial résumé review in one professional recruiter eye-tracking study.',
    sourceId: 'pina-eye-tracking',
    contextNote: 'One study',
  },
  {
    id: 'three-countries',
    figure: '3 countries',
    label:
      'Institutional prestige cues influenced early screening across three national contexts in this comparative experiment.',
    sourceId: 'mihut-prestige',
    contextNote: 'Cross-national',
  },
  {
    id: 'six-point-one-x',
    figure: 'Up to 6.1×',
    label:
      'Potential global talent-pool expansion through skills-based matching in LinkedIn’s 2025 platform analysis.',
    sourceId: 'linkedin-skills-2025',
    contextNote: 'Platform analysis',
  },
] as const;

export const ALL_SOURCES_LIST = Object.values(RESEARCH_SOURCES);

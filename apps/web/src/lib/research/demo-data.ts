import type { ResearchPaper } from './research';

const figure = (title: string, subtitle: string, accent = '#9382ff') =>
  `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
  <rect width="1400" height="900" fill="#030014"/>
  <circle cx="240" cy="210" r="190" fill="${accent}" opacity="0.18"/>
  <circle cx="1120" cy="680" r="260" fill="#c094e4" opacity="0.13"/>
  <rect x="90" y="90" width="1220" height="720" rx="34" fill="#0b0618" stroke="rgba(255,255,255,0.14)"/>
  <text x="150" y="175" fill="#f4f0ff" font-family="system-ui,sans-serif" font-size="42" font-weight="700">${title}</text>
  <text x="150" y="230" fill="#b9b2ca" font-family="system-ui,sans-serif" font-size="24">${subtitle}</text>
  <rect x="150" y="310" width="330" height="260" rx="22" fill="rgba(147,130,255,0.22)" stroke="rgba(255,255,255,0.18)"/>
  <rect x="535" y="260" width="330" height="360" rx="22" fill="rgba(192,148,228,0.18)" stroke="rgba(255,255,255,0.18)"/>
  <rect x="920" y="360" width="290" height="210" rx="22" fill="rgba(255,250,244,0.1)" stroke="rgba(255,255,255,0.16)"/>
  <path d="M480 440 C520 400, 505 385, 535 378" stroke="${accent}" stroke-width="5" fill="none" opacity="0.8"/>
  <path d="M865 450 C900 430, 890 425, 920 420" stroke="#c094e4" stroke-width="5" fill="none" opacity="0.8"/>
</svg>`)}`;

export const DEMO_RESEARCH_PAPERS: ResearchPaper[] = [
  {
    id: 'research-demo-1',
    slug: 'retrieval-evaluation-for-dev-tools',
    title: 'Retrieval Evaluation for Developer Tooling Agents',
    abstract:
      'We evaluate retrieval-augmented developer tools across issue triage, code search, and deployment diagnosis tasks. The paper proposes a small benchmark for measuring answer faithfulness, useful context recall, and time-to-fix reduction in practical engineering workflows.',
    authors: ['Alex Chen', 'Maya Patel', 'Jordan Lee'],
    venue: 'Preprint',
    publicationStatus: 'Under review',
    year: 2026,
    pdfUrl: 'https://example.com/retrieval-evaluation.pdf',
    doiUrl: 'https://doi.org/10.0000/codecard.demo',
    citationText:
      'Chen, A., Patel, M., & Lee, J. (2026). Retrieval Evaluation for Developer Tooling Agents. Preprint.',
    tags: ['RAG', 'Evaluation', 'Developer Tools', 'AI Agents'],
    coverImageUrl: figure('Retrieval Evaluation', 'Benchmark flow for developer tooling agents'),
    relatedProjectId: 'demo-1',
    relatedProjectTitle: 'DevFlow',
    relatedProjectHref: '/demo/projects/demo-1',
    figures: [
      {
        imageUrl: figure('Context Recall', 'Comparing retrieval depth against fix accuracy', '#7dd3fc'),
        caption: 'Recall and faithfulness curves across three developer-tool tasks.',
      },
      {
        imageUrl: figure('Agent Workflow', 'Issue, retrieve, patch, verify', '#c084fc'),
        caption: 'Evaluation loop used for the benchmark runner.',
      },
    ],
    downloadCount: 428,
    avgReadTimeSec: 186,
  },
  {
    id: 'research-demo-2',
    slug: 'observability-alert-fatigue',
    title: 'Reducing Alert Fatigue with Lightweight Trace Summaries',
    abstract:
      'This study explores how concise trace summaries and ownership hints help small engineering teams respond to incidents faster without adding a full observability team.',
    authors: ['Alex Chen', 'Sam Rivera'],
    venue: 'Systems for Small Teams Workshop',
    publicationStatus: 'Accepted poster',
    year: 2025,
    pdfUrl: 'https://example.com/trace-summaries.pdf',
    doiUrl: null,
    citationText:
      'Chen, A. & Rivera, S. (2025). Reducing Alert Fatigue with Lightweight Trace Summaries. Systems for Small Teams Workshop.',
    tags: ['Observability', 'Tracing', 'Incident Response'],
    coverImageUrl: figure('Trace Summaries', 'Incident context without dashboard overload', '#34d399'),
    relatedProjectId: 'demo-3',
    relatedProjectTitle: 'Pulse',
    relatedProjectHref: '/demo/projects/demo-3',
    figures: [
      {
        imageUrl: figure('Alert Routing', 'Noise reduction across service owners', '#34d399'),
        caption: 'Prototype routing model for reducing repeated low-signal alerts.',
      },
    ],
    downloadCount: 212,
    avgReadTimeSec: 142,
  },
];

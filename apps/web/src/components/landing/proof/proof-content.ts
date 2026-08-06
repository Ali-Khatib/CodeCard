/** Landing persona — neutral CodeCard identity (not the workspace demo). */
export const PROOF_PERSONA = {
  name: 'Jordan Lee',
  role: 'Staff Engineer · Platform',
  location: 'Remote',
  bio: 'Projects, research, and measurable impact — one living technical identity.',
  id: 'CC-JL-20491',
  verified: 'VERIFIED WORK',
} as const;

export const PROOF_TICKER = [
  'PROJECTS',
  'RESEARCH',
  'IMPACT',
  'VERIFIED WORK',
  'ONE IDENTITY',
  'QR SHARE',
  'ANALYTICS',
  'CASE STUDIES',
] as const;

export const PROOF_CHAPTERS = [
  { id: '01', label: 'BUILD', detail: 'Shipped systems with demos, repos, and outcomes first.' },
  { id: '02', label: 'RESEARCH', detail: 'Papers, abstracts, and citations beside the systems they prove.' },
  { id: '03', label: 'PROVE', detail: 'Views, saves, and engagement — what actually resonated.' },
  { id: '04', label: 'SHARE', detail: 'One link and QR. The whole record, on their screen.' },
] as const;

export const PROOF_INSPECTION_STATES = [
  {
    id: 'identity',
    kicker: 'COMPLETE RECORD',
    lineA: 'NOT A PORTFOLIO.',
    lineB: 'A RECORD OF THE WORK.',
  },
  {
    id: 'projects',
    kicker: 'PROJECT EVIDENCE',
    lineA: 'BUILT IT?',
    lineB: 'SHOW THE WORK.',
  },
  {
    id: 'research',
    kicker: 'RESEARCH EVIDENCE',
    lineA: 'RESEARCH IS WORK.',
    lineB: 'TREAT IT LIKE IT.',
  },
  {
    id: 'share',
    kicker: 'SHARE STATE',
    lineA: 'NOT ANOTHER LINK.',
    lineB: 'THE LINK.',
  },
  {
    id: 'analytics',
    kicker: 'IMPACT SIGNAL',
    lineA: 'WHAT THEY OPENED.',
    lineB: 'WHAT THEY SAVED.',
  },
  {
    id: 'complete',
    kicker: 'ONE IDENTITY',
    lineA: 'ONE LINK.',
    lineB: 'THE WHOLE RECORD.',
  },
] as const;

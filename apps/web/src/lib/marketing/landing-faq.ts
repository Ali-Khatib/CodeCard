export type LandingFaqItem = {
  question: string;
  answer: string;
};

export const LANDING_FAQ_ITEMS: LandingFaqItem[] = [
  {
    question: 'Is CodeCard a replacement for GitHub?',
    answer:
      'No. CodeCard is not a replacement for GitHub. GitHub is where code is hosted and reviewed. CodeCard presents selected work when someone asks what you do.',
  },
  {
    question: 'Is CodeCard a replacement for LinkedIn?',
    answer:
      'No. CodeCard is not a replacement for LinkedIn. LinkedIn is a professional network and feed. CodeCard is for the introduction: open the profile, show the work, and record the meeting if you want a next step.',
  },
  {
    question: 'Do visitors need the CodeCard app?',
    answer:
      'No. They can scan your QR code and open your CodeCard directly in their browser. They do not need an account just to view it.',
  },
  {
    question: 'Can someone open my CodeCard without installing anything?',
    answer:
      'Yes. A browser is enough. If they skip the scan, you can still open the profile on your phone while you talk.',
  },
  {
    question: 'How does connecting with someone work?',
    answer:
      'When both people choose to stay in touch, CodeCard can record the introduction from that interaction instead of asking you to hunt for a username later.',
  },
  {
    question: 'What information is saved when I make a connection?',
    answer:
      'You can keep when and where you met, a private note, event context, and a follow-up date. That record stays with you.',
  },
  {
    question: 'Can I show my CodeCard directly from my phone?',
    answer:
      'Yes. Open the profile and QR from your phone. Visitors can scan, or they can look at the work on your screen.',
  },
  {
    question: 'Is CodeCard a social network?',
    answer:
      'No. There is no public feed or follower count. Circle is the private list of people you actually connected with.',
  },
  {
    question: 'Is CodeCard just a portfolio?',
    answer:
      'A portfolio explains work on the web. CodeCard is built for the moment of introduction, then for keeping date, place, notes, and follow-up attached to that meeting.',
  },
];

import type { OwnerAnalyticsSummary } from '@/lib/dashboard/analytics-aggregate';
import type { AnalyticsReview } from '@/lib/dashboard/analytics-review';

export const ANALYTICS_COACH_FEATURE = 'Analytics coach for your card';

export const ANALYTICS_COACH_PROMPTS = [
  'Which project should I put first?',
  'What does this traffic mean?',
  'How do I get more people to open my work?',
  'Should I change the card or the projects?',
] as const;

export type AnalyticsCoachMessage = {
  role: 'user' | 'assistant';
  text: string;
};

function normalize(question: string): string {
  return question.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Turns a question + the current review into a decision.
 * Stays on the numbers already on the page — no invented visitors or hours.
 */
export function answerAnalyticsQuestion(
  question: string,
  review: AnalyticsReview,
  summary?: Pick<OwnerAnalyticsSummary, 'profileViews' | 'projectViews' | 'researchViews'>,
): string {
  const q = normalize(question);
  if (!q) {
    return 'Ask what to move, or what the traffic means. Keep it about this card.';
  }

  if (/\b(first|lead|move|put|order|top|rank|project)\b/.test(q)) {
    if (review.moveUp) {
      return `${review.moveUp.title} should lead. ${review.moveUp.reason}`;
    }
    return `${review.highlight} ${review.trafficMeaning}`;
  }

  if (/\b(traffic|mean|means|views|numbers|glance|look)\b/.test(q)) {
    return review.trafficMeaning;
  }

  if (/\b(open|opens|click|work|project opens)\b/.test(q)) {
    const views = summary?.profileViews ?? 0;
    const opens = summary?.projectViews ?? 0;
    if (views > 0 && opens === 0) {
      return 'People are opening the card and stopping. Put your strongest project first, and make the first line of that project a reason to tap — not a repo name.';
    }
    if (views > 0 && opens / views < 0.25) {
      return 'The card is getting looks, but the work is easy to miss. Lead with the project people already stay with, and keep the first screen short.';
    }
    return 'People who land are already opening work. Do not rebuild the card. Tighten the first project and keep the quieter ones below it.';
  }

  if (/\b(research|paper|papers)\b/.test(q)) {
    const research = summary?.researchViews ?? 0;
    if (research > 0) {
      return `Research was opened ${research} times. Keep a paper on the card if it helps the introduction. It is not a side tab — people used it.`;
    }
    return 'No research opens are on this page yet. A paper only helps if someone in the room would open it. Otherwise lead with a project.';
  }

  if (/\b(change|improve|fix|next|decision|do)\b/.test(q)) {
    const next = review.moveUp
      ? `Move ${review.moveUp.title} up.`
      : 'Share the card until a project stands out.';
    return `${review.highlight} ${next} ${review.trafficMeaning}`;
  }

  const extra = review.lines[0] ? ` ${review.lines[0]}` : '';
  return `${review.highlight} ${review.trafficMeaning}${extra}`;
}

export function buildSampleCoachThread(review: AnalyticsReview): AnalyticsCoachMessage[] {
  const first = ANALYTICS_COACH_PROMPTS[0];
  return [
    { role: 'user', text: first },
    { role: 'assistant', text: answerAnalyticsQuestion(first, review) },
  ];
}

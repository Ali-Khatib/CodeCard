import type { OwnerAnalyticsSummary } from '@/lib/dashboard/analytics-aggregate';

export type AnalyticsReview = {
  highlight: string;
  moveUp: { title: string; reason: string } | null;
  trafficMeaning: string;
  lines: string[];
};

export const ANALYTICS_REVIEW_FEATURE = 'AI review of your analytics';

function formatStay(totalSec: number): string {
  if (totalSec < 60) return `${totalSec} seconds`;
  const min = Math.floor(totalSec / 60);
  const rem = totalSec % 60;
  return rem ? `${min} minutes ${rem} seconds` : `${min} minutes`;
}

/** Sample review shown on the live-demo Analytics tab. */
export function buildSampleAnalyticsReview(): AnalyticsReview {
  return {
    highlight: 'DevFlow is the project to put first. People stay with it.',
    moveUp: {
      title: 'DevFlow',
      reason:
        'People linger about a minute and a half — more than twice as long as Pulse. Lead with the work they already finish.',
    },
    trafficMeaning:
      'Most people browse as guests. They found you from GitHub, a QR, or LinkedIn. GitHub visitors click through. QR visitors are the ones you actually met.',
    lines: [
      'SchemaSync gets opens but less time. Keep it on the card — just not in the first slot.',
      'Pulse is the quiet one. Fine as a third project. Do not let it sit above the work people already choose.',
      'The card is being used, not just glanced at. That is the signal that matters.',
    ],
  };
}

/**
 * Plain-language review of owner aggregates. Only uses fields the summary
 * already carries — never invents unique visitors, recruiters, or peak hours.
 */
export function buildOwnerAnalyticsReview(summary: OwnerAnalyticsSummary): AnalyticsReview {
  const byViews = [...summary.topProjects].sort((a, b) => b.views - a.views);
  const byTime = [...summary.topProjects].sort((a, b) => b.timeSpentSec - a.timeSpentSec);
  const leader = byViews[0] ?? null;
  const linger = byTime[0] ?? null;

  let moveUp: AnalyticsReview['moveUp'] = null;
  if (
    linger &&
    leader &&
    linger.id !== leader.id &&
    linger.timeSpentSec > 0 &&
    linger.views > 0
  ) {
    moveUp = {
      title: linger.title,
      reason: `People who open ${linger.title} stay longer than they do on ${leader.title}. Put it higher so more people find the work they actually read.`,
    };
  } else if (leader) {
    const stay =
      leader.timeSpentSec > 0 ? ` They spent about ${formatStay(leader.timeSpentSec)} on it.` : '';
    moveUp = {
      title: leader.title,
      reason: `${leader.title} is what people open most.${stay} Keep it first so the card leads with the project that already works.`,
    };
  }

  const views = summary.profileViews;
  const opens = summary.projectViews;
  const clicks = summary.linkClicks;

  let trafficMeaning: string;
  if (views === 0) {
    trafficMeaning = 'There is not enough traffic yet to read a pattern.';
  } else if (opens === 0) {
    trafficMeaning = `People opened the card ${views} times but did not open a project. The introduction is landing; the work is not getting the first click.`;
  } else if (opens / views < 0.25) {
    trafficMeaning =
      'Most visits stop on the card. Only a small share open a project. The first project may not be the one they came for — or the work is easy to miss.';
  } else if (clicks > 0 && clicks >= opens * 0.5) {
    trafficMeaning =
      'People who open work also click out to a link. That is a warm handoff — they trusted something enough to leave the card.';
  } else {
    trafficMeaning =
      'People who land are opening work. The card is doing its job: they came to look, and they looked.';
  }

  const highlight = moveUp
    ? `${moveUp.title} is the project to lead with.`
    : views > 0
      ? 'Your card is getting looks. The next step is making sure the first project is the one people stay with.'
      : 'Share the card. This review fills in once people start opening it.';

  const lines: string[] = [];
  if (leader) {
    const stay =
      leader.timeSpentSec > 0 ? ` and about ${formatStay(leader.timeSpentSec)} of time on it` : '';
    lines.push(`${leader.title} has ${leader.views} project views${stay}.`);
  }
  if (summary.researchViews > 0) {
    lines.push(
      `Research was opened ${summary.researchViews} times. Papers are part of how people judge the card, not a side tab.`,
    );
  }
  const topSource = summary.sources[0];
  if (topSource) {
    lines.push(
      `Most recorded opens came from ${topSource.label}. That is how people are finding you right now.`,
    );
  }
  const second = byViews[1];
  if (leader && second && second.views < leader.views * 0.5) {
    lines.push(
      `${second.title} is quieter. Keep it, but do not let it sit above the project people already choose.`,
    );
  }

  return { highlight, moveUp, trafficMeaning, lines };
}

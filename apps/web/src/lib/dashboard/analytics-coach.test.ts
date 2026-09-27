import { describe, expect, it } from 'vitest';
import { PLANS } from '@codecard/config';
import {
  ANALYTICS_COACH_FEATURE,
  ANALYTICS_COACH_PROMPTS,
  answerAnalyticsQuestion,
  buildSampleCoachThread,
} from './analytics-coach';
import { buildSampleAnalyticsReview } from './analytics-review';

describe('analytics coach', () => {
  const review = buildSampleAnalyticsReview();

  it('turns a lead-with question into a project decision', () => {
    const answer = answerAnalyticsQuestion('Which project should I put first?', review);
    expect(answer).toContain('DevFlow');
    expect(answer).toMatch(/lead|first|Put it higher/i);
  });

  it('explains traffic without inventing visitors', () => {
    const answer = answerAnalyticsQuestion('What does this traffic mean?', review);
    expect(answer).toBe(review.trafficMeaning);
    expect(answer).not.toMatch(/unique visitors|recruiter|Tuesday|intent|click through/i);
  });

  it('uses open-rate when the card is glanced at but work is skipped', () => {
    const answer = answerAnalyticsQuestion('How do I get more people to open my work?', review, {
      profileViews: 40,
      projectViews: 0,
      researchViews: 0,
    });
    expect(answer).toMatch(/stopping|strongest project/i);
  });

  it('seeds a sample thread from the first prompt', () => {
    const thread = buildSampleCoachThread(review);
    expect(thread[0]).toEqual({ role: 'user', text: ANALYTICS_COACH_PROMPTS[0] });
    expect(thread[1]?.role).toBe('assistant');
    expect(thread[1]?.text).toContain('DevFlow');
  });

  it('lists the coach on the paid plan', () => {
    expect(ANALYTICS_COACH_PROMPTS.length).toBeGreaterThanOrEqual(3);
    expect(PLANS.pro.features).toContain(ANALYTICS_COACH_FEATURE);
    expect(PLANS.free.features).not.toContain(ANALYTICS_COACH_FEATURE);
  });
});

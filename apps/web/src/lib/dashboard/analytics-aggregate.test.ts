import { describe, expect, it } from 'vitest';
import {
  aggregateOwnerAnalytics,
  readDurationSeconds,
  type AnalyticsEventRow,
} from './analytics-aggregate';

const PROFILE_ID = '11111111-1111-4111-8111-111111111111';
const PROJECT_A = '22222222-2222-4222-8222-222222222222';
const PROJECT_B = '33333333-3333-4333-8333-333333333333';
const PAPER_A = '44444444-4444-4444-8444-444444444444';
const OTHER_PROJECT = '55555555-5555-4555-8555-555555555555';

function event(
  partial: Partial<AnalyticsEventRow> & Pick<AnalyticsEventRow, 'event_type'>,
): AnalyticsEventRow {
  return {
    target_id: null,
    target_type: null,
    metadata: {},
    ...partial,
  };
}

describe('WS08-T006 owner analytics aggregation', () => {
  it('reads only integer positive durations', () => {
    expect(readDurationSeconds({ seconds: 12 })).toBe(12);
    expect(readDurationSeconds({ seconds: 2.5 })).toBe(0);
    expect(readDurationSeconds({ seconds: -1 })).toBe(0);
    expect(readDurationSeconds({})).toBe(0);
  });

  it('aggregates supported metrics without double-counting legacy tables', () => {
    const summary = aggregateOwnerAnalytics({
      profileId: PROFILE_ID,
      displayName: 'Alex',
      profileSlug: 'alex',
      isPublic: true,
      projects: [
        { id: PROJECT_A, title: 'DevFlow', poster_url: null },
        { id: PROJECT_B, title: 'Pulse', poster_url: null },
      ],
      researchPapers: [{ id: PAPER_A, title: 'Retrieval Eval' }],
      profileSources: [{ source: 'qr' }, { source: 'qr' }, { source: 'direct_link' }],
      events: [
        event({ event_type: 'profile_view' }),
        event({ event_type: 'profile_view' }),
        event({
          event_type: 'project_view',
          target_id: PROJECT_A,
          target_type: 'project',
        }),
        event({
          event_type: 'project_view',
          target_id: OTHER_PROJECT,
          target_type: 'project',
        }),
        event({
          event_type: 'link_click',
          target_id: PROJECT_A,
          target_type: 'project',
        }),
        event({ event_type: 'profile_share' }),
        event({ event_type: 'qr_download' }),
        event({
          event_type: 'research_view',
          target_id: PAPER_A,
          target_type: 'research',
        }),
        event({
          event_type: 'paper_download',
          target_id: PAPER_A,
          target_type: 'research',
        }),
        event({
          event_type: 'citation_copy',
          target_id: PAPER_A,
          target_type: 'research',
        }),
        event({
          event_type: 'project_time_spent',
          target_id: PROJECT_A,
          target_type: 'project',
          metadata: { seconds: 15 },
        }),
        event({
          event_type: 'project_time_spent',
          target_id: PROJECT_A,
          target_type: 'project',
          metadata: { seconds: 10 },
        }),
        event({
          event_type: 'time_spent_on_research',
          target_id: PAPER_A,
          target_type: 'research',
          metadata: { seconds: 20 },
        }),
        event({
          event_type: 'time_spent_on_research',
          target_id: PAPER_A,
          target_type: 'research',
          metadata: { seconds: 10 },
        }),
      ],
    });

    expect(summary.profileViews).toBe(2);
    expect(summary.projectViews).toBe(1);
    expect(summary.linkClicks).toBe(1);
    expect(summary.profileShares).toBe(1);
    expect(summary.qrDownloads).toBe(1);
    expect(summary.researchViews).toBe(1);
    expect(summary.pdfDownloads).toBe(1);
    expect(summary.citationCopies).toBe(1);
    expect(summary.projectTimeSpentSec).toBe(25);
    expect(summary.researchTimeSpentSec).toBe(30);
    expect(summary.hasAnyEvents).toBe(true);
    expect(summary.topProjects[0]?.id).toBe(PROJECT_A);
    expect(summary.topProjects[0]?.timeSpentSec).toBe(25);
    expect(summary.topResearch[0]?.avgReadTimeSec).toBe(15);
    expect(summary.sources).toEqual([
      { label: 'QR code', value: 2, pct: 67 },
      { label: 'Direct', value: 1, pct: 33 },
    ]);
  });

  it('returns zeros when the owner has no events', () => {
    const summary = aggregateOwnerAnalytics({
      profileId: PROFILE_ID,
      displayName: 'Alex',
      profileSlug: 'alex',
      isPublic: false,
      projects: [{ id: PROJECT_A, title: 'DevFlow' }],
      researchPapers: [],
      profileSources: [],
      events: [],
    });
    expect(summary.hasAnyEvents).toBe(false);
    expect(summary.profileViews).toBe(0);
    expect(summary.topProjects).toEqual([]);
    expect(summary.sources).toEqual([]);
  });

  it('ignores events for targets the owner does not own', () => {
    const summary = aggregateOwnerAnalytics({
      profileId: PROFILE_ID,
      displayName: 'Alex',
      profileSlug: 'alex',
      isPublic: true,
      projects: [{ id: PROJECT_A, title: 'Mine' }],
      researchPapers: [],
      profileSources: [],
      events: [
        event({
          event_type: 'project_view',
          target_id: OTHER_PROJECT,
          target_type: 'project',
        }),
        event({
          event_type: 'project_time_spent',
          target_id: OTHER_PROJECT,
          target_type: 'project',
          metadata: { seconds: 99 },
        }),
      ],
    });
    expect(summary.projectViews).toBe(0);
    expect(summary.projectTimeSpentSec).toBe(0);
    expect(summary.topProjects).toEqual([]);
  });

  it('orders tied projects deterministically by title', () => {
    const summary = aggregateOwnerAnalytics({
      profileId: PROFILE_ID,
      displayName: 'Alex',
      profileSlug: 'alex',
      isPublic: true,
      projects: [
        { id: PROJECT_B, title: 'Zebra' },
        { id: PROJECT_A, title: 'Alpha' },
      ],
      researchPapers: [],
      profileSources: [],
      events: [
        event({
          event_type: 'project_view',
          target_id: PROJECT_A,
          target_type: 'project',
        }),
        event({
          event_type: 'project_view',
          target_id: PROJECT_B,
          target_type: 'project',
        }),
      ],
    });
    expect(summary.topProjects.map((p) => p.title)).toEqual(['Alpha', 'Zebra']);
  });
});

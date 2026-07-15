import { describe, expect, it, expectTypeOf } from 'vitest';
import {
  analyticsEventSchema,
  analyticsEventTypeSchema,
  type AnalyticsEventInput,
  type AnalyticsEventType,
} from './index';

const PROFILE_ID = '11111111-1111-4111-8111-111111111111';

function parseEvent(event_type: unknown, extra: Record<string, unknown> = {}) {
  return analyticsEventSchema.safeParse({
    profile_id: PROFILE_ID,
    event_type,
    ...extra,
  });
}

describe('WS08-T001 analytics share/QR event types', () => {
  it('preserves existing analytics event types', () => {
    const existing = [
      'profile_view',
      'project_view',
      'link_click',
      'resume_click',
      'research_view',
      'paper_download',
      'citation_copy',
      'abstract_expand',
      'figure_view',
      'related_project_click',
      'time_spent_on_research',
      'project_time_spent',
      'project_section_time_spent',
      'project_section_view',
      'project_section_hover_or_click',
    ] as const;

    for (const event_type of existing) {
      expect(analyticsEventTypeSchema.safeParse(event_type).success).toBe(true);
      expect(parseEvent(event_type).success).toBe(true);
    }
  });

  it('accepts canonical profile_share and qr_download', () => {
    expect(parseEvent('profile_share').success).toBe(true);
    expect(parseEvent('qr_download').success).toBe(true);

    const share = parseEvent('profile_share');
    const download = parseEvent('qr_download');
    expect(share.success && share.data.event_type).toBe('profile_share');
    expect(download.success && download.data.event_type).toBe('qr_download');
  });

  it('rejects misspelled, cased, spaced, and unknown event types', () => {
    const rejected = [
      'PROFILE_SHARE',
      'profile-share',
      'profile share',
      ' profile_share',
      'profile_share ',
      'share',
      'qr',
      'download_qr',
      'shared',
      'qr_download_success',
      '',
      null,
      42,
      undefined,
    ];

    for (const event_type of rejected) {
      expect(analyticsEventTypeSchema.safeParse(event_type).success).toBe(false);
      expect(
        analyticsEventSchema.safeParse({
          profile_id: PROFILE_ID,
          event_type,
        }).success,
      ).toBe(false);
    }

    expect(
      analyticsEventSchema.safeParse({
        profile_id: PROFILE_ID,
      }).success,
    ).toBe(false);
  });

  it('does not widen privacy fields and preserves source/referrer rules', () => {
    const ok = parseEvent('profile_share', {
      source: 'direct_link',
      referrer: 'https://example.com/path',
      session_id: 'session-1',
      metadata: { button: 'share' },
    });
    expect(ok.success).toBe(true);

    expect(
      parseEvent('qr_download', {
        source: 'not-a-real-source',
      }).success,
    ).toBe(false);

    expect(
      parseEvent('profile_share', {
        referrer: 'x'.repeat(2049),
      }).success,
    ).toBe(false);

    // source schema already includes qr for connections; this task does not add QR visit attribution.
    expect(parseEvent('profile_view', { source: 'qr' }).success).toBe(true);
  });

  it('infers TypeScript literals for the new event types', () => {
    expectTypeOf<AnalyticsEventType>().extract<'profile_share'>().toEqualTypeOf<'profile_share'>();
    expectTypeOf<AnalyticsEventType>().extract<'qr_download'>().toEqualTypeOf<'qr_download'>();
    expectTypeOf<AnalyticsEventInput['event_type']>().toEqualTypeOf<AnalyticsEventType>();
  });
});

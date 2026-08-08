import { beforeEach, describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock('@vercel/analytics', () => ({ track }));

import {
  VISITOR_CONVERSION_EVENTS,
  trackVisitorConversionEvent,
} from './visitor-conversion';

describe('visitor conversion analytics', () => {
  beforeEach(() => {
    track.mockReset();
  });

  it('tracks each allowlisted event with bounded context properties', () => {
    for (const event of VISITOR_CONVERSION_EVENTS) {
      trackVisitorConversionEvent({
        event,
        context: 'landing',
        profileId: '11111111-1111-4111-8111-111111111111',
      });
    }

    expect(track).toHaveBeenCalledTimes(VISITOR_CONVERSION_EVENTS.length);
    expect(track).toHaveBeenCalledWith('visitor_prompt_viewed', {
      route_context: 'landing',
      demo: false,
      profile_id: '11111111-1111-4111-8111-111111111111',
    });
  });

  it('keeps demo events separate from real profile analytics', () => {
    trackVisitorConversionEvent({
      event: 'visitor_prompt_signup_clicked',
      context: 'live_demo',
      profileId: '11111111-1111-4111-8111-111111111111',
    });
    expect(track).toHaveBeenCalledWith('visitor_prompt_signup_clicked', {
      route_context: 'live_demo',
      demo: true,
    });
  });

  it('does not throw when analytics fails', () => {
    track.mockImplementationOnce(() => {
      throw new Error('analytics unavailable');
    });
    expect(() =>
      trackVisitorConversionEvent({
        event: 'visitor_prompt_dismissed',
        context: 'landing',
      }),
    ).not.toThrow();
  });
});

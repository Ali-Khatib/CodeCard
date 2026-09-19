import { describe, expect, it } from 'vitest';
import { followUpDisplayDateToIso, followUpsToHomeItems } from './connections-summary';
import { DEMO_CONNECTIONS } from './workspace-demo';

describe('home follow-up calendar dates', () => {
  it('keeps display dates on the same calendar day in UTC', () => {
    expect(followUpDisplayDateToIso('Sep 22, 2026')).toBe('2026-09-22T12:00:00.000Z');
  });

  it('maps demo scheduled follow-ups onto September 2026', () => {
    const keys = followUpsToHomeItems(DEMO_CONNECTIONS).map((item) => item.followUpAt.slice(0, 10));
    expect(keys).toEqual(['2026-09-21', '2026-09-22', '2026-09-30']);
  });
});

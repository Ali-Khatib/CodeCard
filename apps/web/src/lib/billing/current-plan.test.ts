import { describe, expect, it } from 'vitest';
import {
  currentPlanHint,
  formatCurrentPlanLabel,
  resolveAccountPlanId,
} from './current-plan';

describe('current plan display', () => {
  it('defaults unsigned / free users to Free', () => {
    expect(resolveAccountPlanId(null)).toBe('free');
    expect(resolveAccountPlanId(undefined)).toBe('free');
    expect(resolveAccountPlanId('canceled')).toBe('free');
    expect(formatCurrentPlanLabel('free')).toBe('Free');
    expect(currentPlanHint('free')).toContain('Upgrade anytime');
  });

  it('shows Pro only for active or trialing subscriptions', () => {
    expect(resolveAccountPlanId('active')).toBe('pro');
    expect(resolveAccountPlanId('trialing')).toBe('pro');
    expect(formatCurrentPlanLabel('pro')).toMatch(/^Pro · \$/);
    expect(currentPlanHint('pro')).toBe('Renews monthly');
  });
});

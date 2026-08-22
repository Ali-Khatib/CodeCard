import { afterEach, describe, expect, it } from 'vitest';
import {
  currentPlanHint,
  formatCurrentPlanLabel,
  resolveAccountPlanId,
} from './current-plan';

const ORIGINAL = process.env.STRIPE_PRO_PRICE_ID;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.STRIPE_PRO_PRICE_ID;
  else process.env.STRIPE_PRO_PRICE_ID = ORIGINAL;
});

describe('current plan display', () => {
  it('defaults unsigned / free users to Free', () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_allowlisted';
    expect(resolveAccountPlanId(null)).toBe('free');
    expect(resolveAccountPlanId(undefined)).toBe('free');
    expect(resolveAccountPlanId('canceled', 'price_pro_allowlisted')).toBe('free');
    expect(formatCurrentPlanLabel('free')).toBe('Free');
    expect(currentPlanHint('free')).toContain('Upgrade anytime');
  });

  it('shows Pro only for active/trialing on the allowlisted price', () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_allowlisted';
    expect(resolveAccountPlanId('active', 'price_pro_allowlisted')).toBe('pro');
    expect(resolveAccountPlanId('trialing', 'price_pro_allowlisted')).toBe('pro');
    expect(resolveAccountPlanId('active', 'price_wrong')).toBe('free');
    expect(resolveAccountPlanId('active')).toBe('free');
    expect(formatCurrentPlanLabel('pro')).toMatch(/^Pro · \$/);
    expect(currentPlanHint('pro')).toBe('Renews monthly');
  });
});

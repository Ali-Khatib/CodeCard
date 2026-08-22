import { afterEach, describe, expect, it } from 'vitest';
import {
  getConfiguredProStripePriceId,
  grantsProEntitlement,
  isAllowlistedProStripePriceId,
} from './pro-price';

const ORIGINAL = process.env.STRIPE_PRO_PRICE_ID;

afterEach(() => {
  if (ORIGINAL === undefined) {
    delete process.env.STRIPE_PRO_PRICE_ID;
  } else {
    process.env.STRIPE_PRO_PRICE_ID = ORIGINAL;
  }
});

describe('Pro Stripe price allowlist', () => {
  it('reads only a configured price_ id', () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_allowlisted';
    expect(getConfiguredProStripePriceId()).toBe('price_pro_allowlisted');
    expect(isAllowlistedProStripePriceId('price_pro_allowlisted')).toBe(true);
    expect(isAllowlistedProStripePriceId('price_attacker_other')).toBe(false);
  });

  it('denies Pro when price is missing or env unset', () => {
    delete process.env.STRIPE_PRO_PRICE_ID;
    expect(grantsProEntitlement('active', 'price_anything')).toBe(false);

    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_allowlisted';
    expect(grantsProEntitlement('active', null)).toBe(false);
    expect(grantsProEntitlement('active', 'price_wrong')).toBe(false);
  });

  it('grants Pro only for active/trialing + allowlisted price', () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_allowlisted';
    expect(grantsProEntitlement('active', 'price_pro_allowlisted')).toBe(true);
    expect(grantsProEntitlement('trialing', 'price_pro_allowlisted')).toBe(true);
    expect(grantsProEntitlement('canceled', 'price_pro_allowlisted')).toBe(false);
    expect(grantsProEntitlement('active', 'price_attacker')).toBe(false);
  });
});

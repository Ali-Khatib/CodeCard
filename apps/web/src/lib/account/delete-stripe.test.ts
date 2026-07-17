import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  clearAccountDeletionCapabilitiesForTests,
  evaluateAccountDeletionReadiness,
  registerT004ScaffoldCapabilities,
  registerAccountDeletionCapability,
  ACCOUNT_DELETION_CAPABILITY_IDS,
} from './delete-capabilities';
import {
  buildStripeCancelIdempotencyKey,
  cancelTrustedAccountStripeSubscription,
  isStripeCancellationConfigured,
  registerStripeCancellationCapability,
  sanitizeStripeDeletionError,
  type TrustedStripeCancellationContext,
} from './delete-stripe';
import { registerAuthUserDeletionCapability } from './delete-auth-user';
import { ACCOUNT_DELETION_INTENDED_ORDER } from './delete-orchestrator';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

const OWNER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OWNER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TENANT_A = '11111111-1111-4111-8111-111111111111';

function baseCtx(
  overrides: Partial<TrustedStripeCancellationContext> = {},
): TrustedStripeCancellationContext {
  return {
    authenticatedUserId: OWNER_A,
    trustedOwnerUserId: OWNER_A,
    tenantId: TENANT_A,
    correlationId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    ...overrides,
  };
}

type SubRow = {
  id: string;
  user_id: string;
  tenant_id: string;
  stripe_subscription_id: string;
  status: string;
};

function createDb(state: {
  customer?: {
    id: string;
    user_id: string;
    tenant_id: string;
    stripe_customer_id: string;
  } | null;
  subscriptions?: SubRow[];
}) {
  let customer = state.customer === undefined ? null : state.customer;
  let subscriptions = [...(state.subscriptions ?? [])];
  const deletedUsersTouched: string[] = [];

  const from = (table: string) => {
    if (table === 'subscription_customers') {
      return {
        select: () => ({
          eq: (_col: string, userId: string) => ({
            maybeSingle: async () => {
              if (customer && customer.user_id === userId) {
                return { data: customer, error: null };
              }
              return { data: null, error: null };
            },
          }),
        }),
        delete: () => ({
          eq: async (_col: string, userId: string) => {
            deletedUsersTouched.push(userId);
            if (customer?.user_id === userId) customer = null;
            return { error: null };
          },
        }),
      };
    }
    if (table === 'subscriptions') {
      return {
        select: () => ({
          eq: (_col: string, userId: string) => ({
            then: undefined,
            // mimic thenable chain used as await on eq result... our code awaits .eq() which returns builder
          }),
        }),
        // Override with simpler chain matching our helper usage:
      };
    }
    throw new Error(`unexpected table ${table}`);
  };

  // Rebuild with correct supabase-like chaining
  const client = {
    from: (table: string) => {
      if (table === 'subscription_customers') {
        return {
          select: () => ({
            eq: (_c: string, userId: string) => ({
              maybeSingle: async () => ({
                data: customer && customer.user_id === userId ? customer : null,
                error: null,
              }),
            }),
          }),
          delete: () => ({
            eq: async (_c: string, userId: string) => {
              deletedUsersTouched.push(`customer:${userId}`);
              if (customer?.user_id === userId) customer = null;
              return { error: null };
            },
          }),
        };
      }
      if (table === 'subscriptions') {
        return {
          select: () => ({
            eq: async (_c: string, userId: string) => ({
              data: subscriptions.filter((s) => s.user_id === userId),
              error: null,
            }),
          }),
          delete: () => ({
            eq: async (_c: string, userId: string) => {
              deletedUsersTouched.push(`subs:${userId}`);
              subscriptions = subscriptions.filter((s) => s.user_id !== userId);
              return { error: null };
            },
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };

  return { client, deletedUsersTouched, getCustomer: () => customer, getSubs: () => subscriptions };
}

function createStripe(state: {
  byCustomer: Record<string, Array<{ id: string; status: string; customer: string }>>;
  cancelImpl?: (id: string) => Promise<unknown>;
  listError?: unknown;
}) {
  const canceled: string[] = [];
  const idempotencyKeys: string[] = [];
  return {
    canceled,
    idempotencyKeys,
    stripe: {
      subscriptions: {
        list: async (params: { customer: string }) => {
          if (state.listError) throw state.listError;
          return { data: state.byCustomer[params.customer] ?? [] };
        },
        cancel: async (id: string, _params: unknown, options?: { idempotencyKey?: string }) => {
          if (options?.idempotencyKey) idempotencyKeys.push(options.idempotencyKey);
          if (state.cancelImpl) {
            await state.cancelImpl(id);
          }
          canceled.push(id);
          return { id, status: 'canceled' };
        },
        retrieve: async (id: string) => {
          for (const list of Object.values(state.byCustomer)) {
            const found = list.find((s) => s.id === id);
            if (found) return found;
          }
          const err = Object.assign(new Error('No such subscription'), {
            code: 'resource_missing',
            statusCode: 404,
          });
          throw err;
        },
      },
    },
  };
}

describe('WS10-T006 Stripe cancellation', () => {
  const originalStripe = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    clearAccountDeletionCapabilitiesForTests();
    process.env.STRIPE_SECRET_KEY = 'sk_test_account_deletion_fixture';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
  });

  afterEach(() => {
    if (originalStripe === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = originalStripe;
  });

  it('fails closed without Stripe configuration', () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(isStripeCancellationConfigured()).toBe(false);
    registerStripeCancellationCapability();
    const readiness = evaluateAccountDeletionReadiness();
    expect(readiness.ready).toBe(false);
    if (!readiness.ready) expect(readiness.missing).toContain('stripe_cancellation');
  });

  it('registers with other capabilities for readiness', () => {
    registerT004ScaffoldCapabilities();
    registerAuthUserDeletionCapability();
    registerStripeCancellationCapability();
    for (const id of ACCOUNT_DELETION_CAPABILITY_IDS) {
      if (
        id === 'local_content' ||
        id === 'storage_cleanup' ||
        id === 'auth_user_deletion' ||
        id === 'stripe_cancellation'
      ) {
        continue;
      }
      registerAccountDeletionCapability({ id, label: id, isAvailable: () => true });
    }
    expect(evaluateAccountDeletionReadiness()).toEqual({ ready: true });
  });

  it('proceeds safely with no customer / no subscription', async () => {
    const db = createDb({ customer: null, subscriptions: [] });
    const stripe = createStripe({ byCustomer: {} });
    const result = await cancelTrustedAccountStripeSubscription(
      db.client as never,
      stripe.stripe as never,
      baseCtx(),
    );
    expect(result).toEqual({
      ok: true,
      outcome: 'no_customer',
      canceledSubscriptionIds: [],
    });
    expect(stripe.canceled).toEqual([]);
  });

  it('cancels an active test subscription and clears local links', async () => {
    const db = createDb({
      customer: {
        id: 'cust-row',
        user_id: OWNER_A,
        tenant_id: TENANT_A,
        stripe_customer_id: 'cus_A',
      },
      subscriptions: [
        {
          id: 'sub-row',
          user_id: OWNER_A,
          tenant_id: TENANT_A,
          stripe_subscription_id: 'sub_active',
          status: 'active',
        },
      ],
    });
    const stripe = createStripe({
      byCustomer: {
        cus_A: [{ id: 'sub_active', status: 'active', customer: 'cus_A' }],
      },
    });

    const result = await cancelTrustedAccountStripeSubscription(
      db.client as never,
      stripe.stripe as never,
      baseCtx(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.outcome).toBe('canceled');
    expect(result.canceledSubscriptionIds).toEqual(['sub_active']);
    expect(stripe.canceled).toEqual(['sub_active']);
    expect(stripe.idempotencyKeys[0]).toBe(
      buildStripeCancelIdempotencyKey(baseCtx().correlationId, 'sub_active'),
    );
    expect(db.getCustomer()).toBeNull();
    expect(db.getSubs()).toEqual([]);
  });

  it('cancels trialing subscriptions', async () => {
    const db = createDb({
      customer: {
        id: 'cust-row',
        user_id: OWNER_A,
        tenant_id: TENANT_A,
        stripe_customer_id: 'cus_A',
      },
      subscriptions: [
        {
          id: 'sub-row',
          user_id: OWNER_A,
          tenant_id: TENANT_A,
          stripe_subscription_id: 'sub_trial',
          status: 'trialing',
        },
      ],
    });
    const stripe = createStripe({
      byCustomer: {
        cus_A: [{ id: 'sub_trial', status: 'trialing', customer: 'cus_A' }],
      },
    });
    const result = await cancelTrustedAccountStripeSubscription(
      db.client as never,
      stripe.stripe as never,
      baseCtx(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.canceledSubscriptionIds).toEqual(['sub_trial']);
  });

  it('treats already canceled / missing remote as resolved', async () => {
    const db = createDb({
      customer: {
        id: 'cust-row',
        user_id: OWNER_A,
        tenant_id: TENANT_A,
        stripe_customer_id: 'cus_A',
      },
      subscriptions: [
        {
          id: 'sub-row',
          user_id: OWNER_A,
          tenant_id: TENANT_A,
          stripe_subscription_id: 'sub_old',
          status: 'canceled',
        },
      ],
    });
    const stripe = createStripe({
      byCustomer: {
        cus_A: [{ id: 'sub_old', status: 'canceled', customer: 'cus_A' }],
      },
    });
    const result = await cancelTrustedAccountStripeSubscription(
      db.client as never,
      stripe.stripe as never,
      baseCtx(),
    );
    expect(result).toEqual({
      ok: true,
      outcome: 'already_canceled',
      canceledSubscriptionIds: [],
    });
    expect(stripe.canceled).toEqual([]);
    expect(db.getCustomer()).toBeNull();
  });

  it('handles remote object missing without failing closed', async () => {
    const db = createDb({
      customer: {
        id: 'cust-row',
        user_id: OWNER_A,
        tenant_id: TENANT_A,
        stripe_customer_id: 'cus_gone',
      },
      subscriptions: [],
    });
    const stripe = createStripe({
      byCustomer: {},
      listError: Object.assign(new Error('No such customer'), {
        code: 'resource_missing',
        statusCode: 404,
      }),
    });
    const result = await cancelTrustedAccountStripeSubscription(
      db.client as never,
      stripe.stripe as never,
      baseCtx(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.outcome).toBe('no_cancellable_subscription');
  });

  it('blocks on retryable Stripe failure so later deletion stages do not run', async () => {
    const db = createDb({
      customer: {
        id: 'cust-row',
        user_id: OWNER_A,
        tenant_id: TENANT_A,
        stripe_customer_id: 'cus_A',
      },
      subscriptions: [
        {
          id: 'sub-row',
          user_id: OWNER_A,
          tenant_id: TENANT_A,
          stripe_subscription_id: 'sub_active',
          status: 'active',
        },
      ],
    });
    const stripe = createStripe({
      byCustomer: {
        cus_A: [{ id: 'sub_active', status: 'active', customer: 'cus_A' }],
      },
      cancelImpl: async () => {
        throw Object.assign(new Error('network'), { type: 'StripeConnectionError' });
      },
    });
    const result = await cancelTrustedAccountStripeSubscription(
      db.client as never,
      stripe.stripe as never,
      baseCtx(),
    );
    expect(result).toEqual({ ok: false, reason: 'stripe_error' });
    expect(db.getCustomer()?.stripe_customer_id).toBe('cus_A');
    expect(sanitizeStripeDeletionError(new Error('secret cus_live'))).toBe(
      'stripe_cancellation_error',
    );
    expect(JSON.stringify(result)).not.toContain('cus_');
  });

  it('fails closed on unexpected multiple cancellable subscriptions', async () => {
    const db = createDb({
      customer: {
        id: 'cust-row',
        user_id: OWNER_A,
        tenant_id: TENANT_A,
        stripe_customer_id: 'cus_A',
      },
      subscriptions: [],
    });
    const stripe = createStripe({
      byCustomer: {
        cus_A: [
          { id: 'sub_1', status: 'active', customer: 'cus_A' },
          { id: 'sub_2', status: 'trialing', customer: 'cus_A' },
        ],
      },
    });
    const result = await cancelTrustedAccountStripeSubscription(
      db.client as never,
      stripe.stripe as never,
      baseCtx(),
    );
    expect(result).toEqual({ ok: false, reason: 'multiple_cancellable' });
  });

  it('is idempotent under repeated execution with the same correlation id', async () => {
    const db = createDb({
      customer: {
        id: 'cust-row',
        user_id: OWNER_A,
        tenant_id: TENANT_A,
        stripe_customer_id: 'cus_A',
      },
      subscriptions: [
        {
          id: 'sub-row',
          user_id: OWNER_A,
          tenant_id: TENANT_A,
          stripe_subscription_id: 'sub_active',
          status: 'active',
        },
      ],
    });
    const stripe = createStripe({
      byCustomer: {
        cus_A: [{ id: 'sub_active', status: 'active', customer: 'cus_A' }],
      },
    });
    const first = await cancelTrustedAccountStripeSubscription(
      db.client as never,
      stripe.stripe as never,
      baseCtx(),
    );
    expect(first.ok).toBe(true);
    const second = await cancelTrustedAccountStripeSubscription(
      db.client as never,
      stripe.stripe as never,
      baseCtx(),
    );
    expect(second).toEqual({
      ok: true,
      outcome: 'no_customer',
      canceledSubscriptionIds: [],
    });
  });

  it('rejects spoofed owner targets and leaves another user untouched', async () => {
    const db = createDb({
      customer: {
        id: 'cust-b',
        user_id: OWNER_B,
        tenant_id: TENANT_A,
        stripe_customer_id: 'cus_B',
      },
      subscriptions: [
        {
          id: 'sub-b',
          user_id: OWNER_B,
          tenant_id: TENANT_A,
          stripe_subscription_id: 'sub_b',
          status: 'active',
        },
      ],
    });
    const stripe = createStripe({
      byCustomer: {
        cus_B: [{ id: 'sub_b', status: 'active', customer: 'cus_B' }],
      },
    });
    const spoofed = await cancelTrustedAccountStripeSubscription(
      db.client as never,
      stripe.stripe as never,
      baseCtx({ trustedOwnerUserId: OWNER_B }),
    );
    expect(spoofed).toEqual({ ok: false, reason: 'target_mismatch' });
    expect(stripe.canceled).toEqual([]);
    expect(db.getSubs().some((s) => s.user_id === OWNER_B)).toBe(true);
  });

  it('documents Stripe cancellation before Auth deletion', () => {
    expect(
      ACCOUNT_DELETION_INTENDED_ORDER.indexOf('cancel_stripe_or_verify_no_subscription'),
    ).toBeLessThan(ACCOUNT_DELETION_INTENDED_ORDER.indexOf('delete_approved_local_content'));
    expect(
      ACCOUNT_DELETION_INTENDED_ORDER.indexOf('cancel_stripe_or_verify_no_subscription'),
    ).toBeLessThan(ACCOUNT_DELETION_INTENDED_ORDER.indexOf('delete_supabase_auth_user_last'));
  });

  it('webhook skips recreating linkage when profile is gone', () => {
    const webhook = read('src/app/api/webhooks/stripe/route.ts');
    expect(webhook).toContain('subscription_customers');
    expect(webhook).toContain('no_profile');
    expect(webhook).toContain('owner_user_id');
  });

  it('keeps Stripe IDs out of the public delete route', () => {
    const route = read('src/app/api/account/delete/route.ts');
    expect(route).not.toContain('stripe_customer_id');
    expect(route).not.toContain('subscriptions.cancel');
    expect(route).not.toContain('STRIPE_SECRET_KEY');
  });
});

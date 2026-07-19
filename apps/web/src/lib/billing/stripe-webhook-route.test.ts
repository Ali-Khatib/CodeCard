import { describe, expect, it, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Stripe from 'stripe';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webhooks/stripe/route';
import { processStripeWebhookRequest } from '@/lib/billing/stripe-webhook-core';

const getStripeMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/stripe', () => ({
  getStripe: getStripeMock,
}));

const WEBHOOK_SECRET = 'whsec_test_ws11_t011_codecard_secret';
const stripe = new Stripe('sk_test_ws11t011fixture', {
  apiVersion: '2025-02-24.acacia',
});

type EventRow = {
  id: string;
  stripe_event_id: string;
  event_type: string;
  status: 'processing' | 'completed' | 'failed';
  payload: Record<string, unknown>;
  processed_at: string | null;
  attempt_count: number;
  failure_code: string | null;
};

type CustomerRow = { user_id: string; tenant_id: string; stripe_customer_id: string };
type ProfileRow = { id: string; owner_user_id: string };
type SubscriptionRow = {
  tenant_id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
};

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

function readRepo(rel: string) {
  return readFileSync(resolve(process.cwd(), '../..', rel), 'utf8');
}

function subscriptionObject(overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: 'sub_test_ws11',
    object: 'subscription',
    customer: 'cus_test_ws11',
    status: 'active',
    cancel_at_period_end: false,
    current_period_start: now,
    current_period_end: now + 30 * 24 * 3600,
    items: {
      object: 'list',
      data: [{ id: 'si_test', price: { id: 'price_test_ws11' } }],
    },
    ...overrides,
  };
}

function buildEvent(type: string, id: string, object: unknown) {
  return {
    id,
    object: 'event',
    api_version: '2025-02-24.acacia',
    created: Math.floor(Date.now() / 1000),
    type,
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    data: { object },
  };
}

function signedRequest(payload: object) {
  const body = JSON.stringify(payload);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret: WEBHOOK_SECRET,
  });
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': signature,
    },
    body,
  });
}

function createMemoryDb(state: {
  customers?: CustomerRow[];
  profiles?: ProfileRow[];
  subscriptions?: SubscriptionRow[];
  failUpsertOnce?: boolean;
}) {
  const events = new Map<string, EventRow>();
  const customers = [...(state.customers ?? [])];
  const profiles = [...(state.profiles ?? [])];
  let subscriptions = [...(state.subscriptions ?? [])];
  let failUpsertOnce = Boolean(state.failUpsertOnce);
  let upsertCount = 0;
  let cancelCount = 0;
  let claimInsertAttempts = 0;

  let chain: Promise<unknown> = Promise.resolve();
  function serialize<T>(fn: () => T | Promise<T>): Promise<T> {
    const run = chain.then(fn, fn) as Promise<T>;
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  function matches(row: EventRow, filters: Array<[string, string]>) {
    return filters.every(([col, value]) => {
      if (col === 'stripe_event_id') return row.stripe_event_id === value;
      if (col === 'status') return row.status === value;
      return true;
    });
  }

  function billingUpdate(patch: Partial<EventRow>) {
    const filters: Array<[string, string]> = [];

    const execute = () =>
      serialize(async () => {
        const eventId = filters.find(([c]) => c === 'stripe_event_id')?.[1];
        const row = eventId ? events.get(eventId) : undefined;
        if (!row || !matches(row, filters)) {
          return { data: null, error: null };
        }
        Object.assign(row, patch);
        return { data: { id: row.id }, error: null };
      });

    const api: {
      eq: (col: string, value: string) => typeof api;
      select: (cols: string) => { maybeSingle: () => Promise<{ data: { id: string } | null; error: null }> };
      then: PromiseLike<{ data: unknown; error: null }>['then'];
    } = {
      eq(col: string, value: string) {
        filters.push([col, value]);
        return api;
      },
      select(_cols: string) {
        return {
          maybeSingle: async () => {
            const result = await execute();
            return { data: result.data, error: null };
          },
        };
      },
      then(onFulfilled, onRejected) {
        return execute().then(onFulfilled, onRejected);
      },
    };

    return api;
  }

  const supabase = {
    from(table: string) {
      if (table === 'billing_events') {
        return {
          insert(row: Omit<EventRow, 'id'>) {
            return serialize(async () => {
              claimInsertAttempts += 1;
              if (events.has(row.stripe_event_id)) {
                return {
                  data: null,
                  error: {
                    code: '23505',
                    message: 'duplicate key value violates unique constraint',
                  },
                };
              }
              const stored: EventRow = {
                id: `be_${events.size + 1}`,
                stripe_event_id: row.stripe_event_id,
                event_type: row.event_type,
                status: row.status,
                payload: row.payload,
                processed_at: row.processed_at,
                attempt_count: row.attempt_count,
                failure_code: row.failure_code,
              };
              events.set(stored.stripe_event_id, stored);
              return { data: null, error: null };
            });
          },
          select(_cols: string) {
            return {
              eq(col: string, value: string) {
                return {
                  maybeSingle: async () =>
                    serialize(async () => {
                      if (col !== 'stripe_event_id') return { data: null, error: null };
                      return { data: events.get(value) ?? null, error: null };
                    }),
                };
              },
            };
          },
          update(patch: Partial<EventRow>) {
            return billingUpdate(patch);
          },
        };
      }

      if (table === 'subscription_customers') {
        return {
          select() {
            return {
              eq(_col: string, customerId: string) {
                return {
                  maybeSingle: async () => ({
                    data: customers.find((c) => c.stripe_customer_id === customerId) ?? null,
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }

      if (table === 'profiles') {
        return {
          select() {
            return {
              eq(_col: string, ownerId: string) {
                return {
                  maybeSingle: async () => ({
                    data: profiles.find((p) => p.owner_user_id === ownerId) ?? null,
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }

      if (table === 'subscriptions') {
        return {
          upsert: async (row: SubscriptionRow) => {
            upsertCount += 1;
            if (failUpsertOnce) {
              failUpsertOnce = false;
              return {
                data: null,
                error: { message: 'transient upsert failure', code: '40001' },
              };
            }
            const idx = subscriptions.findIndex(
              (s) => s.stripe_subscription_id === row.stripe_subscription_id,
            );
            if (idx >= 0) subscriptions[idx] = row;
            else subscriptions.push(row);
            return { data: null, error: null };
          },
          update(patch: Partial<SubscriptionRow>) {
            return {
              eq: async (_col: string, subId: string) => {
                cancelCount += 1;
                subscriptions = subscriptions.map((s) =>
                  s.stripe_subscription_id === subId ? { ...s, ...patch } : s,
                );
                return { data: null, error: null };
              },
            };
          },
        };
      }

      throw new Error(`unexpected table ${table}`);
    },
  };

  return {
    client: supabase as never,
    events,
    get subscriptions() {
      return subscriptions;
    },
    get upsertCount() {
      return upsertCount;
    },
    get cancelCount() {
      return cancelCount;
    },
    get claimInsertAttempts() {
      return claimInsertAttempts;
    },
  };
}

const baseCustomer: CustomerRow = {
  user_id: 'user_a',
  tenant_id: 'tenant_a',
  stripe_customer_id: 'cus_test_ws11',
};
const baseProfile: ProfileRow = { id: 'profile_a', owner_user_id: 'user_a' };

async function handle(request: NextRequest, db: ReturnType<typeof createMemoryDb>) {
  return processStripeWebhookRequest(request, {
    getWebhookSecret: () => WEBHOOK_SECRET,
    constructEvent: (body, signature, secret) =>
      stripe.webhooks.constructEvent(body, signature, secret),
    getServiceClient: async () => db.client,
  });
}

describe('WS11-T011 Stripe webhook hardening', () => {
  beforeEach(() => {
    expect(POST).toBeTypeOf('function');
  });

  it('documents ledger processing state and keeps unique event ids', () => {
    const migration = readRepo(
      'supabase/migrations/20260717120001_billing_events_processing_state.sql',
    );
    const docs = readRepo('docs/STRIPE_WEBHOOK_SECURITY.md');
    const core = read('src/lib/billing/stripe-webhook-core.ts');
    const route = read('src/app/api/webhooks/stripe/route.ts');

    expect(migration).toContain("CHECK (status IN ('processing', 'completed', 'failed'))");
    expect(migration).toContain('ALTER COLUMN processed_at DROP NOT NULL');
    expect(migration).toContain('REVOKE ALL ON TABLE billing_events FROM anon');
    expect(docs).toContain('constructEvent');
    expect(docs).toContain('409');
    expect(core).toContain('constructEvent');
    expect(core).toContain("status: 'processing'");
    expect(core).toContain("status: 'completed'");
    expect(core).toContain("status: 'failed'");
    expect(core).not.toContain('console.log');
    expect(route).toContain('processStripeWebhookRequest');
  });

  it('rejects missing signature', async () => {
    const db = createMemoryDb({ customers: [baseCustomer], profiles: [baseProfile] });
    const body = JSON.stringify(
      buildEvent('customer.subscription.updated', 'evt_miss', subscriptionObject()),
    );
    const request = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
    const res = await handle(request, db);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'Missing signature' });
    expect(JSON.stringify(json)).not.toContain(WEBHOOK_SECRET);
    expect(JSON.stringify(json)).not.toContain(body);
    expect(db.events.size).toBe(0);
  });

  it('rejects invalid signature', async () => {
    const db = createMemoryDb({ customers: [baseCustomer], profiles: [baseProfile] });
    const payload = buildEvent('customer.subscription.updated', 'evt_bad', subscriptionObject());
    const body = JSON.stringify(payload);
    const request = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 't=1,v1=deadbeef',
      },
      body,
    });
    const res = await handle(request, db);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'Invalid signature' });
    expect(JSON.stringify(json)).not.toContain(WEBHOOK_SECRET);
    expect(JSON.stringify(json)).not.toContain('"evt_bad"');
    expect(db.events.size).toBe(0);
  });

  it('accepts a valid signature and preserves the exact raw body for verification', async () => {
    const db = createMemoryDb({ customers: [baseCustomer], profiles: [baseProfile] });
    const payload = buildEvent('customer.subscription.updated', 'evt_ok', subscriptionObject());
    const body = JSON.stringify(payload);
    let seenBody: string | null = null;
    const res = await processStripeWebhookRequest(signedRequest(payload), {
      getWebhookSecret: () => WEBHOOK_SECRET,
      constructEvent: (raw, signature, secret) => {
        seenBody = raw;
        return stripe.webhooks.constructEvent(raw, signature, secret);
      },
      getServiceClient: async () => db.client,
    });
    expect(res.status).toBe(200);
    expect(seenBody).toBe(body);
    expect(db.upsertCount).toBe(1);
    expect(db.events.get('evt_ok')?.status).toBe('completed');
  });

  it('safely acknowledges an unsupported but valid event', async () => {
    const db = createMemoryDb({ customers: [baseCustomer], profiles: [baseProfile] });
    const payload = buildEvent('invoice.paid', 'evt_ignored', {
      id: 'in_test',
      object: 'invoice',
    });
    const res = await handle(signedRequest(payload), db);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, ignored: true });
    expect(db.upsertCount).toBe(0);
    expect(db.events.get('evt_ignored')?.status).toBe('completed');
  });

  it('performs the subscription upsert for a supported event', async () => {
    const db = createMemoryDb({ customers: [baseCustomer], profiles: [baseProfile] });
    const payload = buildEvent(
      'customer.subscription.created',
      'evt_create',
      subscriptionObject(),
    );
    const res = await handle(signedRequest(payload), db);
    expect(res.status).toBe(200);
    expect(db.subscriptions).toHaveLength(1);
    expect(db.subscriptions[0]?.stripe_subscription_id).toBe('sub_test_ws11');
    expect(db.subscriptions[0]?.status).toBe('active');
  });

  it('delivers the same event twice with only one mutation', async () => {
    const db = createMemoryDb({ customers: [baseCustomer], profiles: [baseProfile] });
    const payload = buildEvent('customer.subscription.updated', 'evt_dup', subscriptionObject());
    const first = await handle(signedRequest(payload), db);
    const second = await handle(signedRequest(payload), db);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({ received: true, duplicate: true });
    expect(db.upsertCount).toBe(1);
    expect(db.events.get('evt_dup')?.status).toBe('completed');
  });

  it('handles concurrent duplicate delivery with a single mutation', async () => {
    const db = createMemoryDb({ customers: [baseCustomer], profiles: [baseProfile] });
    const payload = buildEvent('customer.subscription.updated', 'evt_race', subscriptionObject());
    const [a, b] = await Promise.all([
      handle(signedRequest(payload), db),
      handle(signedRequest(payload), db),
    ]);
    // Safe outcomes: one owner completes (200); peer sees completed duplicate (200)
    // or in-flight processing (409). Never two mutations.
    expect([a.status, b.status].every((s) => s === 200 || s === 409)).toBe(true);
    expect([a.status, b.status].some((s) => s === 200)).toBe(true);
    expect(db.upsertCount).toBe(1);
    expect(db.claimInsertAttempts).toBeGreaterThanOrEqual(2);
    expect(db.events.get('evt_race')?.status).toBe('completed');
  });

  it('returns 409 while another delivery still owns processing', async () => {
    const db = createMemoryDb({ customers: [baseCustomer], profiles: [baseProfile] });
    db.events.set('evt_inflight', {
      id: 'be_seed',
      stripe_event_id: 'evt_inflight',
      event_type: 'customer.subscription.updated',
      status: 'processing',
      payload: {},
      processed_at: null,
      attempt_count: 1,
      failure_code: null,
    });
    const payload = buildEvent(
      'customer.subscription.updated',
      'evt_inflight',
      subscriptionObject(),
    );
    const res = await handle(signedRequest(payload), db);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'Webhook already processing' });
    expect(db.upsertCount).toBe(0);
    expect(db.events.get('evt_inflight')?.status).toBe('processing');
  });

  it('does not mark complete on transient failure and allows a safe retry', async () => {
    const db = createMemoryDb({
      customers: [baseCustomer],
      profiles: [baseProfile],
      failUpsertOnce: true,
    });
    const payload = buildEvent('customer.subscription.updated', 'evt_retry', subscriptionObject());

    const failed = await handle(signedRequest(payload), db);
    expect(failed.status).toBe(500);
    const failedJson = await failed.json();
    expect(failedJson).toEqual({ error: 'Webhook processing failed' });
    expect(JSON.stringify(failedJson)).not.toContain(WEBHOOK_SECRET);
    expect(JSON.stringify(failedJson)).not.toContain('transient upsert failure');
    expect(db.events.get('evt_retry')?.status).toBe('failed');
    expect(db.events.get('evt_retry')?.processed_at).toBeNull();
    expect(db.upsertCount).toBe(1);
    expect(db.subscriptions).toHaveLength(0);

    const retried = await handle(signedRequest(payload), db);
    expect(retried.status).toBe(200);
    expect(db.upsertCount).toBe(2);
    expect(db.subscriptions).toHaveLength(1);
    expect(db.events.get('evt_retry')?.status).toBe('completed');
    expect(db.events.get('evt_retry')?.attempt_count).toBe(2);
    expect(db.events.get('evt_retry')?.processed_at).toBeTruthy();
  });

  it('cancels subscriptions idempotently on deleted events', async () => {
    const db = createMemoryDb({
      customers: [baseCustomer],
      profiles: [baseProfile],
      subscriptions: [
        {
          tenant_id: 'tenant_a',
          user_id: 'user_a',
          stripe_subscription_id: 'sub_test_ws11',
          stripe_price_id: 'price_test_ws11',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date().toISOString(),
          cancel_at_period_end: false,
        },
      ],
    });
    const payload = buildEvent(
      'customer.subscription.deleted',
      'evt_del',
      subscriptionObject({ status: 'canceled' }),
    );
    const first = await handle(signedRequest(payload), db);
    const second = await handle(signedRequest(payload), db);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(db.cancelCount).toBe(1);
    expect(db.subscriptions[0]?.status).toBe('canceled');
  });
});

describe('WS14-T011 Stripe webhook unit coverage gaps', () => {
  beforeEach(() => {
    getStripeMock.mockReset();
  });

  it('skips subscription upsert when no customer mapping exists (no_customer)', async () => {
    const db = createMemoryDb({ profiles: [baseProfile] });
    const payload = buildEvent(
      'customer.subscription.updated',
      'evt_no_customer',
      subscriptionObject(),
    );
    const res = await handle(signedRequest(payload), db);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, skipped: 'no_customer' });
    expect(db.upsertCount).toBe(0);
    expect(db.events.get('evt_no_customer')?.status).toBe('completed');
  });

  it('skips subscription upsert when the mapped profile is gone (no_profile)', async () => {
    const db = createMemoryDb({ customers: [baseCustomer] });
    const payload = buildEvent(
      'customer.subscription.updated',
      'evt_no_profile',
      subscriptionObject(),
    );
    const res = await handle(signedRequest(payload), db);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, skipped: 'no_profile' });
    expect(db.upsertCount).toBe(0);
    expect(db.events.get('evt_no_profile')?.status).toBe('completed');
  });

  it('returns opaque 500 when the service client cannot be created', async () => {
    const payload = buildEvent(
      'customer.subscription.updated',
      'evt_svc_fail',
      subscriptionObject(),
    );
    const res = await processStripeWebhookRequest(signedRequest(payload), {
      getWebhookSecret: () => WEBHOOK_SECRET,
      constructEvent: (body, signature, secret) =>
        stripe.webhooks.constructEvent(body, signature, secret),
      getServiceClient: async () => {
        throw new Error('db down — must never leak');
      },
    });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ error: 'Webhook processing failed' });
    expect(JSON.stringify(json)).not.toContain('db down');
    expect(JSON.stringify(json)).not.toContain(WEBHOOK_SECRET);
  });

  it('never calls the live Stripe SDK when constructEvent is injected', async () => {
    const db = createMemoryDb({ customers: [baseCustomer], profiles: [baseProfile] });
    const payload = buildEvent(
      'customer.subscription.updated',
      'evt_no_live',
      subscriptionObject(),
    );
    const res = await handle(signedRequest(payload), db);
    expect(res.status).toBe(200);
    expect(getStripeMock).not.toHaveBeenCalled();
  });

  it('keeps logs free of webhook secrets and full payment payloads', async () => {
    const core = read('src/lib/billing/stripe-webhook-core.ts');
    expect(core).not.toContain('console.log');
    expect(core).not.toContain('console.info');
    expect(core).toMatch(/never include the webhook secret|Logs must never include/i);

    const db = createMemoryDb({ customers: [baseCustomer], profiles: [baseProfile] });
    const payload = buildEvent(
      'customer.subscription.updated',
      'evt_redact',
      subscriptionObject({
        // Sensitive-looking fields that must never appear in API error responses.
        default_payment_method: 'pm_card_visa_4242',
      }),
    );
    const res = await handle(signedRequest(payload), db);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(JSON.stringify(json)).not.toContain(WEBHOOK_SECRET);
    expect(JSON.stringify(json)).not.toContain('pm_card_visa_4242');
    expect(JSON.stringify(json)).not.toContain('4242');
  });
});

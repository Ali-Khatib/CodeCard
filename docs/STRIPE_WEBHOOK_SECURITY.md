# Stripe webhook security (WS11-T011)

Server-to-server billing webhook contract. Signature verification replaces browser CSRF/origin checks.

## Route

`POST /api/webhooks/stripe` — `apps/web/src/app/api/webhooks/stripe/route.ts`  
Core: `apps/web/src/lib/billing/stripe-webhook-core.ts`

## Signature verification

1. Read the exact raw body once via `readBodyWithLimit` (no `request.json()` before verify).
2. Require `Stripe-Signature`.
3. Verify with `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`.
4. Missing / invalid signature → `400` with opaque `{ error }` (never the secret or raw body).

## Event ledger

Table: `billing_events` (unique `stripe_event_id`).

| Column | Role |
|--------|------|
| `stripe_event_id` | Trusted verified Stripe event id (unique) |
| `event_type` | Stripe event type string |
| `status` | `processing` \| `completed` \| `failed` |
| `payload` | Bounded object snapshot (`event.data.object`), not card data |
| `failure_code` | Safe retry code only |
| `attempt_count` | Claim / retry attempts |
| `processed_at` | Set only when `status = completed` |

RLS forced; no anon/authenticated policies — service role only.

## Processing semantics

| Situation | Behavior |
|-----------|----------|
| New event | Insert `processing` → apply side effects → mark `completed` → `200` |
| Already `completed` | No side effects → `200` `{ duplicate: true }` |
| Concurrent `processing` | Loser sees unique conflict / in-flight → `409` (Stripe retries) |
| `failed` then retry | Reclaim to `processing`, increment `attempt_count`, process again |
| Transient failure | Stay / mark `failed`, return `500` (retryable) — never mark `completed` early |
| Unknown valid type | Acknowledge `completed` with no business mutation |

## Supported events

| Event | Mutation | Idempotency |
|-------|----------|-------------|
| `customer.subscription.created` | Upsert `subscriptions` by `stripe_subscription_id` when customer+profile exist | Upsert on conflict |
| `customer.subscription.updated` | Same | Same; newer Stripe object state wins via upsert |
| `customer.subscription.deleted` | Set `status = canceled` for that subscription id | Repeated cancel is safe |
| Other verified types | None | Ledger completes without side effects |

Missing customer or deleted profile (`created`/`updated`): complete with `{ skipped }` — no subscription write.

## Logging

May log: event id, event type, processing status.  
Must not log: webhook secret, raw body, full Stripe object dumps, auth headers, cookies, card data.

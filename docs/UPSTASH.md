# Upstash Redis rate limiting (WS14-T016)

Canonical setup for durable rate limits on CodeCard sensitive routes.
**No secret values belong in this file.** Companion: [`VERCEL_ENVIRONMENT.md`](./VERCEL_ENVIRONMENT.md).

---

## 1. Application wiring (already implemented)

| Piece | Location |
|-------|----------|
| Redis client + limiters | `apps/web/src/lib/rate-limit.ts` |
| Shared budgets | `packages/config` → `RATE_LIMITS` |
| JSON route wrapper | `apps/web/src/lib/security/secure-route.ts` |
| Bounded verify probe | `GET /api/internal/rate-limit-verify` (gated) |

Sensitive types (`ai`, `upload`, `auth`) **fail closed** in production when Redis is missing (except isolated `CODECARD_E2E=1`). Other types fail open without Redis. Routes with `strictRateLimit: true` return 503 when `UPSTASH_REDIS_REST_URL` is absent.

Do not put complete emails, tokens, or raw cookies in Redis keys. Prefer opaque user ids / hashed IPs already used by route wrappers.

---

## 2. Environment variables (names only)

| Variable | Visibility | Scopes | Notes |
|----------|------------|--------|-------|
| `UPSTASH_REDIS_REST_URL` | server-only | Production, Preview | REST URL from Upstash console |
| `UPSTASH_REDIS_REST_TOKEN` | server-only | Production, Preview | REST token — never `NEXT_PUBLIC_` |
| `CODECARD_RATE_LIMIT_VERIFY` | server | temporary only | Set to `1` for the bounded 429 probe, then **unset** |

Never set Upstash credentials on Production from the isolated E2E project. For MVP, `codecard-mvp` may share one non-prod Upstash database across Preview + Production of that project.

---

## 3. Manual Upstash + Vercel gate

1. Open [Upstash Console](https://console.upstash.com/) → Redis → **Create database**.
2. Region: closest to Vercel deployment (e.g. EU).
3. Copy **REST URL** and **REST TOKEN** (do not commit them).
4. Vercel → project **`codecard-mvp`** → Settings → Environment Variables → set for **Production + Preview**:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
5. Redeploy `codecard-mvp`.

TLS: Upstash REST is HTTPS-only; no extra TLS flag is required in app code.

---

## 4. Safe 429 verification

Use the gated probe (3 requests / 1 minute per client IP):

1. Temporarily set `CODECARD_RATE_LIMIT_VERIFY=1` on Preview or Production.
2. Redeploy.
3. `GET https://<deployment>/api/internal/rate-limit-verify` up to **4** times.
4. Confirm first responses are **200** with decreasing `remaining`.
5. Confirm a later response is **429** `{ "error": "Too many requests" }`.
6. **Unset** `CODECARD_RATE_LIMIT_VERIFY` and redeploy; confirm the route returns **404**.

Do not blast production with bulk traffic. Do not claim Upstash is verified using only the in-memory/no-Redis fallback.

---

## 5. Outage behavior

| Condition | Behavior |
|-----------|----------|
| Redis URL/token missing, production, type `ai`/`upload`/`auth` | Deny (`success: false`) |
| Redis missing, other types | Allow (fail open) |
| `strictRateLimit` route, URL missing | HTTP 503 |
| `CODECARD_E2E=1` | Fail-open exception for local production builds against isolated E2E |

---

## 6. Related

- `apps/web/.env.example`
- `docs/VERCEL_ENVIRONMENT.md`
- `apps/web/src/lib/rate-limit.ts`
- Contract: `apps/web/src/lib/rate-limit.contract.test.ts`

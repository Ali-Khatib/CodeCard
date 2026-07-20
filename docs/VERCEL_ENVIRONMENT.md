# Vercel environment configuration (WS14-T013)

Canonical inventory of CodeCard web environment variables and the two Vercel
projects that deploy `apps/web`. **No secret values belong in this file.**

Companion templates: [`apps/web/.env.example`](../apps/web/.env.example).  
Auth redirect checklist: [`AUTH_PROVIDER_CONFIGURATION.md`](./AUTH_PROVIDER_CONFIGURATION.md).

---

## 1. Vercel projects

| Project | ID | Branch gate | Role | Production URL |
|---------|----|-------------|------|----------------|
| `codecard-mvp` | `prj_ZTosasXt5TxnUQf4WTfcTbN8k1UN` | `mvp` only | MVP / staging app | `https://codecard-mvp.vercel.app` |
| `code-card-web` | `prj_E5wdwC2T4SYTZsRS6xh20p56LJZn` | `main` only | Marketing / future production | `https://code-card-web.vercel.app` |

Branch gating is enforced by `apps/web/scripts/vercel-ignore-build.mjs` via
`vercel.json` `ignoreCommand` (exit `1` = build, exit `0` = skip).

### Shared build settings (both projects)

| Setting | Value |
|---------|--------|
| Repository | `Ali-Khatib/CodeCard` |
| Root Directory | `apps/web` |
| Framework | Next.js |
| Node.js | `24.x` (satisfies repo `engines.node: ">=20"`; CI uses Node 22) |
| Install | Platform default (`npm install` with monorepo workspace) |
| Build | `npm run build` / `next build` |
| Output | Next.js default |
| Secrets in build commands | None |

---

## 2. Environment-variable inventory

Scopes:

- **P** = Production
- **Pr** = Preview
- **D** = Development (Vercel CLI / `vercel env pull`)
- **E2E** = Isolated Playwright / GitHub Actions only — **never** set on Vercel Production

Visibility:

- **public** = `NEXT_PUBLIC_*` (browser bundle)
- **server** = server-only (never `NEXT_PUBLIC_`)

### 2.1 Core application (required for deploy)

| Variable | Required | Scopes | Visibility | Owner | Validated in | Description | `codecard-mvp` | `code-card-web` |
|----------|----------|--------|------------|-------|--------------|-------------|----------------|-----------------|
| `NEXT_PUBLIC_APP_URL` | yes | P, Pr (, D) | public | App | `.env.example`, clients | Canonical origin for metadata, auth callbacks, Stripe returns | set P+Pr | set P+Pr |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | P, Pr (, D) | public | Supabase | clients / middleware | Project API URL | set P+Pr | set P+Pr |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes† | P, Pr (, D) | public | Supabase | `public-key.ts` | Preferred browser key | set P+Pr | set P+Pr |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | fallback† | P, Pr (, D) | public | Supabase | `public-key.ts` | Legacy anon key if publishable unset | unset (OK) | unset (OK) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes‡ | P, Pr (, D) | server | Supabase | server actions / webhooks | RLS-bypass admin key | set P+Pr | **missing** |

† At least one of publishable or anon must be set.  
‡ Required for webhooks, account export/deletion, and other service clients. Marketing-only surfaces on `code-card-web` may omit it until those routes are exercised there.

### 2.2 Billing (required before live checkout)

| Variable | Required | Scopes | Visibility | Owner | Validated in | Description | `codecard-mvp` | `code-card-web` |
|----------|----------|--------|------------|-------|--------------|-------------|----------------|-----------------|
| `STRIPE_SECRET_KEY` | for billing | P, Pr | server | Stripe | `stripe.ts` | API secret (`sk_test_` on MVP; `sk_live_` only on true production) | set P+Pr | **missing** |
| `STRIPE_WEBHOOK_SECRET` | for billing | P, Pr | server | Stripe | webhook core | Signing secret (`whsec_…`) | set P+Pr | **missing** |
| `STRIPE_PRO_PRICE_ID` | for billing | P, Pr | server | Stripe | billing pages | Pro price id (`price_…`) | set P+Pr | **missing** |

### 2.3 Monitoring & rate limits (WS14-T015 / WS14-T016)

| Variable | Required | Scopes | Visibility | Owner | Notes | Status |
|----------|----------|--------|------------|-------|-------|--------|
| `SENTRY_DSN` | for monitoring | P, Pr | server | Sentry | Server/edge init. See [`SENTRY.md`](./SENTRY.md) | configure in T015 |
| `NEXT_PUBLIC_SENTRY_DSN` | for browser capture | P, Pr | public | Sentry | Same DSN value (public by Sentry design) | configure in T015 |
| `SENTRY_AUTH_TOKEN` | for source maps | P (, Pr) | build-only | Sentry | Never `NEXT_PUBLIC_` | optional |
| `SENTRY_ORG` | for source maps | P (, Pr) | build-only | Sentry | Org slug | optional |
| `SENTRY_PROJECT` | for source maps | P (, Pr) | build-only | Sentry | Project slug | optional |
| `CODECARD_SENTRY_VERIFY` | never steady-state | temporary | server | App | One-shot verify probe; unset after | unset |
| `UPSTASH_REDIS_REST_URL` | for rate limits | P, Pr | server | Upstash | See [`UPSTASH.md`](./UPSTASH.md) | set P+Pr on `codecard-mvp` |
| `UPSTASH_REDIS_REST_TOKEN` | for rate limits | P, Pr | server | Upstash | See [`UPSTASH.md`](./UPSTASH.md) | set P+Pr on `codecard-mvp` |
| `CODECARD_RATE_LIMIT_VERIFY` | never steady-state | temporary | server | App | Bounded 429 probe; unset after | unset |

### 2.4 Optional public

| Variable | Required | Scopes | Visibility | Owner | Description | Status |
|----------|----------|--------|------------|-------|-------------|--------|
| `NEXT_PUBLIC_CODECARD_IOS_APP_URL` | no | P, Pr | public | App Store | Visitor “Get the app” CTA | unset |
| `NEXT_PUBLIC_CODECARD_ANDROID_APP_URL` | no | P, Pr | public | Play Store | Visitor “Get the app” CTA | unset |

### 2.5 Platform-provided (do not set manually)

| Variable | Visibility | Notes |
|----------|------------|-------|
| `VERCEL_URL` | public/platform | Injected by Vercel; same-origin fallback |
| `VERCEL_PROJECT_ID` | platform | Used by ignore-build script |
| `VERCEL_GIT_COMMIT_REF` | platform | Branch name for ignore-build |
| `NODE_ENV` | platform | Set by Next / Node runtime |

### 2.6 E2E-only — never configure on Vercel Production

These belong in `apps/web/.env.e2e.local` and GitHub Actions secrets only:

| Variable | Why excluded from Production |
|----------|------------------------------|
| `CODECARD_E2E` | Mode gate for mutating E2E |
| `CODECARD_E2E_ALLOW_DESTRUCTIVE` | Destructive-ops gate |
| `CODECARD_E2E_SUPABASE_URL` | Isolated backend URL |
| `CODECARD_E2E_SUPABASE_PUBLISHABLE_KEY` | Isolated public key |
| `CODECARD_E2E_SUPABASE_SERVICE_ROLE_KEY` | Isolated service role |
| `CODECARD_E2E_SUPABASE_PROJECT_REF` | Isolated project ref (must not be `gclteunkzorwaliwhatp`) |
| `CODECARD_E2E_TEST_PASSWORD` | Disposable Auth password |
| `CODECARD_E2E_BASE_URL` | Local Playwright base URL |
| `CODECARD_E2E_EMAIL_DOMAIN` | Fixture mailbox domain |
| `CODECARD_E2E_STRIPE_SECRET_KEY` | Stripe test-mode for deletion coverage |
| `CODECARD_E2E_STRIPE_WEBHOOK_SECRET` | Stripe test webhook |
| `CODECARD_E2E_STRIPE_PRICE_ID` | Stripe test price |
| `CODECARD_E2E_MAILTRAP_API_TOKEN` | Mailtrap Sandbox API |
| `CODECARD_E2E_MAILTRAP_ACCOUNT_ID` | Mailtrap account |
| `CODECARD_E2E_MAILTRAP_INBOX_ID` | Mailtrap inbox |
| `CODECARD_E2E_FIXTURES` | Local UI fixture harness only |
| `PLAYWRIGHT_PORT` | Local Playwright port |

Verified: none of the `CODECARD_E2E_*` names appear in either Vercel project's env list.

---

## 3. Server vs client exposure

| Class | Rule |
|-------|------|
| Public | Only the `NEXT_PUBLIC_*` allowlist in `.env.example` / `env-example.contract.test.ts` |
| Server | All Stripe, Supabase service role, Upstash, Sentry, and every `CODECARD_E2E_*` secret |
| Guard | `assertNoLeakedPublicSecrets()` forbids public prefixes for Stripe, service, secret, webhook, and Upstash names |

Runtime clients resolve the browser Supabase key via `getSupabasePublicKey()` (publishable **or** anon).

---

## 4. Preview / MVP smoke (read-only)

Target: `https://codecard-mvp.vercel.app` (deployment of branch `mvp`).

| Check | Result |
|-------|--------|
| Deploy builds (`READY`) | Pass |
| `/` loads (MVP demo-first → preview shell) | Pass (200) |
| `/sign-in` loads | Pass (200) |
| `/demo` loads | Pass (200) |
| `/dashboard` unauthenticated | Redirects to sign-in; no Alex Chen shell |
| Server configuration error | None observed |
| Secret patterns in HTML (`sk_live_`, `eyJ…` JWT, `sb_secret_`, service_role) | None found |
| Alex Chen on authenticated `/dashboard` | Not present (sign-in only) |
| Alex Chen on `/` and `/demo` | Expected demo/preview content on MVP |
| E2E against this deployment | Not run (not the isolated E2E backend) |

---

## 5. Manual configuration gate

When adding or rotating secrets, use the Vercel dashboard (or `vercel env add`).
**Never paste secret values into Cursor chat.**

### 5.1 `codecard-mvp` — Stripe billing (configured)

Stripe test-mode server variables are set for Production + Preview (names only):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`

Webhook endpoint URL: `https://codecard-mvp.vercel.app/api/webhooks/stripe`

Rotate any secret that was shared outside Vercel, then update the matching Vercel env entry.

### 5.2 `code-card-web` — only if authenticated server features are enabled there

| Variable | Production | Preview | Value source |
|----------|------------|---------|--------------|
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | ✓ | Production Supabase service role (if this project hosts dashboard/webhooks) |
| Stripe trio (same names as above) | ✓ | ✓ | Stripe **live** only when this project is true production |

### 5.3 Never add to either project's Production

All `CODECARD_E2E_*`, `CODECARD_E2E_FIXTURES`, `PLAYWRIGHT_PORT`, Mailtrap sandbox tokens, and disposable test passwords.

### 5.4 Deferred / follow-on

| Task | Variables |
|------|-----------|
| WS14-T015 | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` (+ optional build-only source-map trio). See [`SENTRY.md`](./SENTRY.md) |
| WS14-T016 | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. See [`UPSTASH.md`](./UPSTASH.md) |

---

## 6. Verification commands

```bash
npm run security:scan
npm run test --workspace=web -- --run src/lib/security/env-example.contract.test.ts src/lib/security/vercel-env.contract.test.ts
npm run typecheck
npm run lint
npm run test
npm run build --workspace=web
```

Env name presence (no values):

```bash
npx vercel env ls --project codecard-mvp --scope <team-slug>
npx vercel env ls --project code-card-web --scope <team-slug>
```

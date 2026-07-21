# CodeCard

**Work-first identity for technical professionals.**

Show who you are and what you have built — beautifully, instantly, and without résumé clutter.

---

## Stack

### Web

* Next.js 15 App Router
* TypeScript
* Tailwind CSS
* Motion
* shadcn-style primitives

### Mobile

* Expo React Native companion app
* No in-app subscriptions in v1

### Backend

* Next.js Route Handlers
* Server Actions
* BFF pattern

### Infrastructure

* Supabase Postgres with Row Level Security
* Supabase Auth
* Supabase Storage
* Stripe Billing for web payments
* Upstash Redis for rate limiting
* Sentry and Vercel Speed Insights for monitoring

---

## Monorepo Structure

```txt
apps/
  web/          # Next.js web app
  mobile/       # Expo React Native companion app

packages/
  types/        # Shared TypeScript types
  validation/   # Zod schemas
  config/       # Constants, limits, and plans
  ui/           # Shared UI primitives
  analytics/    # First-party analytics helpers

supabase/
  migrations/   # Database schema and RLS policies
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js 20+
* Supabase CLI, optional for local database work
* Stripe account, required for billing

---

## Setup

### Recommended

```bash
npm start
```

This will install dependencies, set up environment files, run migrations if Supabase is linked, and start the web app.

To also start the Expo mobile app:

```bash
npm start -- --mobile
```

On Windows, you can also double-click:

```bash
start.cmd
```

---

## Manual Setup

Copy the environment files:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

Fill in the required Supabase keys.

Then link Supabase and run migrations:

```bash
npx supabase link --project-ref YOUR_REF
npm run db:migrate
```

---

## Environment Variables

See:

```txt
apps/web/.env.example
docs/AUTH_PROVIDER_CONFIGURATION.md
```

Important security rules:

* Never prefix secrets with `NEXT_PUBLIC_`
* Keep the Supabase service role key server-only
* Keep the Stripe secret key server-only
* Keep the Stripe webhook secret server-only
* Keep Upstash tokens server-only
* Never commit `apps/web/.env.local` — only `.env.example` is tracked

Which values are optional for basic local development:

* Stripe, Upstash, and Sentry variables are optional unless you exercise
  billing, rate limiting, or error monitoring locally.
* The Supabase service role key is required for account export/deletion and
  webhook flows.

Test-only variables (never set in production):

* `CODECARD_E2E_FIXTURES=1` enables the `/e2e-fixtures/*` harness routes used by
  the local Playwright specs; the Playwright config sets it automatically.
* `PLAYWRIGHT_PORT` overrides the local E2E server port (default `3000`).
* Local UI fixture mode (`CODECARD_E2E_FIXTURES=1`) is **not** equivalent to
  real E2E mode. Real authenticated Playwright E2E requires a dedicated
  disposable Supabase project or persistent branch, configured via
  `apps/web/.env.e2e.local` (git-ignored; never commit it).
* Real-E2E variables (documented as placeholders in `apps/web/.env.example`):
  `CODECARD_E2E`, `CODECARD_E2E_ALLOW_DESTRUCTIVE`,
  `CODECARD_E2E_SUPABASE_URL`, `CODECARD_E2E_SUPABASE_PUBLISHABLE_KEY`,
  `CODECARD_E2E_SUPABASE_SERVICE_ROLE_KEY` (server-only),
  `CODECARD_E2E_SUPABASE_PROJECT_REF`, `CODECARD_E2E_TEST_PASSWORD`,
  `CODECARD_E2E_BASE_URL`, optional `CODECARD_E2E_EMAIL_DOMAIN`, and optional
  Stripe test-mode keys (`CODECARD_E2E_STRIPE_*`).
* Production values are forbidden. The live project reference
  `gclteunkzorwaliwhatp` must never be used for E2E.
* GitHub Actions secrets for these variables are configured later during
  WS14-T012.
* Readiness / smoke (headless, non-interactive):
  `npm run test:e2e:env --workspace=web` and
  `npm run test:e2e:smoke --workspace=web`.

---

## Development Commands

```bash
npm run dev
```

Start all apps through Turbo.

```bash
npm run build
```

Build all apps and packages.

```bash
npm run lint
```

Lint all packages.

```bash
npm run typecheck
```

Typecheck all packages.

```bash
npm run test
```

Run tests.

---

## Product Principles

1. Work first, credentials later.
2. Mobile-first public profiles.
3. Public visitors get instant value without an account.
4. Owners get saved connections, notes, collections, analytics, and billing.
5. No feed, messaging, or recruiter CRM in v1.

---

## Documentation

* [PRODUCT.md](./PRODUCT.md) — Canonical product vision and MVP roadmap
* [DESIGN.md](./DESIGN.md) — Design system contract
* [docs/SECURITY_CHECKLIST.md](./docs/SECURITY_CHECKLIST.md) — Pre-launch security checklist (includes WS04-T013 upload scanning decision)
* [docs/LAUNCH_CHECKLIST.md](./docs/LAUNCH_CHECKLIST.md) — Launch readiness checklist (WS14-T018)

---

## License

Proprietary — CodeCard, Inc.

# CodeCard

Work-first identity for technical professionals. Show who you are and what you've built — beautifully, instantly, and without the résumé clutter.

## Stack

- **Web**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Motion, shadcn-style primitives
- **Mobile**: Expo React Native (companion app — no in-app subscriptions in v1)
- **Backend**: Next.js Route Handlers + Server Actions (BFF pattern)
- **Database**: Supabase Postgres with Row Level Security
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Payments**: Stripe Billing (web only)
- **Rate limiting**: Upstash Redis
- **Monitoring**: Sentry + Vercel Speed Insights

## Monorepo structure

```
apps/
  web/          # Next.js web app
  mobile/       # Expo React Native companion
packages/
  types/        # Shared TypeScript types
  validation/   # Zod schemas
  config/       # Constants, limits, plans
  ui/           # Shared UI primitives
  analytics/    # First-party analytics helpers
supabase/
  migrations/   # Database schema + RLS
```

## Getting started

### Prerequisites

- Node.js 20+
- Supabase CLI (optional, for local DB)
- Stripe account (for billing)

### Setup

```bash
# One command — install, env setup, migrate (if linked), start web
npm start

# Also start Expo mobile app
npm start -- --mobile

# Windows: double-click start.cmd
```

Manual setup if needed:

```bash
# Copy environment files
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env

# Fill in Supabase keys, then:
npx supabase link --project-ref YOUR_REF
npm run db:migrate
```

### Environment variables

See `apps/web/.env.example` for the full list. Critical rules:

- **Never** prefix secrets with `NEXT_PUBLIC_`
- Service role key, Stripe secret, webhook secret, and Upstash tokens are server-only

## Development

```bash
npm run dev          # Start all apps via Turbo
npm run build        # Build all packages
npm run lint         # Lint all packages
npm run typecheck    # Typecheck all packages
npm run test         # Run tests
```

## Product principles

1. Work first, credentials later
2. Mobile-first public profiles
3. Public visitors get instant value without an account
4. Owners get saved connections, notes, collections, analytics, billing
5. No feed, messaging, or recruiter CRM in v1

## Documentation

- [PRODUCT.md](./PRODUCT.md) — Canonical product vision & MVP roadmap
- [DESIGN.md](./DESIGN.md) — Design system contract
- [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md) — Pre-launch security
- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) — Launch readiness

## License

Proprietary — CodeCard, Inc.

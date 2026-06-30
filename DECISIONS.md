# CodeCard — Decisive Stack Decisions

One decision per layer. No committees.

| Layer | Decision | Why |
|-------|----------|-----|
| **Language** | TypeScript everywhere | One mental model, shared types, fewer runtime bugs |
| **Monorepo** | npm workspaces + Turborepo | Simple on Windows, fast CI caching |
| **Web framework** | Next.js 15 App Router | SSR, streaming, image optimization, Vercel-native |
| **Mobile** | Expo React Native | Shared TS logic, EAS builds, no Swift/Kotlin split in v1 |
| **UI** | Tailwind + shared `@codecard/ui` | Fast iteration, design tokens in DESIGN.md |
| **Animation** | Motion (React) | Purposeful motion on public pages only |
| **Backend** | Next.js Route Handlers + Server Actions | BFF pattern — no separate API service in v1 |
| **Database** | Supabase Postgres | Auth + RLS + Storage in one; not Azure SQL |
| **Auth** | Supabase Auth (JWT + cookies via `@supabase/ssr`) | RLS integration, Expo support |
| **Multi-tenancy** | `tenant_id` on every row + RLS policies | DB-level isolation, future team workspaces |
| **File storage** | Supabase Storage + signed URLs | Same vendor as DB; private/public buckets |
| **Payments** | Stripe Checkout + Customer Portal (web only) | Avoids app-store IAP complexity in v1 |
| **Rate limiting** | Upstash Redis Ratelimit | Serverless-safe; fail-closed on paid endpoints in prod |
| **Hosting** | Vercel | Edge, previews, Speed Insights — not Azure App Service |
| **CI/CD** | GitHub Actions + CodeQL + Dependabot | Native to repo; OIDC for cloud creds when needed |
| **Monitoring** | Sentry + Vercel Observability | Errors + performance |
| **Email** | Resend or Postmark (when added) | Transactional first; CAN-SPAM compliant templates |
| **AI (future)** | Server-side only, delimiter-wrapped prompts | Never client-side keys; `lib/security/ai.ts` pattern |
| **Python** | Not in v1 core | Avoid split stack unless unavoidable media processing |

## Security decisions

| Topic | Decision |
|-------|----------|
| Secrets | Env vars only; `scripts/check-secrets.js` in CI |
| RLS | Enabled + **FORCED** on all tables; no policy = no access |
| Service role | Server webhook/jobs only; never in client or `NEXT_PUBLIC_` |
| Input | Zod on every endpoint; 64KB JSON cap; malformed = 400 |
| Uploads | Allowlist extensions/MIME; UUID filenames; size caps |
| AI | System prompt separated by `<<<SYSTEM_INSTRUCTIONS>>>` delimiters |
| Headers | CSP, HSTS, X-Frame-Options via `next.config.ts` |

## What we did NOT pick

- **Azure SQL** — duplicates Postgres; Supabase is the whole backend
- **Separate Express/Fastify API** — overkill for MVP
- **Python backend** — cognitive split without payoff in v1
- **In-app Stripe/IAP on mobile** — legal/store complexity
- **Copy-paste Aceternity UI** — inspiration only, not product language

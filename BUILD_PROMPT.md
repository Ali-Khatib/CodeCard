# CodeCard Master Build Prompt

Copy everything below this line into Cursor / Claude Code as the single implementation contract.

---

You are a principal engineer building **CodeCard** — a production MVP for web and mobile.

## PRODUCT TRUTH

**Tagline:** Share what you build.

CodeCard is the modern identity for people who build things. NOT a portfolio, résumé, or GitHub replacement.

It doesn't diminish achievements — it **changes the order**. Work becomes the conversation starter.

First 30 seconds answer only: **Who are you?** and **What have you built?**

**Two experiences:**
- Visitor (web/QR/NFC): instant premium mobile web, no app, Featured Work immediately
- CodeCard user (app): save profiles, private notes, collections, connection metadata

Read `PRODUCT.md` for the canonical brief.

## STACK (NON-NEGOTIABLE)

- Monorepo: `apps/web` (Next.js 15 App Router), `apps/mobile` (Expo), `packages/{types,validation,config,ui,analytics}`
- TypeScript only in v1 core — no Python
- Supabase: Postgres + Auth + Storage + RLS on every table
- Stripe: web Checkout + Customer Portal + webhooks (no mobile IAP)
- Upstash: rate limiting (fail-closed on auth/AI/upload in production)
- Vercel: hosting + Speed Insights
- GitHub Actions: lint, typecheck, test, build, CodeQL, secret scan

See `DECISIONS.md` for rationale.

## SECURITY (MANDATORY)

1. **Secrets**: env vars only. Run `npm run security:scan`. Never `NEXT_PUBLIC_` for Stripe, service role, webhooks, Upstash.
2. **RLS**: every table has RLS enabled AND forced. `tenant_id` + `owner_user_id` on user data. No policy = no access.
3. **Validation**: Zod on every route/server action. Reject malformed JSON (400), oversized payloads (413), invalid URLs/enums.
4. **Rate limits**: per-IP + per-user on auth, analytics, uploads, AI, DMCA, moderation. Token bucket for paid AI.
5. **Uploads**: allowlist jpg/png/webp/avif/pdf/mp4/webm. UUID filenames. MIME check. Size caps. No SVG/HTML/archives.
6. **AI safety**: use `buildSafePrompt()` — system instructions in `<<<SYSTEM_INSTRUCTIONS>>>` block, user data in `<<<USER_DATA>>>` block, never concatenated into system prompt.
7. **Headers**: CSP, HSTS, X-Frame-Options, nosniff via Next.js headers.
8. **Stripe webhooks**: raw body, signature verify, idempotent event IDs, return 2xx fast.

## DATA MODEL

Core tables: tenants, tenant_memberships, profiles, profile_links, projects, project_domains, project_focus_areas, project_media_assets, project_links, saved_connections, connection_notes, collections, collection_items, public_profile_events, project_view_events, subscription_customers, subscriptions, billing_events, moderation_reports, dmca_notices, audit_logs, jobs.

Indexes: `profiles(tenant_id, slug)`, `projects(profile_id, is_published, sort_order)`, `saved_connections(owner_user_id, saved_profile_id)`, `public_profile_events(profile_id, viewed_at DESC)`, `project_view_events(project_id, viewed_at DESC)`.

## WEB MVP

- Landing, `/demo`, auth, dashboard (profile, projects, analytics, billing, settings)
- Public profile `/{slug}` — SSR, 60s revalidate, work-first layout
- Project cards → detail pages with poster + optional looped video
- Legal: privacy, terms, AUP, DMCA, contact, subscription terms
- Admin moderation queue

## MOBILE MVP (COMPANION ONLY)

- Sign-in, saved connections, notes, collections, profile preview, settings
- NO in-app subscription purchase
- Copy: "Manage subscription on the web"

## PERFORMANCE

- Server Components for public profiles
- `next/image` with avif/webp, responsive sizes
- Lazy-load non-critical client components
- Streaming where helpful
- Pagination for analytics and saved lists
- `prefers-reduced-motion` respected

## COMPLIANCE

- **Privacy**: honest about Supabase, Stripe, Vercel, Sentry, Upstash; no fake promises
- **DMCA**: designated agent, takedown process, repeat infringer policy
- **Email**: unsubscribe link, honest subject, physical address placeholder → update before launch
- **Subscriptions**: clear price, cancel anytime via portal, no dark patterns

## DESIGN

Follow `DESIGN.md`: dark, premium, editorial. Patterns.dev for perf architecture. Devouring Details + Interface Craft for interaction care. Aceternity for selective landing blocks only. Mobbin/Recent for flow reference. Refero-style DESIGN.md as contract.

## QUALITY BAR

Fewer features done beautifully. If flourish hurts security, accessibility, or launch-readiness — cut it.

## DELIVERABLES

1. Monorepo with passing CI
2. Migrations + RLS + seed data
3. Web + mobile apps
4. DESIGN.md, DECISIONS.md, SECURITY_CHECKLIST.md, LAUNCH_CHECKLIST.md
5. Secret scan + validation tests
6. Presentable demo profile

Build it production-minded. Ship the narrow premium MVP.

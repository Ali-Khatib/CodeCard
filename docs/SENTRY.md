# Sentry error monitoring (WS14-T015)

Canonical setup for CodeCard Next.js error reporting. **No secret values belong
in this file.** Companion inventory: [`VERCEL_ENVIRONMENT.md`](./VERCEL_ENVIRONMENT.md).

---

## 1. Runtime surfaces

| Surface | File | DSN source |
|---------|------|------------|
| Node server | `apps/web/sentry.server.config.ts` | `SENTRY_DSN` (preferred) or `NEXT_PUBLIC_SENTRY_DSN` |
| Edge | `apps/web/sentry.edge.config.ts` | same |
| Browser | `apps/web/instrumentation-client.ts` | `NEXT_PUBLIC_SENTRY_DSN` (or `SENTRY_DSN` at build if inlined) |
| Request errors | `apps/web/src/instrumentation.ts` (`onRequestError`) | via server/edge init |
| React root boundary | `apps/web/src/app/global-error.tsx` | client SDK when DSN present |

`withSentryConfig` wraps `apps/web/next.config.ts`. Tunnel route: `/monitoring`
(CSP `connect-src` allows Sentry ingest hosts).

---

## 2. Environment variables (names only)

| Variable | Visibility | Required | Notes |
|----------|------------|----------|-------|
| `SENTRY_DSN` | server-only | for monitoring | Project DSN from Sentry → Settings → Client Keys (DSN). Safe public identifier, but kept server-scoped for server/edge init. |
| `NEXT_PUBLIC_SENTRY_DSN` | public | for browser capture | Same DSN value. Sentry DSNs are **not** application secrets; browser SDK requires a public DSN by design. |
| `SENTRY_ENVIRONMENT` | server | optional | Overrides `VERCEL_ENV` / `NODE_ENV` tagging. |
| `SENTRY_RELEASE` | server | optional | Overrides `VERCEL_GIT_COMMIT_SHA`. |
| `SENTRY_AUTH_TOKEN` | build-only | optional | Source-map upload only. Never `NEXT_PUBLIC_`. |
| `SENTRY_ORG` | build-only | optional | Org slug for source-map upload. |
| `SENTRY_PROJECT` | build-only | optional | Project slug for source-map upload. |
| `CODECARD_SENTRY_VERIFY` | server | never in steady-state Production | Set to `1` only for a single controlled verification, then **unset**. |

E2E-only variables must never be added to Production.

---

## 3. Privacy / scrubbing

Configured in `apps/web/src/lib/sentry/options.ts` + `scrub.ts`:

- `sendDefaultPii: false`
- Authorization / Cookie headers → `[Filtered]`
- Sensitive query params (`code`, `password`, tokens, …) scrubbed from URLs
- Request bodies and cookies stripped before send
- User email / IP / username removed when present
- Noisy framework redirects (`NEXT_REDIRECT`, `NEXT_NOT_FOUND`) dropped

Do not log passwords, recovery URLs, service-role keys, Stripe secrets, or
upload contents into Sentry extras.

---

## 4. Manual Sentry + Vercel gate

1. Open Sentry → create (or select) project **Next.js** named e.g. `codecard-web`.
2. Copy the project **DSN** (Settings → Client Keys). Do not paste it into chat.
3. Vercel project **`codecard-mvp`** → Settings → Environment Variables:
   - `SENTRY_DSN` → Production + Preview
   - `NEXT_PUBLIC_SENTRY_DSN` → Production + Preview (same DSN value)
4. Optional source maps (CI/build only): `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`,
   `SENTRY_PROJECT` on Production (+ Preview if desired). Auth token is
   **build-only**.
5. Redeploy `codecard-mvp` after env changes.
6. Temporarily set `CODECARD_SENTRY_VERIFY=1` on Preview (or Production for a
   short window).
7. `GET https://<deployment>/api/internal/sentry-verify` once.
8. Confirm the event **“CodeCard WS14-T015 Sentry verification event”** in
   Sentry (correct environment / release).
9. **Unset** `CODECARD_SENTRY_VERIFY` immediately. Redeploy if needed.
10. Confirm the verify route returns **404** when the flag is unset.

---

## 5. Related

- Env inventory: `docs/VERCEL_ENVIRONMENT.md`
- Template: `apps/web/.env.example`
- Contract tests: `apps/web/src/lib/sentry/sentry.contract.test.ts`

# Auth provider configuration (WS01-T009)

Safe reference for configuring Supabase authentication with CodeCard. **Do not commit real secrets, personal emails, or production credentials.**

## Verification status legend

| Status | Meaning |
|--------|---------|
| **Code-verified** | Path, variable, or setting is referenced in the repository and matches implementation. |
| **Locally verified** | Confirmed in a developer environment during this audit. |
| **External required** | Must be confirmed in Supabase Dashboard / OAuth provider consoles; not verified live in this task. |

---

## 1. Required environment variables

| Variable | Browser-safe? | Required for auth UI | Code reference | Status |
|----------|---------------|----------------------|----------------|--------|
| `NEXT_PUBLIC_APP_URL` | Yes | Recommended | `redirect.ts`, `password-recovery.ts`, metadata, Stripe callbacks | Code-verified |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | `client.ts`, `server.ts`, `configured.ts`, `middleware.ts` | Code-verified |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Yes (preferred) | `public-key.ts` | Code-verified |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes (fallback) | `public-key.ts` | Code-verified |
| `SUPABASE_SERVICE_ROLE_KEY` | **No — server only** | No for sign-in/OAuth (webhooks/admin only) | `server.ts` `createServiceClient()` | Code-verified |

At least one of `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set with `NEXT_PUBLIC_SUPABASE_URL` for auth pages to leave “setup” mode (`isSupabasePublicKeyConfigured()`).

### Server-only keys (never `NEXT_PUBLIC_`)

- `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS; used for service clients only.
- `STRIPE_*`, `UPSTASH_*`, `SENTRY_DSN` — unrelated to auth UI but must remain server-only.

`apps/web/src/lib/security/env.ts` includes `assertNoLeakedPublicSecrets()` patterns blocking `NEXT_PUBLIC_*` secret prefixes.

Template: `apps/web/.env.example`

---

## 2. Supabase Auth settings (Dashboard)

### Site URL

Set **Authentication → URL configuration → Site URL** to the canonical app origin:

| Environment | Example Site URL |
|-------------|------------------|
| Local | `http://localhost:3000` |
| Preview / staging | `https://<preview-hostname>` (Vercel preview URL or custom staging domain) |
| Production | `https://<production-domain>` |

Must match `NEXT_PUBLIC_APP_URL` for consistent redirects and email links.

**Status:** External required (per deployment).

### Redirect URLs (allow list)

Add every origin-specific callback entry. CodeCard always returns users through **`/auth/callback`** first (PKCE code exchange), then a sanitized internal path.

**Required patterns (code-verified paths exist):**

```
http://localhost:3000/auth/callback
https://<your-production-domain>/auth/callback
https://<your-preview-domain>/auth/callback
```

**Recommended wildcards (Supabase supports per-project):**

```
http://localhost:3000/**
https://<your-production-domain>/**
https://*-<team-slug>.vercel.app/**   # if using Vercel preview deployments
```

### Flow-specific redirect behavior (code-verified)

| Flow | App route | Redirect chain |
|------|-----------|----------------|
| OAuth (Google/GitHub) | `sign-in`, `sign-up` buttons | Provider → `{APP_URL}/auth/callback?redirect={safePath}` → internal path |
| Password recovery | `forgot-password` | Email link → `{APP_URL}/auth/callback?redirect=%2Freset-password` → `/reset-password` |
| Email sign-in | `sign-in` | Session in-app → `sanitizeInternalRedirect(?redirect=)` |
| OAuth / callback errors | `auth/callback` | Failure → `/auth/error?reason=…` |
| Expired session | `middleware` | `/sign-in?redirect=…&reason=session_expired` (when stale auth cookie detected) |

**Email confirmation:** Sign-up (`sign-up/page.tsx`) does **not** currently pass `emailRedirectTo`. Supabase default confirmation links use Site URL. **External required:** confirm `Confirm email` template redirect matches your deployment. Consider adding `emailRedirectTo: authCallbackRedirectUrl('/dashboard')` in a future task.

---

## 3. OAuth providers referenced by the UI

| Provider | UI location | Supabase provider id | Status |
|----------|-------------|----------------------|--------|
| GitHub | `sign-in/page.tsx` | `github` | Code-verified; **External required** for live login |
| Google | `sign-in/page.tsx` | `google` | Code-verified; **External required** for live login |

No other OAuth buttons are rendered in the current auth UI.

### Provider console callbacks (external required)

Point each provider’s authorization callback to Supabase’s hosted callback, **not** directly to CodeCard:

```
https://<project-ref>.supabase.co/auth/v1/callback
```

Obtain exact URL from **Supabase Dashboard → Authentication → Providers → {Provider}**.

Enable each provider in Supabase and supply client ID/secret there (server-side in Supabase, not in CodeCard env).

---

## 4. Email / password authentication

| Setting | CodeCard expectation | Status |
|---------|---------------------|--------|
| Email provider enabled | Required for email sign-up/sign-in | External required |
| Confirm email | Optional; banner shown when `userNeedsEmailVerification()` | Code-verified (`email-verification.ts`) |
| Secure password change | Reset via email → callback → `/reset-password` | Code-verified |
| Minimum password rules | `passwordSchema` / `resetPasswordSchema` in `@codecard/validation` | Code-verified |

---

## 5. PKCE and session model

| Topic | Implementation | Status |
|-------|----------------|--------|
| PKCE | `@supabase/ssr` browser + server clients use cookie-backed PKCE OAuth flow (Supabase SSR default) | Code-verified |
| Session storage | HTTP-only cookies via `@supabase/ssr` (`middleware.ts`, `server.ts`, `client.ts`) | Code-verified |
| Token refresh | Automatic via Supabase client; dashboard `useDashboardSessionGuard` handles refresh/sign-out | Code-verified |
| Open redirect protection | `sanitizeInternalRedirect()` in `lib/auth/redirect.ts` | Code-verified |

---

## 6. Vercel environment variables

Set the same keys as local for each Vercel environment (Production, Preview, Development):

| Variable | Production | Preview | Development |
|----------|------------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | Production domain | Preview URL or staging domain | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase project or env-specific project | Same | Local/staging project |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase API settings | Same | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only, encrypted | Server only | Server only |

**Warning:** Never add `SUPABASE_SERVICE_ROLE_KEY` with a `NEXT_PUBLIC_` prefix.

Update Supabase **Redirect URLs** when adding new preview hostname patterns.

---

## 7. Environment differences

| Concern | Local | Preview / staging | Production |
|---------|-------|-------------------|------------|
| Site URL | `http://localhost:3000` | Preview hostname | Custom domain |
| OAuth providers | Same Supabase project or dedicated dev project | Staging project recommended | Production project |
| Service role | Dev key only | Staging key | Production key |
| Live OAuth test | Optional dev providers | **Recommended verification target** | Verify before launch |
| CI / build | Placeholder env vars in `.github/workflows/ci.yml` | N/A | N/A |

`main` serves marketing landing at `/`; `mvp` may change `/` later. Auth routes (`/sign-in`, `/auth/callback`, etc.) are identical on both branches.

---

## 8. Safe manual verification checklist

Use a **staging Supabase project** and test accounts created for QA — not production users.

1. [ ] **Env** — `NEXT_PUBLIC_SUPABASE_URL` + publishable/anon key set; app leaves auth “setup” message. (External)
2. [ ] **Site URL** — Matches deployed origin. (External)
3. [ ] **Redirect URLs** — `/auth/callback` allowed for local, preview, production. (External)
4. [ ] **Email sign-up** — New user → profile provisioned → dashboard or verification banner. (External)
5. [ ] **Email sign-in** — Valid credentials → dashboard; `?redirect=/dashboard/projects` honored. (External)
6. [ ] **GitHub OAuth** — Completes → dashboard; unsafe `redirect` rejected. (External)
7. [ ] **Google OAuth** — Same as GitHub. (External)
8. [ ] **OAuth cancel** — Provider denial → `/auth/error`, safe copy, no session. (Code-verified route; External live)
9. [ ] **Forgot password** — Generic success copy; email received; reset updates password. (External)
10. [ ] **Expired session** — Clear cookies / wait for expiry → `/sign-in?reason=session_expired`. (External)
11. [ ] **Sign out** — Settings sign-out → landing (`/`), not “session expired”. (Code-verified)

Automated coverage: `apps/web/src/lib/auth/*.test.ts`, `apps/web/e2e/auth.spec.ts` (see WS01-T010).

---

## 9. Callback route map (code-verified)

| Path | Handler |
|------|---------|
| `/auth/callback` | `apps/web/src/app/auth/callback/route.ts` |
| `/auth/error` | `apps/web/src/app/auth/error/page.tsx` |
| `/sign-in` | `apps/web/src/app/sign-in/page.tsx` |
| `/sign-up` | `apps/web/src/app/sign-up/page.tsx` |
| `/forgot-password` | `apps/web/src/app/forgot-password/page.tsx` |
| `/reset-password` | `apps/web/src/app/reset-password/page.tsx` |

Middleware matcher: `/dashboard/*`, `/admin/*`, auth routes (`middleware.ts`).

---

## 10. Items not verified in this task

- Live Google OAuth login end-to-end
- Live GitHub OAuth login end-to-end
- Live email delivery (confirmation + password reset)
- Supabase Dashboard provider secrets and exact redirect URL list for your project ref
- Docker-based Supabase local stack (documented in root README as optional; not required for this guide)

---

## Related files

- `apps/web/.env.example`
- `apps/web/src/lib/auth/redirect.ts`
- `apps/web/src/lib/auth/oauth-callback.ts`
- `apps/web/src/lib/auth/session-expiry.ts`
- `apps/web/src/middleware.ts`
- `README.md` (environment security rules)

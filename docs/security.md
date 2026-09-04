# CodeCard security model

Technical description of how CodeCard actually protects accounts and data. This is **not** a
compliance certificate, penetration-test report, or claim that CodeCard is “fully secure.”

Related documents:

- [`RLS_ACCESS_MATRIX.md`](./RLS_ACCESS_MATRIX.md)
- [`account-data-inventory.md`](./account-data-inventory.md)
- [`CSRF_POSTURE.md`](./CSRF_POSTURE.md)
- [`STRIPE_WEBHOOK_SECURITY.md`](./STRIPE_WEBHOOK_SECURITY.md)
- [`SENTRY.md`](./SENTRY.md)
- [`UPSTASH.md`](./UPSTASH.md)
- [`privacy-data-map.md`](./privacy-data-map.md)

---

## Authentication model

- Identity is Supabase Auth (email/password and optional GitHub OAuth).
- Server code uses `supabase.auth.getUser()` (validated JWT), not client-only UI flags.
- Dashboard and `/admin` are gated in `apps/web/src/proxy.ts`. Hiding UI is not authorization.
- Post-auth redirects are limited to same-origin relative paths (`sanitizeInternalRedirect`).
- GitHub OAuth requests `read:user user:email` only. Tokens are held by Supabase Auth, not
  stored by CodeCard for later GitHub API use.
- Users can disconnect GitHub from Settings when another sign-in method exists.
- Logout uses `supabase.auth.signOut()` and clears the session cookie.

## Authorization model

- Application authorization is **owner + tenant** based, enforced by Postgres Row Level Security.
- Global platform admin is `app_metadata.role === "admin"` only. User-editable `user_metadata`
  is never used for authorization.
- Premium features are derived from server-side Stripe webhook state in `subscriptions`, not
  from `localStorage`, URL parameters, or client flags.
- Public profile queries select allowlisted columns. They must not select `profiles.*`.

## RLS

Every application table in `public` is expected to have RLS enabled and forced. See
[`RLS_ACCESS_MATRIX.md`](./RLS_ACCESS_MATRIX.md).

Public SELECT is limited to published content on public profiles. Private notes, collections,
billing rows, audit logs, jobs, and deletion operations are not publicly readable.

## Storage security

| Bucket | Visibility | Notes |
|--------|------------|--------|
| `avatars` | Public object reads | UUID object names; owner write only |
| `project-media` | Public object reads | Same; also research figures |
| `private-docs` | Private | Not used for hosted research PDFs in MVP |

Uploads use generated paths `{tenant}/{owner}/{resourceType}/{resourceId}/{uuid}.{ext}`.
Server-side MIME, extension, size, ownership, and magic-byte checks apply to live raster
uploads. SVG, HTML, JavaScript, and executables are rejected. Full antivirus scanning is **not**
implemented.

## Secrets management

- Browser-exposed variables use `NEXT_PUBLIC_` and are allowlisted in `.env.example`.
- `SUPABASE_SERVICE_ROLE_KEY`, Stripe secrets, Upstash tokens, and webhook secrets are server-only.
- CI secret scanning (`scripts/check-secrets.js`) blocks accidental `NEXT_PUBLIC_` secret prefixes.
- Service-role clients stay in server modules (`server-only`).

## Third-party services

Supabase, Vercel, Stripe, GitHub (optional sign-in), Upstash, Sentry. No generative AI provider
is called with user content today. No advertising pixels (Meta/Google Ads/TikTok) are loaded.

## Rate limiting

Upstash Redis rate limits apply to abuse-prone routes (password-reset completion, uploads,
analytics ingest, public reports, admin APIs). Browser sign-in and sign-up still talk to
Supabase Auth (GoTrue) directly; that path is not wrapped by `RATE_LIMITS.auth`. Production
fails closed for sensitive types if Redis is unavailable. See [`UPSTASH.md`](./UPSTASH.md).

Optional `MODERATION_FINGERPRINT_SECRET` is preferred for public-report HMAC fingerprints;
if unset, the service-role key is used as a fallback so existing deploys keep working.

## Monitoring

Sentry captures errors. DSNs are not application secrets. Avoid sending passwords, tokens, or
raw form bodies in event payloads. See [`SENTRY.md`](./SENTRY.md).

## Incident response basics

1. Contain: revoke sessions, disable abusive uploads, hide public content if needed.
2. Preserve identifiers of affected objects and users.
3. Fix the defect; rotate secrets if they leaked.
4. Notify affected users when personal data was involved.
5. Legal/escalation issues are **LEGAL REVIEW REQUIRED** — engineering does not invent a
   regulatory notice.

A full incident-response playbook with named on-call rotations is still an operational gap for
a larger team.

## Account deletion

`POST /api/account/delete` requires a signed-in session, exact confirmation text `DELETE`,
recent reauthentication, CSRF/same-origin checks, and capability gates. Stripe subscriptions
are cancelled when cancellable. Storage cleanup may finish asynchronously. Some billing,
moderation, and security records may be retained or anonymized.

## Data handling

See [`privacy-data-map.md`](./privacy-data-map.md) and the Privacy Policy at `/legal/privacy`.
Public profiles are intentionally public. Email, billing IDs, OAuth tokens, and private notes
are not.

## HTTP security headers

Set in `apps/web/next.config.ts`: HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy`, `Cross-Origin-Opener-Policy`, `X-Frame-Options` / `frame-ancestors`, and CSP.

Theme boot is a same-origin `/theme-boot.js` (`beforeInteractive`). It is **not** an inline script.

### REQUIRED EXCEPTIONS

- `'unsafe-inline'` on `script-src`: Next.js App Router still emits inline bootstrap/hydration
  scripts; Vercel Analytics/Speed Insights also inject scripts. Removing this without a
  per-request nonce pipeline breaks the app.
- `'unsafe-eval'` on `script-src`: Three.js / WebGL shader compilation and some animation
  runtimes (GSAP is used widely on marketing/profile). Not proven removable without a
  production browser pass.
- `'unsafe-inline'` on `style-src`: React/`style={{}}` and CSS-in-JS style attributes.
- `https://va.vercel-scripts.com` and `vitals.vercel-insights.com`: Vercel telemetry.
- `*.supabase.co` / `wss://*.supabase.co`: Auth, DB, Storage, Realtime.
- Sentry ingest hosts (also tunneled via `/monitoring`).

### OPTIONAL EXCEPTIONS

None currently. Do not add advertising or third-party QR hosts.

### POSSIBLE FUTURE REDUCTIONS

- Per-request CSP **nonces** (middleware sets `Content-Security-Policy` + Next nonce) so
  `'unsafe-inline'` can be dropped for scripts.
- Confirm whether production Three.js still needs `'unsafe-eval'`; if not, drop it.
- Hashing `/theme-boot.js` is unnecessary while it stays same-origin `'self'`.

Do not expand `script-src` without a dependency review.

## Intake RLS migration (not claimed applied)

`supabase/migrations/20260904152512_tighten_intake_client_inserts.sql` revokes client INSERT on
`dmca_notices` and `moderation_reports`. App routes already insert via the service role. Treat
it as **ready to apply**, not applied, until an operator runs it on the target database.

## Honest non-claims

- CodeCard is not certified under GDPR, CCPA, ADA, or WCAG, and we do not describe the
  product as perfectly secure.
- Malware scanning of uploads is not implemented.
- A registered DMCA designated agent is not claimed until placeholders on `/legal/dmca` are
  replaced with a real filing.

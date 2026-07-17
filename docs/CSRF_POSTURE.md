# CSRF posture (WS11-T007)

## Threat model

Browser cookie-authenticated mutations must not be triggerable from a foreign site that can force the victim’s browser to send session cookies.

Defense layers:

1. Same-origin / Fetch Metadata guard on cookie-authenticated JSON APIs
2. Next.js Server Action Origin vs Host / `X-Forwarded-Host` check
3. Cookie `SameSite=Lax` (Supabase SSR defaults) as defense in depth
4. Stripe webhook signature verification (not browser CSRF)

Authentication alone is not CSRF protection.

## Protected browser mutations

Central guard: `isSameOriginMutation` in `apps/web/src/lib/security/same-origin.ts`.

| Surface | Classification | Enforcement |
|---------|----------------|-------------|
| `POST /api/upload` | Browser cookie mutation | `isSameOriginMutation` |
| `POST /api/account/export` | Browser cookie sensitive read | `isSameOriginMutation` |
| `POST /api/account/delete` | Browser cookie mutation | `isSameOriginMutation` |
| Profile / project / research / Connections / Circle / billing Server Actions | Server Action | Next.js Origin check + explicit empty `allowedOrigins` |
| Settings sign-out Server Action | Server Action | Same |
| `POST /api/webhooks/stripe` | Server-to-server | Stripe signature only (no browser Origin) |
| `POST /api/analytics`, `/api/dmca`, `/api/moderation/report` | Public ingest | No cookie authority to escalate |
| `GET` routes | Read-only | No CSRF mutation guard |

## Origin policy

- Parse `Origin` with the URL parser (`parseBrowserOrigin`).
- Compare exact origin strings (scheme + host + effective port).
- Trusted sources: request URL origin, `NEXT_PUBLIC_APP_URL`, `VERCEL_URL` (HTTPS).
- Do **not** trust client-supplied `Host` or `X-Forwarded-Host` for allowlisting.
- Reject foreign, lookalike, wrong-scheme, wrong-port, and malformed origins (`null`, non-http(s)).

## Fetch Metadata policy

- Reject `Sec-Fetch-Site: cross-site`.
- Accept `same-origin` and `same-site` when Origin is absent (see missing-header policy).
- When Origin is present, Fetch Metadata is secondary; Origin allowlist is authoritative (except hard reject of `cross-site`).

## Missing-header policy (fail closed)

Requests with **no `Origin` and no trustworthy Fetch Metadata** are **rejected**.

Trusted Fetch Metadata when Origin is absent:

- `Sec-Fetch-Site: same-origin`
- `Sec-Fetch-Site: same-site`

Absent Origin + absent / other `Sec-Fetch-Site` → fail closed.

This closes crafted non-browser cookie clients that omit both headers.

## Trusted proxy model

Production/preview on Vercel: Next.js and the platform set `Host` / `X-Forwarded-Host`. Direct deploys need **no** reverse-proxy exceptions.

If a custom reverse proxy is introduced later, add **only** that exact external hostname to `experimental.serverActions.allowedOrigins` — never `*` or `*.vercel.app` wildcards unless deliberately reviewed.

## Server Action `allowedOrigins`

`apps/web/next.config.ts`:

```ts
experimental: {
  serverActions: {
    allowedOrigins: [],
  },
}
```

Empty list = no additional CSRF bypass hosts. Next.js still validates Origin against Host / forwarded host.

## Cookie posture

Session cookies are owned by `@supabase/ssr` (browser-readable tokens required by the browser Supabase client). Defaults include `SameSite=Lax` and path `/`. Production deployments should use HTTPS so cookies are marked `Secure`.

`HttpOnly` is **not** enabled for the primary auth cookie model — the browser client must manage the session. Treat SameSite + CSRF Origin checks as complementary controls. See `AUTH_PROVIDER_CONFIGURATION.md`.

## Stripe webhook exemption

`POST /api/webhooks/stripe` must **not** require browser Origin. Authoritative control is Stripe signature verification (`constructEvent` on the raw body). See `STRIPE_WEBHOOK_SECURITY.md`.

## CSRF rejection response

Cookie API mutations return **403** with opaque `{ error: "Forbidden" }` (no trusted-origin leakage).

## Tests

- `same-origin.test.ts` — Origin / Fetch Metadata / fail-closed / proxy-header non-trust
- `csrf-posture.contract.test.ts` — inventory, Next config, Stripe exemption, cookie doc accuracy

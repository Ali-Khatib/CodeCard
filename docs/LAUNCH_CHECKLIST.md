# Launch checklist (owner-supplied values)

Engineering cannot invent legal-entity data. Replace the placeholders below before public launch. Until then, the pages remain technically accurate as “not yet filed / not yet named.”

This is **not** a compliance certification.

## Legal placeholders (must be provided by the owner)

| Placeholder | Where it appears | Needed for |
|-------------|------------------|------------|
| `[COMPANY LEGAL NAME]` | `/legal/privacy`, `/legal/terms`, `/legal/dmca` | Identifying the contracting party |
| `[BUSINESS ADDRESS IF REQUIRED]` | `/legal/privacy` | Privacy controller / operator address if counsel requires it |
| `[DESIGNATED AGENT NAME IF REGISTERED]` | `/legal/dmca` | Only after a real DMCA agent is registered |
| `[PHYSICAL ADDRESS]` | `/legal/dmca` | Designated-agent mailing address if registered |

Do **not** publish a registered DMCA agent claim until the Copyright Office filing exists.

## Operational flags (must stay unset in production unless actively testing)

| Variable | Risk if left on |
|----------|-----------------|
| `CODECARD_RATE_LIMIT_VERIFY=1` | Public rate-limit probe |
| `CODECARD_SENTRY_VERIFY=1` | Public Sentry error probe |
| `CODECARD_E2E_FIXTURES=1` | Fixture routes |

## Optional secrets (recommended, not required for boot)

| Variable | Purpose |
|----------|---------|
| `MODERATION_FINGERPRINT_SECRET` | HMAC for public-report fingerprints (falls back to service-role key) |

## Manual verification before launch

- Apply `20260904152512_tighten_intake_client_inserts` to the staging/production database and confirm DMCA + public report forms still succeed.
- Click through sign-up consent, GitHub connect/disconnect (with a second identity), Settings export/delete, and legal pages.
- Confirm Stripe webhook signing secret is set on the live endpoint.

## Explicitly not claimed

- GDPR / CCPA / ADA / WCAG certification
- Malware-free uploads
- A cookie-consent legal conclusion for Vercel Analytics

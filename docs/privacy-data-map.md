# CodeCard privacy data map

Technical inventory of personal and account-associated data. **Legal review pending.** This is
not a GDPR/CCPA RoPA, DPA, or certification.

Companion: [`account-data-inventory.md`](./account-data-inventory.md) (table-level export/deletion
notes).

Legend: **Public** means it can appear on a published CodeCard. **Private** means it must not.

| Data | Source | Purpose | Storage | Access | Third party | Retention | Deletion |
|------|--------|---------|---------|--------|-------------|-----------|----------|
| Email | Sign-up / GitHub / Google (Google not in MVP) | Account identity, transactional mail | Supabase Auth | Owner; service role for deletion | Supabase; GitHub if OAuth | While account exists | Deleted with auth user (last step) |
| Password hash | Email sign-up | Authentication | Supabase Auth (hashed by provider) | Auth provider only | Supabase | While password identity exists | Removed with auth user |
| Display name, headline, bio, location, skills, slug | User | Public profile | `profiles` | Public if published; else owner | Hosting (Vercel/Supabase) | While account exists | Deleted with profile |
| Avatar | User upload | Public photo | Supabase Storage `avatars` | Public object if URL known | Supabase | While referenced | Storage cleanup job / account delete |
| Profile links | User | Public links | `profile_links` | Public if profile public | — | With profile | Cascade |
| Projects, research, media metadata | User | Public portfolio | Postgres + `project-media` | Published + public profile | Supabase | With account | Cascade + storage cleanup |
| External PDF/URL | User-supplied HTTPS URL | Research link | `research_papers.pdf_url` | Public if paper published | External host (not CodeCard) | With paper | Row delete; CodeCard does not host the file |
| GitHub account name/email | GitHub OAuth | Sign-in only | Supabase Auth identities | Owner | GitHub, Supabase | While identity linked | Disconnect or account delete; tokens not stored by CodeCard for later API use |
| Theme preference | Browser localStorage | Appearance | Device only | Device | None | Until cleared | User clears site data |
| Session UI state | Browser sessionStorage | Prompt/scroll/share flags | Device tab only | Device | None | Tab session | Tab close / user clears site data |
| Session cookie | Auth | Stay signed in | Browser cookie (HttpOnly via Supabase SSR) | Browser + CodeCard origin | Supabase | Session / expiry | Sign out |
| First-party analytics events | Public profile visitors | Owner insights | `analytics_events` (+ legacy tables) | Owner SELECT; anon INSERT if published | Hosting / rate limit (transient IP) | Up to 90 days raw | Cleanup cycle; anonymize on account delete |
| Opaque analytics session id | Generated client id | Dedupe views | Event row | Owner aggregates only | — | With event | Same as analytics |
| Vercel Analytics / Speed Insights | Browser after idle | Operate/performance | Vercel | Vercel | Vercel | Per Vercel product terms | Not stored as CodeCard rows |
| Sentry error events | App runtime | Fix crashes | Sentry | Operators | Sentry | Per Sentry project settings | Operational |
| Stripe customer / subscription ids | Stripe webhooks | Billing state | `subscription_customers`, `subscriptions`, `billing_events` | Owner SELECT (no client writes); service role for webhooks | Stripe | Billing/legal as needed | Cancel Stripe; local rows after cancel; ledger may be retained |
| Card numbers | Not collected by CodeCard | — | Stripe only | Stripe | Stripe | Stripe | Stripe |
| Private notes, collections, saved connections | Owner | Private workspace | Owner-only tables | Owner | — | With account | Delete |
| Circle viewer last-seen | Viewer | Unread state | `circle_viewer_state` | Viewer only | — | With account | Delete |
| Moderation / DMCA notices | Reporter / claimant | Abuse and copyright intake | `moderation_reports`, `dmca_notices` | Admin / service | — | Operational / legal | Reporter anonymized on account delete where required; DMCA retention is a legal decision |
| Audit logs / jobs | System | Security and cleanup | `audit_logs`, `jobs` | Tenant-limited / service | — | Operational | Actor anonymization later; not exported |
| IP address | Infrastructure / rate limit | Abuse prevention | Transient (Upstash/Vercel); not a product analytics column | Operators of those systems | Vercel, Upstash | Short / provider default | Not a user-exportable field |
| Marketing email consent | Not collected | No marketing campaigns today | None | — | None | — | — |
| Biometrics | Not collected | — | — | — | — | — | — |
| AI prompts / uploads to model providers | Not sent today | — | — | — | None | — | — |

## Minimization rules

- Do not add advertising pixels without a separate consent design.
- Do not request extra GitHub scopes “just in case.”
- Do not put email, tenant IDs, Stripe IDs, or tokens into public JSON-LD, Open Graph, or sitemaps.
- Public profile queries use `PUBLIC_PROFILE_SELECT` (never `profiles.*`).
- Do not export secrets, raw analytics streams, or other people’s private data.

Owner-facing dashboard queries may include `tenant_id` for plan/quota checks. That is not a
public profile field.

## User controls

| Control | Where |
|---------|--------|
| Export JSON | Settings → Export data |
| Delete account | Settings → Delete account |
| Disconnect GitHub | Settings → GitHub (requires another sign-in method) |
| Unpublish profile | Profile visibility |
| Report content | Public profile report + `/legal/dmca` |

## Honest non-claims

This map describes current product behavior. It does not claim GDPR, CCPA, COPPA, or similar
compliance. International transfer mechanisms and a registered DMCA agent remain **LEGAL REVIEW
REQUIRED**.

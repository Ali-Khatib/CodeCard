# Email deliverability (SPF / DKIM / DMARC)

What CodeCard sends, who sends it, and the exact DNS configuration production
needs. Nothing in this document can be completed from the repository — every DNS
item is **External required** and must be applied in the DNS zone for
`codecard.app`, then verified.

## Verification status legend

| Status | Meaning |
|--------|---------|
| **Code-verified** | Confirmed in this repository. |
| **External required** | Must be applied/confirmed in Supabase Dashboard or DNS. Not done by this audit. |

---

## 1. What sends email

**Code-verified:** CodeCard has **no application email provider**. There is no
Resend, Postmark, SendGrid, SES, or nodemailer dependency, and no transactional
email module. Every email is sent by **Supabase Auth**.

| Email | Trigger | Code reference |
|-------|---------|----------------|
| Signup confirmation | `supabase.auth.signUp` with `emailRedirectTo` | `apps/web/src/app/sign-up/page.tsx` |
| Resend confirmation | `supabase.auth.resend({ type: 'signup' })` | `apps/web/src/components/dashboard/email-verification-banner.tsx` |
| Password reset | `supabase.auth.resetPasswordForEmail` | `apps/web/src/app/forgot-password/page.tsx` |
| Email change confirmation | Supabase (`double_confirm_changes = true`) | `supabase/config.toml` |

There are no marketing, receipt, or notification emails. Stripe sends its own
billing email directly; that is configured in the Stripe Dashboard and is
outside CodeCard's DNS scope.

**No email templates are stored in this repository.** Bodies come from the
Supabase project's template settings.

---

## 2. Which sender domain applies

This is the decision that determines whether SPF/DKIM/DMARC apply to
`codecard.app` at all.

| Mode | Envelope sender | SPF/DKIM for `codecard.app`? |
|------|-----------------|------------------------------|
| **A. Supabase default SMTP** (current unless configured otherwise) | A Supabase-owned address/domain | **Not applicable.** Supabase's domain carries the SPF/DKIM alignment. You cannot and should not publish records for it. |
| **B. Custom SMTP** (required for production) | `no-reply@codecard.app` or similar | **Required.** All records in §3 must exist. |

**External required:** Confirm which mode the production Supabase project uses
under **Authentication → Emails → SMTP Settings**.

Supabase's default SMTP is explicitly **not intended for production**: it is
rate-limited to a small number of messages per hour and its deliverability is
shared. Signup confirmation and password reset are both on the critical path, so
production must use Mode B.

---

## 3. Required DNS records (Mode B — custom SMTP)

Replace `<provider>` values with the exact strings your SMTP provider issues.
Do **not** copy the examples verbatim; a wrong SPF or DKIM record is worse than
none because it produces hard authentication failures.

### 3.1 SPF — one record only

SPF must be a **single** `TXT` record at the domain apex. Multiple SPF records
are a permanent error and cause failures.

| Field | Value |
|-------|-------|
| Type | `TXT` |
| Name | `@` (apex, `codecard.app`) |
| Value | `v=spf1 include:<provider-spf-domain> ~all` |

- Merge, never duplicate: if a record already exists, add the provider's
  `include:` to it rather than publishing a second record.
- Keep `~all` (softfail) during rollout; move to `-all` only after DMARC reports
  show no legitimate sources failing.
- SPF has a hard limit of 10 DNS lookups. Each `include:` consumes at least one.

### 3.2 DKIM — provider-issued keys

Providers issue either CNAMEs pointing at their key host, or a TXT public key.
Use exactly what the provider gives you.

| Field | Value |
|-------|-------|
| Type | `CNAME` (typical) or `TXT` |
| Name | `<selector>._domainkey` (e.g. `s1._domainkey`) |
| Value | `<provider-issued target or p=... public key>` |

- Publish every selector the provider lists. Providers commonly rotate between
  two selectors, and omitting one causes intermittent failures.
- DKIM is what survives forwarding; SPF alone is not sufficient.

### 3.3 DMARC — start at monitoring

| Field | Value |
|-------|-------|
| Type | `TXT` |
| Name | `_dmarc` |
| Value | `v=DMARC1; p=none; rua=mailto:dmarc@codecard.app; fo=1; adkim=s; aspf=s` |

Rollout order — do not skip to enforcement:

1. `p=none` — collect aggregate reports, confirm all legitimate mail aligns.
2. `p=quarantine; pct=25` — ramp `pct` upward while watching reports.
3. `p=reject` — only once SPF and DKIM both pass and align for 100% of
   legitimate mail for at least one full reporting cycle.

`rua` must be a mailbox that is actually monitored. If `dmarc@codecard.app` does
not exist, create it or point `rua` at one that does — otherwise DMARC provides
no signal.

### 3.4 Optional hardening

| Record | Name | Purpose |
|--------|------|---------|
| MX | `@` | Required to *receive* mail (e.g. `hello@codecard.app` in `/legal/contact`). Sending does not require MX, but the published support addresses do. |
| TXT | `@` | `v=spf1 -all` on any parked subdomain that never sends. |

---

## 4. Redirect URL correctness (prevents broken links in real email)

**Code-verified:** every auth email link is built from `getAppOrigin()` in
`apps/web/src/lib/auth/redirect.ts`, resolved in this order:

1. `NEXT_PUBLIC_APP_URL`, if set and parseable.
2. `window.location.origin`.
3. `http://localhost:3000`.

Every email-sending call site is a **client** component — `sign-up/page.tsx`,
`forgot-password/page.tsx`, `account-deletion-dialog.tsx`, and
`lib/auth/github-oauth.ts` — so step 2 always applies in a browser and the
`localhost` fallback is unreachable for real users. **A production email will not
contain a `localhost` link even if the variable is missing.**

What an unset `NEXT_PUBLIC_APP_URL` does cause: the link points at whichever host
the user happened to be on. On a preview deployment or a non-canonical alias that
host is very likely absent from Supabase's redirect allow list, so Supabase drops
the `redirect_to` and the user lands on the Site URL instead of their intended
destination. `lib/auth/auth-link-forward.ts` exists to salvage that case, but the
correct fix is to set the variable so links are always canonical.

Note the same helper backs the server-side CSRF check in
`lib/security/same-origin.ts`. That path stays safe when the variable is unset —
`collectAllowedOrigins` always includes the real `request.url` origin, and a
cross-site request is rejected by the `Sec-Fetch-Site` check before the
allow-list is consulted.

**External required checklist:**

1. `NEXT_PUBLIC_APP_URL` set on the Vercel project (Production scope) to the
   canonical origin, no trailing slash.
2. Supabase **Authentication → URL Configuration → Site URL** set to the same
   origin.
3. Supabase redirect allow list contains `{APP_URL}/auth/callback`, plus the
   password-reset variant. Current allow list lives in `supabase/config.toml`
   for local and must be mirrored per remote project.

See [`AUTH_PROVIDER_CONFIGURATION.md`](./AUTH_PROVIDER_CONFIGURATION.md) §2.

---

## 5. Failure handling

**Code-verified:** auth email failures surface as generic messages and never
reveal whether an address exists.

- `forgot-password` shows the same success copy whether or not the account
  exists (enumeration-safe).
- The verification banner reports a send failure without exposing provider
  detail.
- Supabase rate limits (429) surface as a retryable error, not a crash.

There is **no** application-level retry queue or bounce webhook. Bounces and
complaints are visible only in the SMTP provider's dashboard.

---

## 6. Manual verification (cannot be automated from this repo)

Run against staging first, with a test mailbox.

1. [ ] Confirm SMTP mode (§2). If Mode A, production email is **not ready**.
2. [ ] `dig +short TXT codecard.app` — exactly one `v=spf1` record.
3. [ ] `dig +short TXT <selector>._domainkey.codecard.app` — key resolves for
       every selector.
4. [ ] `dig +short TXT _dmarc.codecard.app` — policy present, `rua` monitored.
5. [ ] Send a real signup confirmation to an external mailbox (Gmail works).
       Inspect headers: `spf=pass`, `dkim=pass`, `dmarc=pass`, and DKIM `d=`
       aligned with `codecard.app`.
6. [ ] Confirm the link host is the canonical production origin (not a preview
       alias), and that it survives Supabase's redirect allow list.
7. [ ] Complete password reset end-to-end from the emailed link.
8. [ ] Verify every published inbox actually receives mail. Each is a `mailto:`
       link on a public page, so a missing mailbox is a silent support failure:

       | Address | Published on |
       |---------|--------------|
       | `hello@codecard.app` | `/legal/contact` |
       | `privacy@codecard.app` | `/legal/contact`, `/legal/privacy` |
       | `billing@codecard.app` | `/legal/contact`, `/legal/subscription` |
       | `dmca@codecard.app` | `/legal/contact`, `/legal/dmca` |
       | `dmarc@codecard.app` | DMARC `rua` (§3.3) |

9. [ ] Replace the physical address placeholder on `/legal/dmca`
       (`[Physical address placeholder. Update before launch]`). A DMCA agent
       designation is incomplete without it.

---

## 7. Current status

| Item | Status |
|------|--------|
| Application email provider | **N/A** — Supabase Auth only (Code-verified) |
| Email templates in repo | **None** (Code-verified) |
| Redirect origin construction | **Code-verified**, depends on `NEXT_PUBLIC_APP_URL` |
| Enumeration-safe failure copy | **Code-verified** |
| Custom SMTP configured | **External required — unverified** |
| SPF record | **External required — unverified** |
| DKIM records | **External required — unverified** |
| DMARC record | **External required — unverified** |
| Support inboxes receive mail | **External required — unverified** |

No DNS record was created or verified by this audit.

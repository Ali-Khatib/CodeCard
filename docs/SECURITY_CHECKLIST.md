# CodeCard Security Checklist

Use before production deploys and audience expansion. Companion assessment: [`WS04_T013_UPLOAD_SECURITY_DECISION.md`](./WS04_T013_UPLOAD_SECURITY_DECISION.md).

Client-side image resizing/compression (WS04-T012) is a **performance** optimization only. It does **not** replace MIME, extension, size, ownership, RLS, rate-limit, or malware decisions. See [`CLIENT_IMAGE_OPTIMIZATION.md`](./CLIENT_IMAGE_OPTIMIZATION.md).

Analytics retention (WS08-T012): raw analytics events are retained for **up to 90 days**. See [`ANALYTICS_RETENTION.md`](./ANALYTICS_RETENTION.md) and [`RUNBOOK.md`](./RUNBOOK.md). Do not confuse analytics cleanup with billing, audit, or moderation retention.

---

## Secrets & configuration

- [x] No secrets in source, history, or fixtures (CI `secret-scan` + `scripts/check-secrets.js`)
- [ ] Secrets only in env / deployment secret manager
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is server-only (never `NEXT_PUBLIC_`)
- [ ] Stripe / Upstash / other provider secrets are server-only
- [ ] `.env.local` ignored and not committed

Blocking CI policy: [`CI_SECURITY_AUDITING.md`](./CI_SECURITY_AUDITING.md) (WS11-T009).

## Database & auth

- [ ] RLS enabled on `public` tables
- [ ] Service role only in approved server handlers
- [ ] JWT expiry appropriate

## Input validation

- [ ] Zod (or equivalent) on API routes / server actions
- [ ] Body size limits enforced
- [ ] URL / slug allowlists

---

## File uploads (WS04-T013)

### Current upload surface

Live product uploads today:

- Profile avatars
- Project covers (`poster`)
- Project screenshots

Scaffolding only (not approved live product features until separately gated):

- `private-doc` / research PDF resource type + `private-docs` bucket
- Video MIME/size config and bucket allowlist entries

### Supported file types (live)

| Intent | MIME | Extensions | Max size |
|--------|------|------------|----------|
| Avatar | `image/jpeg`, `image/png`, `image/webp` | `jpg`, `jpeg`, `png`, `webp` | 5 MB |
| Project cover | same | same | 5 MB |
| Screenshot | same | same | 5 MB |

### Rejected / not approved for MVP live uploads

- SVG (`image/svg+xml` and `.svg`)
- HTML / JS / scripts
- Executables (`.exe`, shell scripts, jars, etc.)
- Archives (zip/rar/7z — fail allowlist)
- Office documents
- AVIF in the **live avatar/project-media client schemas** (config may still list AVIF for buckets — keep product clients restricted)
- Research PDFs until a separate private-upload gate (external HTTPS links are the MVP path)
- Video until a separate assessment

### Size limits

| Layer | Images | PDF (future bucket) | Video (config only) |
|-------|--------|---------------------|---------------------|
| App / schemas | 5 MB | 10 MB | 50 MB |
| Storage buckets | 5 MB (`avatars`); 50 MB (`project-media`) | 10 MB (`private-docs`) | included in project-media cap |
| Client dimension cap (WS04-T012) | max 2000×2000 before upload (performance only) | — | — |

Server validates declared size at signed-upload authorization; buckets enforce object size. Client resize does not expand the MIME allowlist.

### MIME / extension enforcement

- [x] Allowlists enforced server-side
- [x] MIME and extension must agree
- [x] Zero-byte files rejected
- [x] Unsafe filenames (paths, `..`, multi-dot tricks) rejected
- [x] Client cannot supply authoritative `bucket`, `path`, or ownership fields

### Path and ownership rules

- Canonical path: `{tenant}/{owner}/{resourceType}/{resourceId}/{uuid}.{ext}`
- Object names are application-generated UUIDs
- Upload destinations require authenticated user + resolved ownership
- Project-media verifies project `owner_user_id`
- Finalization re-checks auth, owned path, and object existence

### Rate limits

- Upload: 20 requests / hour per IP and per user (`RATE_LIMITS.upload`)
- Production rate limiting fails closed if Redis is unavailable

### Bucket visibility

| Bucket | Visibility | Listing |
|--------|------------|---------|
| `avatars` | Public object reads (UUID paths) | Not a public browse catalog; paths must be known |
| `project-media` | Public object reads | Same |
| `private-docs` | Private; owner SELECT only | Must stay non-public |

### Finalization checks

- Re-authentication / session user
- Owned profile or owned project
- Canonical path ownership (tenant/owner/resource)
- Object present in expected bucket
- Persist DB reference only after checks succeed
- Replacement deletes previous object only after DB success (best-effort cleanup)

### Malware / virus scanning decision (current)

| Stage | Decision |
|-------|----------|
| Controlled private beta (images only) | **Conditional deferral** — see decision doc |
| Wide public launch | **Reassess; scanning or equivalent hardening required before expansion** |
| Research PDFs | Private uploads **not approved**; external HTTPS links supported for MVP | Separate gate required for private hosting |
| SVG / archives / executables | **Reject** |

Scanning is **not** implemented. Do not claim otherwise.

### Private-beta conditions

- Audience limited by ops (invite / closed signup)
- Only approved raster types above
- PDF product private-upload UI off; external HTTPS `pdf_url` links allowed
- Manual takedown ability available
- Monitoring enabled

### Public-launch conditions

- Reassess threat model
- Strengthened moderation / role-gated admin
- Incident-response playbook
- PDF/video/archive features either scanned/quarantined or disabled
- Review public-bucket strategy

### PDF-specific policy

- **MVP:** External HTTPS paper/PDF links only via `research_papers.pdf_url`
- Private CodeCard-hosted PDF uploads remain **disabled**
- Do not store storage paths or signed URLs in `pdf_url`
- Label public links as externally hosted; do not claim CodeCard hosts, scans, or verifies the file
- Store private PDFs only after a future gate: private bucket, signed download, attachment disposition, scan/quarantine (or refuse)
- Prefer attachment downloads; avoid naïve inline trust for hosted PDFs later
- No automatic third-party public sample sharing without privacy review
- Scanning is **not** implemented

### Manual moderation expectations

- Intake via moderation report + DMCA endpoints
- Identify owner from path / DB rows
- Remove objects; suspend accounts offline as needed

### Incident-response expectations (MVP)

- Preserve IDs of abusive assets
- Revoke compromised sessions
- Escalate legal issues
- Full IR playbook required before public launch

### Review date / trigger

Revisit this section **before** enabling research uploads **or** opening unrestricted public signup — whichever comes first.

Full narrative assessment: [`WS04_T013_UPLOAD_SECURITY_DECISION.md`](./WS04_T013_UPLOAD_SECURITY_DECISION.md).

---

## Rate limiting (general)

- [ ] Auth endpoints rate limited
- [ ] Analytics endpoints rate limited
- [ ] Upload endpoints rate limited (per user and IP)

## Payments

- [ ] Stripe webhook signature verification
- [ ] Event ID deduplication
- [ ] Subscription state from webhook, not client

## CI/CD & monitoring

- [x] Lint, typecheck, and tests blocking
- [x] Secret scanning blocking (`secret-scan` job)
- [x] Dependency vulnerability audit blocking (`dependency-audit`, high/critical via `npm audit --audit-level=high --package-lock-only`)
- [ ] Error monitoring configured
- [ ] Audit logs for admin/billing/security actions where applicable

## Compliance

- [ ] Privacy policy matches data collection
- [ ] DMCA / report contacts correct before launch

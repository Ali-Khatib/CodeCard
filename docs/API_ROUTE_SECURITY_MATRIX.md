# API Route Security Matrix (WS11-T005)

Internal inventory of every `apps/web/src/app/api/**/route.ts` handler.

Cookie-authenticated mutations require same-origin checks. Ordinary JSON APIs use `secureJsonRoute` (schema + rate limit + bounded body + optional auth + JSON content-type). Binary/raw-body routes use documented equivalent controls.

---

## Route matrix

| Route | Methods | Auth | Validation | Origin/CSRF | Rate limit | Response | Notes |
|---|---|---|---|---|---|---|---|
| `/api/analytics` | POST | Public | Zod via `secureJsonRoute` | N/A (public ingest) | `analytics` | JSON | Published-target checks in handler |
| `/api/dmca` | POST | Public | Zod + 32 KiB | N/A | `dmca` | JSON | Service-role insert |
| `/api/moderation/report` | POST | Public (optional user) | Zod | N/A | `moderation` | JSON | `reporter_user_id` from session when present |
| `/api/account/export` | POST (GET→405) | Required | Strict Zod | **same-origin** | `accountExport` strict | JSON download | Session identity only; no-store |
| `/api/account/delete` | POST (GET→405) | Required | Zod + confirmation | **same-origin** | `accountDelete` strict | JSON | Reauth required |
| `/api/admin/reports` | GET | Canonical global admin | Allowlisted pagination/status/target filters | N/A (read-only) | None | Private no-store JSON | Authorization before T002 service-role reader |
| `/api/admin/dmca` | GET | Canonical global admin | Allowlisted pagination/status filters | N/A (read-only) | None | Private no-store JSON | Privacy-minimized DMCA list DTO |
| `/api/admin/reports/[id]` | PATCH | Canonical global admin | UUID + resolve/dismiss allowlist | **same-origin** | None | Private no-store JSON | Atomic status + audit RPC; conflict-safe |
| `/api/admin/reports/[id]/note` | PUT | Canonical global admin | UUID + nullable plain-text note (max 4,000) + optimistic timestamp | **same-origin** | None | Private no-store JSON without note body | Atomic private note + audit metadata only; conflict-safe |
| `/api/admin/content/hide` | POST | Canonical global admin | Strict report/target UUID + profile/project allowlist | **same-origin** | None | Private no-store JSON | Atomic hold + unpublish + audit; public cache invalidation |
| `/api/admin/users/[id]/suspend` | POST | Canonical global admin | Path user UUID + optional report UUID | **same-origin** | None | Private no-store JSON | Durable suspension + Auth ban; partial-failure retryable; no Stripe changes |
| `/api/upload` | POST | Required | Custom JSON schema | **same-origin** | upload IP+user | JSON | MIME/size/ownership; not `secureJsonRoute` |
| `/api/public/research/[paperId]/pdf` | GET | Public | UUID param | N/A | PDF IP | PDF binary | SSRF-hardened proxy; no URL query |
| `/api/webhooks/stripe` | POST | Stripe signature | Raw body + event | Signature (not browser origin) | body limit only | JSON | Raw body + `billing_events` claim (`processing`→`completed`/`failed`); see `STRIPE_WEBHOOK_SECURITY.md` |

No Connections/Circle JSON API routes exist — those use server actions with session ownership.

Admin routes deliberately do not use the generic `secureJsonRoute`: they use the canonical WS13 global-admin resolver, explicit filter/body schemas, private no-store responses, and create the privileged client only after authorization. The report mutation additionally enforces same-origin CSRF.

No QR API route — QR is generated client/server-side locally; downloads recorded via analytics.

---

## Valid exceptions (do not force `secureJsonRoute`)

1. **Stripe webhook** — raw body + signature verification.
2. **Upload** — custom JSON controls with same-origin, ownership, MIME.
3. **Public research PDF** — binary stream + SSRF controls.
4. **Account export** — uses `secureJsonRoute` for auth/validation then returns attachment bytes.
5. **Admin routes** — canonical global-admin authorization followed by narrowly scoped T002 readers/actions; mutation uses same-origin CSRF.

---

## Hardening applied in WS11-T005

- Account export: same-origin mutation guard (aligned with account delete).
- `secureJsonRoute`: reject non-JSON `Content-Type` with 415 when header present.

---

## Tests

- `apps/web/src/lib/security/secure-api-route-audit.contract.test.ts`
- Existing route tests: upload, analytics, PDF
- Same-origin helper tests

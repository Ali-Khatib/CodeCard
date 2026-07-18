# Admin authorization model (WS13-T001)

**Status:** Accepted (model, page gate, and privileged read boundary implemented)
**Task:** WS13-T001 / WS11-T002 / WS13-T002
**Canonical resolver:** `apps/web/src/lib/security/admin-authorization.ts`
**Route gate (WS11-T002):** `apps/web/src/lib/security/admin-route-gate.ts`

> **Important:** T001 itself did **not** secure `/admin`, enable admin data access, promote any user, or apply remote migrations. The `/admin` **page** gate is implemented by WS11-T002 (see §16a), and the privileged read boundary is implemented by WS13-T002 (see §18a).

---

## 1. Purpose

Establish one unambiguous, least-privilege authorization model for **global CodeCard platform administrators** so later tasks can gate `/admin`, privileged APIs, and moderation data access consistently.

## 2. Scope

In scope for T001:

- Canonical source of truth for global platform admin
- Distinctions between identity classes
- Server-only resolver + unit tests
- Provisioning, revocation, bootstrap, lockout, session, audit, and threat documentation
- Page/API authorization contracts for later enforcement

Out of scope for T001:

- `/admin` role gate (WS11-T002)
- Admin RLS or gated service-role reads/writes (WS13-T002)
- Admin page data fetching (WS13-T003)
- Moderation actions, suspension, hide/unpublish, DMCA handling UI (WS13-T004+)
- Promoting any real user
- Routing changes
- Production Supabase Admin API mutations

## 3. Definitions

| Term | Meaning |
|------|---------|
| **Global platform administrator** | A human operator authorized to moderate the entire CodeCard product (reports, DMCA, suspension, etc.) |
| **Tenant / workspace administrator** | A member with `tenant_role = 'admin'` (or `owner`) inside one tenant — **not** a platform admin |
| **Ordinary authenticated user** | Signed-in CodeCard user without the global admin claim |
| **Anonymous visitor** | No authenticated session |
| **Service-role backend capability** | Server use of `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS — **not** a user identity |
| **Demo identity** | Static / preview / marketing identities (e.g. Alex Chen demo workspace) — never production admins |

## 4. Global admin versus tenant admin

- `tenant_role` enum values (`owner`, `admin`, `member`) live on `tenant_memberships` and scope **workspace** permissions only.
- Holding `tenant_role = 'admin'` **must never** imply global moderation or `/admin` access.
- Global admin is orthogonal to tenant membership and is never inferred from tenant tables.

## 5. Selected source of truth

**Canonical claim:** Supabase Auth `app_metadata.role === "admin"` (exact string, case-sensitive).

| Field | Value |
|-------|--------|
| Store | Supabase Auth `auth.users.raw_app_meta_data` (exposed as `user.app_metadata`) |
| Key | `role` |
| Value | `"admin"` |
| Comparison | Exact string equality |
| Controlled by | Trusted server-side Admin API / Dashboard only |

Constants in code:

- `GLOBAL_ADMIN_CLAIM_PATH = "app_metadata.role"`
- `GLOBAL_ADMIN_APP_METADATA_ROLE = "admin"`

## 6. Rejected alternatives

| Alternative | Verdict |
|-------------|---------|
| `tenant_role = 'admin'` | Rejected — workspace scope only |
| `user_metadata.role` | Rejected — user-editable / untrusted |
| Environment email allowlist as permanent source | Rejected (Policy A) — no parallel source |
| Dedicated `platform_admins` table | Not selected — no stronger existing table; `app_metadata` is sufficient |
| Service-role key possession | Rejected — capability ≠ identity |
| Hardcoded user IDs / emails | Rejected — brittle, secret leakage risk |
| Client `isAdmin` / UI visibility | Rejected — not an authorization boundary |
| Request body / header / cookie / query `role` | Rejected — attacker-controlled |
| Email domain or substring matching | Rejected — over-broad, spoofable |
| `app_metadata.roles` array shape | Rejected — avoid ambiguous dual shapes |
| `NEXT_PUBLIC_*` admin lists | Rejected — browser-visible |

## 7. Exact claim schema

```json
{
  "app_metadata": {
    "role": "admin"
  }
}
```

Rules:

- Only the string `"admin"` authorizes.
- `"Admin"`, `"ADMIN"`, `"administrator"`, `true`, `1`, `["admin"]`, or `roles: ["admin"]` do **not** authorize.
- Missing / empty `app_metadata` → not admin.
- Malformed `role` type (non-string) → **misconfigured** (fail closed).

## 8. Trust boundaries

Trusted:

- Server `supabase.auth.getUser()` (or Admin API) identity
- Server-only resolver reading `app_metadata.role`
- Later: gated server modules after a successful resolver decision

Untrusted:

- `user_metadata`
- Client components and browser state
- Request-supplied roles
- Demo fixtures and preview routes
- Possession of anon key or service-role key alone

## 9. Provisioning

Granting global admin is **server-controlled**, intentional, and unavailable via signup/profile APIs.

1. **First administrator (bootstrap):** A privileged operator with Supabase Dashboard / Management API access (project owner) sets `app_metadata.role = "admin"` on the chosen Auth user via **Authentication → Users → User → App Metadata** or `auth.admin.updateUserById`.
2. **Later administrators:** An existing global admin (or project owner via Dashboard) grants the same claim. No public self-serve endpoint.
3. **Canonical value:** `"admin"` at `app_metadata.role`.
4. **Self-promotion:** Forbidden. Ordinary users cannot write `app_metadata`.
5. **Audit:** Role grants/revokes should be recorded (see §22). Full action auditing lands in WS13-T008.
6. **Local / staging:** Same claim shape; use staging Auth users only. Never copy production admin lists into demo seed data.
7. **Production:** Prefer Dashboard / break-glass runbook with two-person review where possible. Do not commit emails or user IDs.

T001 does **not** promote any user.

## 10. Revocation

1. Clear or replace `app_metadata.role` (remove `"admin"`) via Dashboard or Admin API.
2. Expectation: access ends at the **session / JWT refresh boundary** (see §11).
3. For emergency lockout of a compromised admin session, also invalidate sessions (sign out all / ban user) via Supabase Auth Admin controls when available.
4. Revocation should be auditable (actor, target user id, timestamp, result).

## 11. Session freshness

Supabase JWTs may embed `app_metadata` until refresh.

Documented expectations:

- **Ordinary `/admin` page access (WS11-T002):** May rely on the current verified user from `getUser()` / refreshed session.
- **Destructive admin mutations (later):** Must resolve identity server-side and re-check the canonical claim immediately before the privileged operation. Prefer a fresh `getUser()` (or Admin API read of the user) rather than trusting a long-lived cached decision.
- **Stale sessions:** A revoked admin may retain elevated claims in an **unrefreshed** JWT until expiry/refresh. This architecture does **not** claim instantaneous JWT revocation.
- **Mitigation:** Keep JWT lifetimes reasonable; for emergencies, invalidate the Auth user sessions and revoke the claim.
- **Sign-out:** Clears browser session cookies; subsequent requests are unauthenticated.

## 12. Bootstrap procedure

1. Confirm project owner access to the correct Supabase project (local / staging / production).
2. Create or select the operator Auth user (never a demo identity).
3. Set `app_metadata` to include `"role": "admin"` only (do not put secrets in metadata).
4. Have the operator sign in and refresh the session (sign out / sign in if needed).
5. After WS11-T002, verify `/admin` allows that user and forbids a non-admin test user.
6. Do **not** leave an environment email allowlist as a permanent backdoor (Policy A).

## 13. Lockout recovery

If all platform admins are accidentally revoked:

1. A Supabase **project owner** (infrastructure privilege, not app role) restores `app_metadata.role = "admin"` on at least one trusted operator via Dashboard / Management API.
2. There is **no** hardcoded email, user id, or universal hidden admin in application code.
3. Recovery does not re-introduce a permanent env allowlist; Document any temporary emergency step and remove it immediately after recovery.

## 14. Environment allowlist policy

**Policy A — Removed from authorization.**

- No `ADMIN_EMAIL`, `ADMIN_EMAILS`, or `NEXT_PUBLIC_ADMIN_*` variables are part of the authorization model.
- The resolver does not read process env for emails.
- Do not add an undocumented parallel allowlist later without an ADR update.
- Bootstrap uses Dashboard / Admin API on `app_metadata`, not emails in `.env`.

## 15. Server-only resolver

Path: `apps/web/src/lib/security/admin-authorization.ts`

- Imports `server-only` (must not enter client bundles).
- Single canonical helper: `resolveGlobalAdminAuthorization`.
- Optional predicate: `isGlobalAdminAuthorized` (same rules; no competing helpers).
- Does **not** call service role, fetch moderation data, or perform admin actions.
- Not yet imported by `/admin` or admin APIs (T001).

## 16. Page authorization contract (`/admin`)

| Caller | Behavior (enforced by WS11-T002) |
|--------|----------------------------------|
| Authenticated global admin | Allowed |
| Authenticated non-admin | Forbidden (real HTTP 403 via `forbidden()`, not a soft redirect) |
| Anonymous visitor | Redirect to `/sign-in?redirect=%2Fadmin` (sanitized internal path; middleware also requires a session for `/admin`) |
| Demo identity | Forbidden (demo mode has no verified Supabase session; the resolver additionally denies `isDemoIdentity`) |

T001 did **not** implement this gate; WS11-T002 did (§16a).

## 16a. Enforcement (WS11-T002)

**Gate module:** `apps/web/src/lib/security/admin-route-gate.ts` — `enforceGlobalAdminAccess()`, a server-only wrapper that:

1. Verifies the user via the trusted server client (`supabase.auth.getUser()`).
2. Passes only `{ userId, appMetadata }` from the verified user into the canonical `resolveGlobalAdminAuthorization` (no second role source, no request-derived roles).
3. Enforces the decision: anonymous → sign-in redirect; everything else non-authorized → `forbidden()` (403); misconfiguration and identity-provider failure fail closed with bounded redacted logs (no tokens, metadata, or user IDs).

**Enforcement points (server render, before any data fetch):**

- `apps/web/src/app/admin/layout.tsx` — gates the entire `/admin` route tree (defense in depth for future nested routes).
- `apps/web/src/app/admin/page.tsx` — awaits the gate **before** `createClient()` and the `moderation_reports` / `dmca_notices` queries, because Next.js renders layouts and pages in parallel. **Every future `/admin/*` page must do the same.**

**403 mechanism:** `experimental.authInterrupts: true` in `apps/web/next.config.ts` enables Next 15's `forbidden()`, rendered by `apps/web/src/app/forbidden.tsx` (opaque copy, no admin details, keyboard-accessible links back to `/dashboard` and `/`).

**401 vs 403:** Anonymous (no verifiable session) → sign-in redirect (the browser-page equivalent of 401). Authenticated but not a global admin → 403. Non-admins are never redirected to sign-in as if unauthenticated.

**Middleware:** unchanged — coarse session-only routing for `/admin/*`. It decides authentication routing, never role authorization.

**Session staleness:** unchanged from §11 — the gate trusts the verified current user; a revoked admin may retain access until token refresh/invalidation. Destructive admin mutations (later tasks) must re-check.

**Page authorization is not API authorization.** The gate protects only browser rendering of `/admin`. Audit at WS11-T002 time: no `/api/admin/*` routes exist; `POST /api/moderation/report` and `POST /api/dmca` are public ingest (insert-only, validated, rate-limited) and are not admin surfaces. Every future admin API must independently call the canonical resolver server-side (WS13-T002).

**Still pending:** WS13-T002 (admin data access — the page's moderation/DMCA reads still return nothing under current RLS), WS13-T003+ (admin UX). WS11-T002 does not make admin reads work.

**Tests:** `admin-route-gate.test.ts` (behavior: anonymous redirect, open-redirect safety, non-admin/tenant-admin/user-metadata/forged-role/malformed-metadata/similar-role rejection, canonical admin allow, fail-closed provider failure, redacted logging) and `admin-route-gate.contract.test.ts` (gate wiring, pre-fetch authorization order, forbidden page opacity, `authInterrupts`, middleware role-free, docs accuracy). Browser E2E for authenticated admin/non-admin flows is **skipped** — the repo has no seeded staging auth users for Playwright; route-level integration tests above are the strongest available coverage.

## 17. API authorization contract

| Condition | HTTP outcome (later admin APIs) |
|-----------|----------------------------------|
| Unauthenticated | **401** |
| Authenticated non-admin | **403** |
| Authenticated global admin | Continue |
| Authorization failure | No privileged operation |
| Unexpected internal failure | Opaque production-safe error |

Every admin API must re-check via the canonical resolver server-side.

## 18. Service-role policy

- Server-only; created only in trusted backend modules (`createServiceClient`).
- Never imported into client bundles; never `NEXT_PUBLIC_`.
- **Never** used as proof the caller is an admin.
- Use only **after** a successful global-admin authorization decision (later tasks).
- Scope to the minimum operation; no raw provider errors to clients.
- Mutations must be audited (WS13-T008).
- Ordinary users cannot select arbitrary service-role operations.

**WS13-T002 decision:** use an authorization-gated, server-only service-role reader. Browser clients keep the existing RLS posture and receive no global moderation SELECT policy.

## 18a. Privileged read architecture (WS13-T002)

The selected architecture is a **gated service-role API**, not administrator RLS:

1. `requireGlobalAdminApiAccess()` verifies the current Auth user through `getUser()`.
2. It passes only the verified `{ userId, appMetadata }` to the canonical `resolveGlobalAdminAuthorization`.
3. Anonymous API requests receive 401 JSON; authenticated denied identities receive 403 JSON.
4. Only after authorization do `listModerationReports()` / `listDmcaNotices()` create a service-role client.
5. The readers use explicit column lists, bounded pagination, allowlisted filters, stable newest-first ordering, and safe DTOs.
6. Routes are dynamic and return `private, no-store` cache controls.

Paths:

- API authorization: `apps/web/src/lib/security/admin-api-authorization.ts`
- Privileged readers and DTOs: `apps/web/src/lib/admin/moderation-data.ts`
- Routes: `GET /api/admin/reports`, `GET /api/admin/dmca`

No migration is required. Existing RLS remains the browser boundary: reporters may read only their own reports, ordinary users have no DMCA SELECT policy, and no browser receives service-role credentials.

Rejected for T002: direct administrator RLS. The canonical claim is server-verified and moderation list DTOs intentionally omit private source/claimant fields; keeping global reads behind the server reduces accidental browser exposure and avoids JWT-policy duplication.

## 18b. Moderation dashboard (WS13-T003)

`/admin` now loads real moderation reports and DMCA notices exclusively through the T002 server-only readers after awaiting the page gate. It does not query Supabase directly, use demo fixtures, or fall back to synthetic data.

- Default status: `pending`
- Ordering: `created_at DESC`, then `id DESC`
- Pagination: independent report and DMCA pages, 20 rows per page
- Filters: allowlisted report status/target type and DMCA status
- Privacy: list DTOs omit reporter identity, claimant email, legal statement, and signature
- Caching: dynamic server rendering with revalidation disabled; APIs use private no-store headers
- States: separate loading, empty, and opaque error states
- Accessibility: one page heading, labelled sections/filters, semantic lists, textual status, keyboard-accessible pagination, and responsive cards

## 18c. Report resolution actions (WS13-T004)

Pending moderation reports expose Resolve and Dismiss actions only inside the authorized `/admin` dashboard. The mutation route is `PATCH /api/admin/reports/[id]` and independently performs API authentication, canonical global-admin authorization, same-origin CSRF enforcement, UUID/action validation, and safe response mapping.

Status semantics:

- `pending → resolved`: reviewed and handled; leaves the pending queue
- `pending → dismissed`: reviewed with no moderation action required; leaves the pending queue
- identical completed action: idempotent success
- conflicting completed action: 409; never silently overwritten

The forward-only migration `20260718012526_ws13_t004_report_resolution.sql` adds a service-role-only, `SECURITY INVOKER` function. It locks the report row and performs the conditional status transition plus narrow audit insertion in one database transaction. Audit actions are `moderation_report.resolved` and `moderation_report.dismissed`; metadata contains only previous/resulting status and a schema version—never report text or claimant details.

The migration was created locally and was **not applied remotely**. It must be deployed through the normal reviewed migration process before the mutation route can work in an environment.

T004 deliberately does not hide content, suspend accounts, or apply ordinary report actions to DMCA notices.

## 18d. Canonical immutable admin auditing (WS13-T008)

All privileged WS13 mutations use the canonical audit mechanism:

- Server validator/writer: `apps/web/src/lib/admin/admin-audit.ts`
- Database writer: `public.insert_admin_audit_event`
- Forward-only migration: `20260718014945_ws13_t008_admin_audit.sql`

The database writer accepts only stable action/resource pairs, a server-derived actor UUID, a bounded idempotency key, an allowlisted result, and metadata capped at 4096 UTF-8 bytes. Sensitive keys including report, reason, note, token, cookie, authorization, email, provider error, signature, and statement are rejected.

`audit_logs` rows are append-only: ordinary roles cannot insert/update/delete; service role can insert but cannot update/delete; and a database trigger rejects UPDATE/DELETE even if a product role later receives an overly broad grant. A partial unique index provides idempotency by action, resource, target, and key.

WS13-T004 is redefined by the T008 migration to call the canonical database writer inside the same row-lock transaction. Resolve/dismiss retries reuse the same idempotency key and therefore cannot create duplicate action audits.

Read-only admin page visits are not mutation audit events. The migration is local only and must be deployed through the reviewed migration workflow.

## 18e. Reported content hiding (WS13-T005)

`POST /api/admin/content/hide` supports report-linked `profile` and `project` targets. Research is not accepted because the current moderation-report schema does not support it; media has no safe independent publication-state model.

The atomic `public.admin_hide_reported_content` function:

1. locks and verifies the source report and exact target;
2. inserts a private `moderation_content_holds` row;
3. sets `profiles.is_public = false` or `projects.is_published = false`;
4. marks a pending/reviewing source report resolved;
5. writes one idempotent `content.hidden` event through the T008 writer.

The hold table is RLS-forced with no ordinary-client policy. Private-schema `SECURITY DEFINER` trigger functions block direct owner attempts to set held content public, including direct Data API updates. The underlying owner record and media remain intact and owner-readable; removing a hold is deliberately deferred to a future reviewed workflow. Public profile/project cache paths are invalidated after success, and Circle/public loaders continue to exclude content through the existing visibility predicates.

## 18f. Account suspension (WS13-T006)

`POST /api/admin/users/[id]/suspend` suspends a reported account without deleting it.

Sequence (Auth Admin and Postgres are not one transaction):

1. authenticate and require the canonical global admin;
2. enforce same-origin CSRF for browser mutations;
3. load the target Auth user by path UUID (never by client email);
4. reject self-suspension, demo identities, service identities, and last-active-global-admin suspension;
5. verify optional report ownership matches the path user;
6. prepare durable `account_suspensions` state and unpublish owned public profile/project/research content;
7. apply Supabase Auth Admin `updateUserById(..., { ban_duration: '876000h' })`;
8. write `user.suspended`, or `user.suspension_partial` / `user.suspension_failed` for retryable reconciliation.

Stripe subscriptions are intentionally unchanged by suspension. Active JWTs are not claimed to be revoked immediately; durable publish blocking uses `is_current_account_suspended()` plus database triggers on profile/project/research publication fields. Account deletion remains a separate WS10 flow.

## 19. Admin RLS versus service-role decision boundary

| Concern | Owner |
|---------|--------|
| Who is a global admin? | **WS13-T001** (this document) |
| How admins read/write moderation tables | **WS13-T002** |
| Page UI data loading | **WS13-T003** |

Do not conflate RLS design with identity claims.

## 20. Client-side limitations

Client code **may**:

- Hide admin nav after receiving **server-derived** safe flags
- Improve UX

Client code **must not**:

- Decide authorization
- Inspect service-role credentials
- Trust `user_metadata` or client booleans
- Perform privileged Supabase reads as a substitute for the server gate
- Treat cached UI state as access control

## 21. Demo isolation

- Alex Chen / `DEMO_WORKSPACE` / preview routes are **not** global admins.
- Demo `app_metadata` must never grant production privileges.
- Resolver denies `isDemoIdentity: true`.
- Demo routes must not call privileged admin APIs or `createServiceClient` for moderation.
- Production administrator lists must never appear in demo fixtures or seed marketing content.
- Test admin fixtures must not leak into demo product content.

## 22. Audit requirements

Later admin role changes and admin actions require audit records with at least:

- Acting administrator ID
- Action
- Target type
- Target ID (when applicable)
- Timestamp
- Bounded safe metadata
- Result / status

Never store tokens, cookies, service-role keys, or unnecessary personal data. Full action auditing: **WS13-T008**.

## 23. Error / status behavior

| Situation | Resolver reason | Later HTTP / UX |
|-----------|-----------------|-----------------|
| No user | `unauthenticated` | 401 / sign-in |
| Signed in, not admin | `not_admin` | 403 / forbidden |
| Demo identity | `demo_identity` | 403 / forbidden |
| Malformed claim type | `misconfigured` | Fail closed (treat as deny; opaque 403/5xx as appropriate) |
| Global admin | `global_admin` | Allow |

## 24. Threat analysis

| Threat | Defense |
|--------|---------|
| User edits own metadata | Only `app_metadata` counts; `user_metadata` ignored |
| Tenant admin escalation | Tenant roles never grant global admin |
| Forged client role | Resolver ignores caller-supplied roles; no request role param |
| Client state manipulation | Server re-check required |
| Leaked admin navigation | UX only; server gate required (WS11-T002) |
| Email substring / domain match | Not used (Policy A) |
| Compromised demo account | Demo identities denied; demo not provisioned as admin |
| Stale admin sessions | Documented refresh/invalidation boundary; destructive ops re-check |
| Service-role leakage | Server-only; not identity |
| Unguarded admin APIs | Contract: every API must call resolver (WS13-T002+) |
| Competing helpers | Single resolver module |
| Persistent bootstrap backdoor | No env allowlist |
| Administrator lockout | Project-owner Dashboard recovery |
| Cross-user / IDOR | Authorization boundary defined; IDOR still requires per-action checks later |

T001 does **not** by itself eliminate future API IDOR.

## 25. Test matrix

Covered by `admin-authorization.test.ts` and `admin-authorization.contract.test.ts`:

- Unauthenticated / missing / empty metadata
- Exact `"admin"` accept
- Case / similar strings reject
- Array / non-string role → misconfigured
- `user_metadata` / tenant role / caller role ignored
- Demo identity deny
- Env allowlist not consulted
- Public env vars unused
- Fail closed + stable reasons
- `server-only` import + no client imports of resolver

## 26. Deployment configuration

- No new required env vars for authorization.
- Ensure `SUPABASE_SERVICE_ROLE_KEY` remains server-only for later privileged ops (not for identity).
- Provision admins via Auth Admin / Dashboard per environment.

## 27. Manual operational steps

1. Identify operator Auth user (non-demo).
2. Set `app_metadata.role = "admin"`.
3. Operator refreshes session.
4. After WS11-T002, verify allow/deny.
5. To revoke: remove claim; optionally invalidate sessions.

## 28. Deferred work

- WS11-T002 — `/admin` role gate — **done** (§16a)
- WS13-T002 — gated service-role API — **done** (§18a)
- WS13-T003 — real moderation and DMCA dashboard — **done** (§18b)
- WS13-T004 — report resolve/dismiss — **done** (§18c)
- WS13-T008 — canonical immutable admin mutation auditing — **done** (§18d)
- WS13-T005 — reported profile/project hiding with durable holds — **done** (§18e)
- WS13-T006 — account suspension with Auth ban + durable publish blocks — **done** (§18f)
- WS13-T007 — moderation notes
- Public role-management UI/API — not planned for T001

## 29. Mapping to WS11-T002 (implemented)

WS11-T002 implemented this as specified:

- `resolveGlobalAdminAuthorization` runs on the server `/admin` path and layout (via `enforceGlobalAdminAccess`)
- Only `authorized: true` continues
- Non-admins are forbidden (403); anonymous → sign-in behavior kept
- No client flags trusted

## 30. Mapping to WS13-T002 through WS13-T008

| Task | Depends on this model |
|------|------------------------|
| WS13-T002 | Authorize before any service-role / admin RLS path |
| WS13-T003 | Fetch moderation data only after authorize |
| WS13-T004+ | Mutations only after authorize + audit |
| WS13-T008 | Audit admin actions and role changes |

---

## Architecture decision record

### Decision

Use Supabase Auth **`app_metadata.role === "admin"`** as the sole canonical global platform-admin claim, with a single server-only resolver and **no** environment email allowlist (Policy A).

### Status

Accepted for MVP (WS13-T001).

### Context

- `/admin` currently requires only authentication (middleware + page `getUser()`).
- Page queries `moderation_reports` / `dmca_notices` with the user-scoped client; RLS denies admin-wide SELECT (reporters see own reports only; DMCA has insert-only for clients).
- `tenant_role` includes `admin` but is membership-scoped.
- No existing dedicated platform-admin table or resolver.
- Implementation plan candidates included env allowlist vs `app_metadata`; prefer durable Auth claim.

### Alternatives considered

See §6. Security-critical rejections: `user_metadata`, tenant role, client flags, service-role-as-identity, email substring/domain allowlists, hardcoded IDs.

### Security consequences

- Ordinary users cannot self-promote via profile APIs.
- Tenant admins cannot escalate by membership alone.
- Fail-closed on malformed claims.
- Residual risk: JWT may carry stale `app_metadata` until refresh — mitigated by re-check + session invalidation for emergencies.

### Operational consequences

- Admins provisioned via Dashboard / Admin API per environment.
- No new env var surface for allowlists.
- Lockout recovery is infrastructure (project owner), not application backdoor.

### Migration implications

- **None.** Prefer no migration when using `app_metadata`.
- No remote migration applied for T001.

### Rollback / recovery

- Remove resolver usage in later tasks if model changes (T001 alone does not gate routes).
- Revoke by clearing `app_metadata.role`.
- Recover lockout via Supabase project owner.

### Follow-up tasks

- WS11-T002, WS13-T002–WS13-T008 as listed above.

---

## Current repository behavior (audit snapshot)

| Area | Behavior at T001 |
|------|------------------|
| `/admin` page | Auth required; no role check; attempts RLS-scoped reads |
| Middleware | `/admin/*` requires session only |
| Admin APIs | None for moderation review |
| `POST /api/moderation/report`, `/api/dmca` | Public ingest; not admin |
| `createServiceClient` | Account deletion / jobs — not admin identity |
| Env schema | No admin email vars |
| Demo | Alex Chen static workspace; not Auth admin |

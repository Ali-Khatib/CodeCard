# CodeCard operations runbook

Operational procedures for CodeCard MVP. **Keep secrets out of this repository.**
Never paste service-role keys, database passwords, Stripe secrets, Upstash tokens, or Sentry auth tokens into this file or into tickets.

Primary owners: engineering + whoever holds Supabase / Vercel / Stripe org admin.

---

## 1. System inventory

| System | Identifier / notes | Role |
|--------|-------------------|------|
| Production Supabase | Project ref `gclteunkzorwaliwhatp` | Authoritative prod DB, Auth, Storage |
| Isolated E2E Supabase | Ref prefix `zbum…` (never production) | Disposable Playwright / CI backend |
| Vercel MVP | Project `codecard-mvp` (`prj_ZTosasXt5TxnUQf4WTfcTbN8k1UN`), branch `mvp` | Staging / MVP app — `https://codecard-mvp.vercel.app` |
| Vercel marketing | Project `code-card-web` (`prj_E5wdwC2T4SYTZsRS6xh20p56LJZn`), branch `main` | Marketing / future production |
| Storage buckets | `avatars`, `project-media`, `private-docs` (+ research figures per migrations) | User media / private docs |
| Auth | Supabase Auth (email + OAuth per `AUTH_PROVIDER_CONFIGURATION.md`) | Sessions, redirects |
| Stripe | Test mode on MVP; live only on true production | Checkout, webhooks `/api/webhooks/stripe` |
| Sentry | Org `code-card`, project `javascript-nextjs` | Error monitoring — [`SENTRY.md`](./SENTRY.md) |
| Upstash Redis | REST URL/token on `codecard-mvp` | Rate limits — [`UPSTASH.md`](./UPSTASH.md) |

Env inventory (names only): [`VERCEL_ENVIRONMENT.md`](./VERCEL_ENVIRONMENT.md).

---

## 2. Access and ownership

| Service | Required access | Where credentials live |
|---------|-----------------|------------------------|
| Supabase production | Owner / admin | Supabase Dashboard; DB password in Supabase vault / password manager — **not Git** |
| Supabase E2E | Eng with CI secrets | GitHub Actions secrets + local `apps/web/.env.e2e.local` (gitignored) |
| Vercel | Project admin | Vercel team; env vars in project settings |
| Stripe | Restricted keys as needed | Stripe Dashboard / Vercel env |
| Sentry | Member+ | Sentry org; DSN in Vercel; auth token build-only if used |
| Upstash | Database admin | Upstash console; REST token in Vercel only |

Recovery credentials are **never** committed. Rotate any credential pasted into chat.

---

## 3. Pre-migration preparation

Before **any** production schema change (WS14-T014 and later):

1. Confirm branch `mvp` (or release branch) contains the intended migration files under `supabase/migrations/`.
2. List migrations in lexicographic order (filename timestamps). Inventory as of this runbook:
   - `20250627000001_initial_schema.sql` … through …
   - `20260719153000_repair_project_research_tenant_ownership_rls.sql` (**29** files).
3. Review each new migration for irreversible drops, RLS loosening, or data backfills.
4. Confirm application deployment sequencing: **schema first only when additive/compatible**; otherwise deploy app that tolerates both schemas, then migrate, then remove compatibility.
5. Record schema-history expectation: Supabase `supabase_migrations.schema_migrations` (or Dashboard → Migrations) should match repo after apply.
6. Decide maintenance window if exclusive locks or long backfills are expected.
7. Complete **§4 Backup procedure** and record the evidence template (§9).

**Agents must not run** `supabase db push` or `npm run db:migrate` against production. Humans only, after the PRODUCTION GATE.

---

## 4. Backup procedure

### 4.1 Confirm Supabase-supported backups

1. Open Supabase → project **`gclteunkzorwaliwhatp`** → **Database** → **Backups** (wording may be “Point-in-Time Recovery” / “Daily backups” depending on plan).
2. Confirm the plan’s actual features:
   - Daily backups (typical on paid plans)
   - PITR window **only if enabled on the plan** — do **not** invent an RPO
3. Note the latest backup timestamp and whether restore is self-serve or support-assisted for this plan.
4. Optional logical export (non-secret metadata only in tickets): Dashboard SQL or `pg_dump` via the pooled connection string from the dashboard — store the dump in encrypted ops storage, **never in Git**.

### 4.2 Storage and Auth

- **Storage:** Backups of Postgres do not replace object storage. Inventory critical buckets; for major incidents, export/list prefixes you must preserve.
- **Auth:** User rows live in `auth` schema; restoring DB restores Auth. Coordinate password-reset / session invalidation after restore.

### 4.3 Verification

- [ ] Backup / PITR status confirmed in Dashboard (screenshot or ticket note with **timestamp**, not credentials)
- [ ] Operator name recorded
- [ ] No backup artifacts committed to the repo

### 4.4 Realistic RPO/RTO (do not invent)

Document only what the Dashboard shows, for example:

| Metric | How to state it |
|--------|-----------------|
| RPO | “Daily backup → up to ~24h data loss” **or** “PITR window N hours” if enabled |
| RTO | Estimate restore + DNS/app verification time after a drill; unknown until first restore drill |

Until measured, mark RTO as **unverified**.

### 4.5 Analytics backup retention

Primary-table analytics cleanup does **not** erase backup copies. Define backup retention with the Supabase plan before claiming complete erasure. See [`ANALYTICS_RETENTION.md`](./ANALYTICS_RETENTION.md).

---

## 5. Migration procedure (production)

### PRODUCTION GATE (print before acting)

State explicitly:

- System: Supabase production `gclteunkzorwaliwhatp`
- Effect: apply pending SQL migrations from `supabase/migrations/`
- Backup status: (filled from §4)
- Rollback method: (§6)
- Manual vs automated: **manual human only**
- Production write: **yes**

Wait for **explicit** user confirmation. Prior batch approval is not enough.

### Steps

1. Link locally only for the operator session: `npx supabase link --project-ref gclteunkzorwaliwhatp` (password from Dashboard — not logged).
2. Prefer Dashboard **SQL / Migrations** review of pending files, or operator-run `npm run db:migrate` (**human**, not agent).
3. **Do not** use `supabase db push` from Cursor agents or CI against production.
4. Stop if: migration errors, RLS lockout symptoms, unexpected drop, or checksum/history mismatch.
5. Verify:
   - Migration history includes the new versions
   - Spot-check tables/policies named in the migration
   - Read-only app smoke: `/`, `/sign-in`, one public slug if known, webhook route responds (signature still required)

---

## 6. Rollback procedure

### 6.1 Application / Vercel

1. Vercel → project → Deployments → **Promote** / **Rollback** to the last known-good deployment.
2. Confirm alias (`codecard-mvp.vercel.app` or production domain) points at the rolled-back deployment.
3. Prefer **forward-fix** app deploys that tolerate both schemas when possible.

### 6.2 Database

| Situation | Action |
|-----------|--------|
| Additive migration failed mid-way | Fix forward with a new migration; avoid editing historical files |
| Bad migration fully applied | Prefer **forward-fix** SQL migration reversing the change |
| Catastrophic data/schema damage | Restore from Supabase backup / PITR per Dashboard (production restore is a separate PRODUCTION GATE) |
| Irreversible destructive migration | Restore is the only option — call this out before apply |

### 6.3 Cross-system implications

- **Storage:** Restoring DB without storage (or vice versa) can leave orphan objects or broken paths — inventory before restore.
- **Auth:** Restored Auth may re-enable deleted users or revive sessions — plan communications.
- **Stripe:** Subscriptions are source-of-truth in Stripe; after DB restore, reconcile `subscriptions` / webhook replay carefully (no live-mode experiments in MVP test).

---

## 7. Incident response (short)

| Incident | First actions |
|----------|---------------|
| Migration failure | Stop; do not retry blindly; capture error; roll forward or restore per §6 |
| Partial migration | Inspect `schema_migrations`; apply compensating migration or restore |
| App/schema mismatch | Roll back Vercel deploy; freeze migrations |
| RLS lockout | Service-role diagnosis only by admin; restore policies via forward-fix; never disable RLS in prod as a “fix” |
| Accidental public exposure | Unpublish content; rotate keys if leaked; Sentry/audit review |
| Upload outage | Check Storage RLS + Upstash upload limits + Vercel logs |
| Rate-limit outage | See [`UPSTASH.md`](./UPSTASH.md); fail-closed vs fail-open by route type |
| Sentry outage | App continues; fix DSN/quota; no user-facing dependency |
| Stripe webhook delay | Check signing secret + endpoint URL; replay from Stripe Dashboard |

---

## 8. Post-recovery validation

Checklist after rollback or restore:

- [ ] Schema / migration history matches expectation
- [ ] RLS: owner can read own rows; anon cannot read private (spot checks on non-prod first when possible)
- [ ] Public profiles render
- [ ] Sign-in / OAuth callback
- [ ] Uploads (non-prod preferred)
- [ ] Analytics ingest (bounded)
- [ ] Account export/delete still gated and authenticated
- [ ] Stripe webhook returns signature errors on unsigned POST (expected)
- [ ] Sentry receives a controlled event if monitoring required
- [ ] Rate limits: verify probe or known 429 path on non-prod

---

## 9. Evidence template

Copy into the ops ticket:

```text
Operator:
Timestamp (UTC):
Supabase project ref:
Backup / PITR reference (timestamp or id — no secrets):
Migration range (from → to filenames):
Outcome: success | aborted | restored
Rollback decision: none | app-only | forward-fix | full restore
Verification evidence: (links to deploy, checklist ticks)
```

---

## 10. Ops drill record (non-production tabletop)

**Date:** 2026-07-20  
**Type:** Tabletop (documentation + procedure walkthrough — **no** production restore, **no** destructive SQL)  
**Scenario:** “Migration `repair_project_research_tenant_ownership_rls` fails halfway on production.”

Walked:

1. **Stop condition:** Halt further migrates; leave app on last good Vercel deploy if schema incompatible.
2. **Application rollback:** Vercel → prior Ready deployment on `codecard-mvp` / production project.
3. **Schema verification:** Compare Dashboard migration history to `supabase/migrations/` filenames; do not edit old files.
4. **Cleanup:** No production changes performed in this drill.
5. **Distinction:** Procedure documented and rehearsed verbally/on paper; **full restore not executed** (requires separate PRODUCTION GATE).

---

## Analytics event retention (WS08-T012)

Canonical policy and manual cleanup checklist:

→ [`ANALYTICS_RETENTION.md`](./ANALYTICS_RETENTION.md)

Summary:

- Raw analytics events in `analytics_events`, `public_profile_events`, and `project_view_events` are retained for **up to 90 days** (UTC server timestamps).
- Owner dashboards currently aggregate from raw events; cleanup will remove older history from dashboards.
- Cleanup is **manual** until a safe scheduled job is approved and implemented.
- Do **not** apply the 90-day rule to billing, audit, moderation, DMCA, security, or auth records.

### Launch / ops checklist items

- [ ] Raw analytics retention policy reviewed (`docs/ANALYTICS_RETENTION.md`)
- [ ] Manual analytics cleanup dry-run procedure reviewed
- [ ] Backup retention period for analytics defined (see §4.5 — align with Supabase plan)
- [ ] First cleanup cycle dry-run recorded (environment, cutoff, eligible counts)

### Quick ops reminders

1. Dry-run `COUNT(*)` before any delete.
2. Verify environment and backup (§4).
3. Delete only the three audited analytics tables.
4. Record the cleanup result.
5. Escalate unexpected volume or failures.

---

## Related documents

- [`SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md)
- [`VERCEL_ENVIRONMENT.md`](./VERCEL_ENVIRONMENT.md)
- [`SENTRY.md`](./SENTRY.md)
- [`UPSTASH.md`](./UPSTASH.md)
- [`ANALYTICS_RETENTION.md`](./ANALYTICS_RETENTION.md)
- [`RLS_ACCESS_MATRIX.md`](./RLS_ACCESS_MATRIX.md)
- [`../LAUNCH_CHECKLIST.md`](../LAUNCH_CHECKLIST.md) (gitignored local ops checklist)
- Privacy Policy (web): `/legal/privacy`

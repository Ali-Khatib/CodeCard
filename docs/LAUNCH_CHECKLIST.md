# CodeCard launch checklist (WS14-T018)

**Canonical tracked source of truth.**
Do not treat the gitignored root `/LAUNCH_CHECKLIST.md` as authoritative.

| Field | Value |
|-------|--------|
| Task | WS14-T018 |
| Date recorded | 2026-07-21 |
| MVP app | `codecard-mvp` → https://codecard-mvp.vercel.app |
| Production deploy | `dpl_GJopQb3PyqXZySpK9sdV4hsFTrmD` @ commit `454b396` |
| Production Supabase | `amneeddkxfbednqwzhao` (`codecard-production`) |
| Preview / staging Supabase | `zbumnudyvclkmynpqjsr` (`codecard-e2e`) |
| Legacy Supabase | `gclteunkzorwaliwhatp` — **INACTIVE** |

Status values used below: **Complete** · **Blocked** · **Not applicable** · **Known risk**.

Evidence kinds are labeled: `mocked` · `isolated-live-e2e` · `staging` · `production-readonly` · `user-dashboard` · `commit` · `docs` · `ci-contract`.

---

## Why root `LAUNCH_CHECKLIST.md` was ignored

`.gitignore` listed bare `LAUNCH_CHECKLIST.md` (any path). That matched the historical local ops scratch file and would also have blocked `docs/LAUNCH_CHECKLIST.md`.

**T018 fix:** ignore is now root-only (`/LAUNCH_CHECKLIST.md`), matching `/SECURITY_CHECKLIST.md`. Canonical checklist lives at `docs/LAUNCH_CHECKLIST.md`.

---

## Explicit pre-launch facts

| Fact | Classification |
|------|----------------|
| Production database is empty | Intended pre-launch condition |
| No first production account created | Intended pre-launch condition |
| Stripe remains in test mode (`sk_test_` on MVP) | Accepted validation-stage limitation (blocks **paid** launch only) |
| Production has not processed a real subscription | Accepted validation-stage limitation |
| Public-profile LCP median passed; 3/7 runs > 3000 ms | Known risk — accepted for validation launch |
| Legacy has no managed backup; remains INACTIVE | Accepted validation-stage limitation (rollback uses Vercel prior deploy + staging separation; not legacy restore) |
| Rollback retains prior Vercel env values + staging/legacy separation | Documented procedure — Complete for app rollback |
| Preview continues to use staging, not production | Intended / verified |

None of the empty-DB / zero-user facts are P0 blockers for MVP validation signup.

---

## Launch decisions (do not initiate either launch from this doc)

| Decision | Verdict |
|----------|---------|
| **MVP validation launch** (controlled signup on empty prod) | **GO** |
| **Real paid production billing** | **NO-GO** |

### Conditions to change NO-GO → GO (paid billing)

1. Authorized Stripe live-mode cutover (`sk_live_`, live webhook endpoint, live price IDs) on the intended production Vercel project.
2. End-to-end test checkout + webhook ledger verification in live mode under a PRODUCTION GATE.
3. Confirm Production still points at `amneeddkxfbednqwzhao` (or a separately authorized live billing project) with no Preview/production mixing.
4. Operator-recorded evidence of a successful paid subscription cycle (create → invoice → portal cancel/resume as required).

---

## Checklist (38 areas)

### 1. Authentication — **Complete**

- Isolated live E2E: `apps/web/e2e/auth.live.spec.ts` (WS14-T002) — sign-up provisions tenant/membership/profile; sign-in/out; isolation; redirect hardening. Commit `80d46a9`.
- CI wiring: `.github/workflows/ci.yml` `playwright-live-e2e` + contract `playwright-ci.contract.test.ts` (`558dde8`).
- Production-readonly: `/sign-in` and `/sign-up` load forms without Supabase config errors; `/dashboard` → `/sign-in?redirect=%2Fdashboard` (cutover verify 2026-07-21).
- User-dashboard: Auth Site URL + callback allowlist on `amneeddkxfbednqwzhao` confirmed by operator.

### 2. Password reset — **Complete**

- Isolated live E2E covers forgot-password generic response, missing-recovery safety, and full Mailtrap recovery path when Mailtrap secrets are present (`auth.live.spec.ts`, `80d46a9`).
- Production-readonly: `/forgot-password` loads (2026-07-21).
- Note: production email delivery for the **first** real user is an ops check at first signup (empty prod; no production mailbox test run).

### 3. Profile editing and publishing — **Complete**

- Isolated live E2E: `profile.live.spec.ts` (WS14-T003) commit `33ce14a`.

### 4. Project CRUD — **Complete**

- Isolated live E2E: `projects.live.spec.ts` (WS14-T004) commit `22a8608`.

### 5. Research CRUD — **Complete**

- Isolated live E2E: `research.live.spec.ts` (WS14-T005) commit `97eaac7`.

### 6. Upload security and behavior — **Complete**

- Docs: `docs/WS11_T010_UPLOAD_SECURITY.md`, `docs/WS04_T013_UPLOAD_SECURITY_DECISION.md`.
- Isolated live E2E: `uploads.live.spec.ts` (WS14-T009) commit `ec7af91`.
- Storage buckets + RLS on production (T014 evidence).

### 7. Public profiles — **Complete**

- Isolated live E2E: `public.live.spec.ts` (WS14-T006) commit `6393429`.
- Production empty: no production public profiles yet (intended). Demo `/demo` remains static/preview content.

### 8. Sharing — **Complete**

- Isolated live E2E sharing surfaces in `public.live.spec.ts` / account flows (`6393429`).

### 9. QR generation — **Complete**

- Isolated live E2E: WS14-T006 public profile sharing and QR (`6393429`).

### 10. Analytics — **Complete** (validation scope)

- Isolated live E2E: `analytics.live.spec.ts` (WS14-T008) commit `c44ec54` — recording, allowlists, owner exclusion, cross-tenant denial.
- Production analytics tables empty (production-readonly cutover verify).
- Retention policy documented: `docs/ANALYTICS_RETENTION.md` (cleanup cycles still manual — Known risk below).

### 11. Export — **Complete**

- Isolated live E2E: `account.live.spec.ts` export JSON (WS14-T007) commit `cc14d42`.
- Inventory: `docs/account-data-inventory.md`.

### 12. Account deletion — **Complete**

- Isolated live E2E hard-delete + session invalidation (`cc14d42`).

### 13. RLS coverage — **Complete**

- Matrix: `docs/RLS_ACCESS_MATRIX.md` + pgTAP / CI companion.
- WS14-T010 RLS integration coverage commit `3f5fffe`; CI job `rls-integration`.

### 14. Forced RLS — **Complete**

- Production-readonly post-migrate: RLS enabled **32/32**, forced **32/32** (`docs/WS14_T014_PRODUCTION_MIGRATION.md`, apply 2026-07-20T23:57:54Z).

### 15. Cross-tenant isolation — **Complete**

- Isolated live E2E auth/profile/projects/research/analytics + RLS suite (`80d46a9`…`3f5fffe`).

### 16. Project/research ownership repair — **Complete**

- Migration `20260719153000_repair_project_research_tenant_ownership_rls` applied on production (T014).
- Commit `7c7ba3c` (repair implementation).

### 17. Storage policies — **Complete**

- Buckets on production: `avatars`, `project-media`, `private-docs` with owner policies (T014 evidence + cutover re-verify 2026-07-21).

### 18. Stripe signature verification — **Complete** (test mode)

- Docs: `docs/STRIPE_WEBHOOK_SECURITY.md`.
- Mocked/unit: WS14-T011 commit `002c866`.
- Production-readonly: unsigned `POST /api/webhooks/stripe` → `400 {"error":"Missing signature"}` (cutover 2026-07-21).

### 19. Stripe idempotency and retry safety — **Complete** (test-mode code path)

- Documented + unit coverage in T011 (`002c866`) / webhook security doc (processing states, `409` semantics).

### 20. Stripe test-mode configuration — **Complete**

- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRO_PRICE_ID` set on `codecard-mvp` P+Pr (names only; `docs/VERCEL_ENVIRONMENT.md`).
- Live mode **not** enabled → paid billing **NO-GO**.

### 21. Secret scanning — **Complete**

- `npm run security:scan` (`scripts/check-secrets.js`); CI `secret-scan` policy `docs/CI_SECURITY_AUDITING.md` (WS11-T009 lineage).

### 22. Dependency audit — **Complete**

- `npm run security:audit` policy + CI `dependency-audit` (`docs/CI_SECURITY_AUDITING.md`).

### 23. CI — **Complete**

- Workflow `.github/workflows/ci.yml` on `main`/`mvp`: typecheck/lint/test, secret-scan, dependency-audit, RLS, Playwright live E2E (T012 `558dde8`).
- Contract tests encode wiring; live green status depends on GitHub Actions secrets remaining configured.

### 24. Live isolated E2E — **Complete**

- Specs T002–T009 against isolated/`zbum*` backend; CI runs T002–T007 set; analytics/uploads available via package scripts.
- Production never used as E2E target (env guards refuse legacy production ref).

### 25. Vercel Production/Preview separation — **Complete**

- Docs: `docs/VERCEL_ENVIRONMENT.md` (T013 `a1d59a9`).
- Cutover: Production Supabase → `amneeddkxfbednqwzhao` (JS host confirmed on deploy `dpl_GJopQb3PyqXZySpK9sdV4hsFTrmD`); Preview env last updated pre-cutover for staging (`zbumnudyvclkmynpqjsr`); E2E secrets not on Production.

### 26. Sentry — **Complete**

- Commit `b3ff6ad` + `docs/SENTRY.md` + contract tests.
- Vercel: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` on P+Pr.
- Controlled verify: probe returned **200** with event title **CodeCard WS14-T015 Sentry verification event**; flag removed; steady-state probe **404** (reconfirmed 2026-07-21).

### 27. Upstash rate limiting — **Complete**

- Commit `9494229` + `docs/UPSTASH.md` + contract tests.
- Vercel: `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` on P+Pr.
- Verify flag `CODECARD_RATE_LIMIT_VERIFY` removed after T016 gate; steady-state probe **404** (reconfirmed 2026-07-21).
- Fail-closed behavior for sensitive types documented.

### 28. Backup and rollback runbook — **Complete** (tabletop)

- `docs/RUNBOOK.md` (T017 `27f136f`) + contract `runbook.contract.test.ts`.
- Ops drill **2026-07-20** (tabletop only; no production restore).
- RTO still unmarked until a real restore drill (Known risk).

### 29. Production migration deployment — **Complete**

- `docs/WS14_T014_PRODUCTION_MIGRATION.md`; commits mvp `454b396` / main `97b8005`.
- Method: `migration up --linked` (not `db push`); 29/29 remote; empty app data.

### 30. Production cutover — **Complete**

- Production env cutover to `amneeddkxfbednqwzhao`; redeploy `dpl_GJopQb3PyqXZySpK9sdV4hsFTrmD`.
- Auth URLs configured (user-confirmed).
- Smoke + production-readonly DB verify 2026-07-21 (0 users; empty tables; 29 migrations; 3 buckets).
- No seed, no user create, no schema mutation during cutover verify.

### 31. Public-profile performance — **Complete** with **Known risk**

- Commits culminating in mvp `d1e553f` (+ intermediates); docs `PUBLIC_PROFILE_PERFORMANCE.md`.
- Seven-run mobile Lighthouse on staging public profile (pre-empty-prod):
  - median LCP **2265 ms** (pass &lt; 2500)
  - min **1357** / max **4031**
  - **4/7** &lt; 2500; **3/7** &gt; 3000
  - median CLS ~0.006; median TBT ~259 ms; median score ~93
- **Known risk (accepted):** slow-run variability — cold/edge variance can exceed 3s even when median passes. Re-measure after first real published production profile.

### 32. Development seed workflow — **Complete**

- Commit `3036be8` + `docs/LOCAL_SEED.md` + seed guard (rejects production refs including legacy; staging only with explicit allow).
- Production seed **not** run (cutover confirmations).

### 33. Accessibility — **Complete** (MVP web)

- WS12 commits `6458fbc`…`7d352b1` (skip link, labels, focus, contrast, reduced motion, dialogs, touch, responsive forms).
- WS12-T011 axe CI lineage where present; public a11y audit `5502cb1`.

### 34. Responsive behavior — **Complete**

- WS12-T012 `7d352b1` + related touch/target work.

### 35. Reduced-motion behavior — **Complete**

- WS12-T006 `d2e900f`.

### 36. Operational ownership — **Complete** (founding-operator model)

- Runbook inventory names systems, Vercel projects, Supabase refs, and PRODUCTION GATE rules (`docs/RUNBOOK.md`).
- Single-operator ownership assumed until a larger roster is documented.

### 37. Known limitations — **Complete** (recorded)

See Known risks / N/A sections and GO/NO-GO above. Explicitly out of v1 product scope remains: public comments, messaging, recruiter CRM, marketplace, in-app mobile IAP, etc. (historical root scratch checklist).

### 38. Launch rollback procedure — **Complete** (documented)

- App: redeploy prior Ready deployment on `codecard-mvp`.
- Env: restore previous Production Supabase URL/keys if cutover regresses (retain Preview→staging).
- Schema: forward-fix preferred; full DB restore requires PRODUCTION GATE + plan backup capability (Free plan has **no** managed backups on legacy/new Free projects — limitation recorded).
- Drill: 2026-07-20 tabletop.

---

## Blocked

_None for MVP validation launch._

Paid billing remains **NO-GO** (not a validation-launch blocker).

---

## Not applicable

| Item | Rationale |
|------|-----------|
| Mobile App Store / EAS launch | Web MVP validation only; Expo companion not required for signup validation |
| Custom production domain | MVP uses `codecard-mvp.vercel.app`; custom domain optional |
| Live Stripe payment in production | Deliberately deferred; test mode only |
| Production seed / alex-chen / local-dev copy | Forbidden; empty prod is intentional |
| Restoring legacy `gclteunkzorwaliwhatp` | Must remain INACTIVE |
| Attorney-completed legal review | Legal pages exist (`/legal/privacy`, `/legal/terms` 200); formal counsel sign-off is a separate business process — track as ops follow-up, not a code P0 for empty-prod validation |

---

## Known risks (accepted or unresolved)

| Risk | Status |
|------|--------|
| Public-profile LCP: 3/7 runs &gt; 3000 ms despite median pass | **Accepted** for validation launch; re-measure on first real prod profile |
| Free-plan Supabase: no managed PITR/daily backups | **Accepted** limitation; rely on Vercel rollback + migration replay discipline |
| RTO unverified (no full restore drill) | **Accepted** until paid plan / restore drill |
| Analytics 90-day cleanup not yet dry-run on production | **Accepted** (empty prod); follow RUNBOOK before first cleanup |
| First production email (confirm/reset) not exercised on empty prod | **Accepted**; validate at first real signup |
| `code-card-web` marketing project may lack service-role/Stripe | **N/A** to MVP app path; do not mix with `codecard-mvp` cutover |

---

## Cutover evidence summary

| Item | Evidence |
|------|----------|
| Production host | `amneeddkxfbednqwzhao.supabase.co` in Production JS (`dpl_GJopQb3…`) |
| Preview | Staging ref `zbumnudyvclkmynpqjsr` (Preview env not rewritten at cutover) |
| Auth | Site URL + `/auth/callback` allowlisted (user-confirmed) |
| Migrations | 29/29 |
| Auth users / app rows | 0 |
| Storage | `avatars`, `project-media`, `private-docs` |
| Stripe unsigned | 400 Missing signature |
| Safety | No seed, no user, no `db push`, no secret exposure |

---

## Related documents

- [`WS14_T014_PRODUCTION_MIGRATION.md`](./WS14_T014_PRODUCTION_MIGRATION.md)
- [`VERCEL_ENVIRONMENT.md`](./VERCEL_ENVIRONMENT.md)
- [`RUNBOOK.md`](./RUNBOOK.md)
- [`SENTRY.md`](./SENTRY.md)
- [`UPSTASH.md`](./UPSTASH.md)
- [`PUBLIC_PROFILE_PERFORMANCE.md`](./PUBLIC_PROFILE_PERFORMANCE.md)
- [`LOCAL_SEED.md`](./LOCAL_SEED.md)
- [`SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md)
- [`STRIPE_WEBHOOK_SECURITY.md`](./STRIPE_WEBHOOK_SECURITY.md)
- [`RLS_ACCESS_MATRIX.md`](./RLS_ACCESS_MATRIX.md)
- [`CI_SECURITY_AUDITING.md`](./CI_SECURITY_AUDITING.md)

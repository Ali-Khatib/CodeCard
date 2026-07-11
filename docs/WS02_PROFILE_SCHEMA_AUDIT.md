# WS02-T001 — Profile Schema Audit

**Date:** 2026-07-12  
**Scope:** Analysis and documentation only. No schema, UI, or application behavior changes in this task.  
**Sources inspected:** `supabase/migrations/20250627000001_initial_schema.sql` through `20250627000006_project_case_study_sections.sql`, `20250627000002_rls_policies.sql`, `20250627000005_handle_new_user_slug.sql`, `packages/validation/src/index.ts`, `packages/types/src/index.ts`, `ProfileEditor`, `dashboard-overview-view.tsx`, `dashboard-profile-view.tsx`, `dashboard/(authenticated)/page.tsx`, `dashboard/(authenticated)/projects/page.tsx`, `[slug]/page.tsx`, `public-profile-focused.tsx`, `profile-completion.ts`, `portfolio.ts`, `workspace-demo.ts`, `demo-data.ts`, signup provisioning pgTAP tests.

---

## Executive summary

The database models core MVP profile identity (`display_name`, `headline`, `bio`, `avatar_url`, `slug`, `is_public`, timestamps, tenant/owner linkage). Social links live in `profile_links` with RLS; dashboard link CRUD is not built yet.

**Confirmed gaps before WS02-T002:**

| Area | Status |
|------|--------|
| `location` | Demo/local `useState` and props only — **no DB column** |
| `skills` | Not in DB; not in authenticated editor — marketing/research copy only |
| `company` | Parsed from `headline`; dashboard `useState('Stripe')` is ephemeral |
| Avatar upload | Column exists; no save path |
| Profile links | DB read works; no editor |
| Profile updates | Client `supabase.from('profiles').update()` via `ProfileEditor` |

---

## Explicit findings (location & skills)

### 1. Does `location` exist outside local/demo state?

**No persisted column.** It appears only in:

| Source | File |
|--------|------|
| Demo constant | `lib/projects/demo-data.ts` → `DEMO_PROFILE.location` |
| Dashboard local state | `dashboard-overview-view.tsx`, `dashboard-profile-view.tsx` (`useState('San Francisco')`) |
| Preview/demo routes | `dashboard/preview/projects/page.tsx`, `demo/card/page.tsx` pass demo location into `profileToPortfolioCreator` |
| Public profile prop | `public-profile-focused.tsx` renders `location` when passed — not loaded from DB on `[slug]/page.tsx` |
| Portfolio creator extras | `portfolio.ts` `extras.location` override |

### 2. Does `skills` exist outside local/demo state?

**No.** Referenced in research/marketing (`lib/research/sources.ts`, landing copy). Not in `profiles`, not in `ProfileEditor`, not on public profile UI.

### 3. Components that read or edit location/skills

| Component | Location | Skills |
|-----------|----------|--------|
| `dashboard-overview-view.tsx` | Local `useState`; inputs in edit panel (not saved) | — |
| `dashboard-profile-view.tsx` | Local `useState`; inputs (not saved) | — |
| `ProfileEditor` | — | — |
| `public-profile-focused.tsx` | Read-only prop | — |
| `dashboard-profile-header.tsx` | Displays `creator.location` from portfolio mapper | — |
| Demo/preview routes | `DEMO_PROFILE.location` | — |

### 4. Lost after refresh?

**Yes** for dashboard location inputs — they are React local state, not written to Supabase. Skills are not editable in authenticated UI.

### 5. Profile-update security model (current)

- **Path:** Browser `createClient()` → `profiles.update()` with `.eq('id', profile.id)` in `ProfileEditor`.
- **Validation:** `updateProfileSchema` (Zod) before write.
- **Authorization:** Supabase RLS `profiles_update` — `owner_user_id = auth.uid()`.
- **WS02-T003** will move writes to validated server actions; T002 keeps this path.

### 6. RLS coverage for profile updates

`profiles_update` / `profiles_delete`: owner only. Column-agnostic — new columns inherit the same policy. No gap identified for `location` / `skills`.

### 7. TypeScript alignment

`packages/types` `Profile` interface matches DB **except** missing `location` and `skills`. App uses `select('*')` in places; new columns will flow once types are updated in T002.

### 8. Old profile rows and defaults

Safe: `location` NULL; `skills` default `'{}'` (empty array). Signup `INSERT` omits new columns — defaults apply.

### 9. Public profile visual positions

- **Location:** `public-profile-focused.tsx` line under company/role when `location` prop is set.
- **Skills:** No public UI today — persist in T002; public rendering deferred.

### 10. Migration number conflict

Latest migration: `20250627000006_project_case_study_sections.sql`.  
`20250627000005` is `handle_new_user_slug.sql` — **do not reuse**.  
Next valid timestamp for T002: **`20250627000007`**.

---

## MVP field audit

Legend: **Status** = `works` | `partial` | `demo-only` | `missing` | `n/a`

### Identity & copy

| MVP field | DB column | Type | Nullable | Validation (app) | Dashboard editor | Public profile | RLS | Status | Gap |
|-----------|-----------|------|----------|------------------|------------------|----------------|-----|--------|-----|
| Display name | `display_name` | `text` | NOT NULL | 1–80 chars | `ProfileEditor`, sign-up | Yes | Owner write | **works** | — |
| Headline | `headline` | `text` | NULL | max 120 | `ProfileEditor` | Yes (`parseHeadline`) | Owner write | **works** | Company is headline fiction in dashboard |
| Bio | `bio` | `text` | NULL | max 2000 | `ProfileEditor` | Yes | Owner write | **works** | — |
| Avatar | `avatar_url` | `text` | NULL | not in schema | placeholder only | Yes if set | Owner write | **partial** | WS02-T006 |
| Slug | `slug` | `text` | NOT NULL | `slugSchema` | `ProfileEditor`, sign-up | `/{slug}` | Unique per tenant | **works** | — |
| Public/private | `is_public` | `boolean` | NOT NULL default false | boolean | `ProfileEditor` | filtered | Owner write | **works** | — |
| Location | — | — | — | none | local state only | prop-only | n/a | **demo-only** | **T002 adds column** |
| Skills | — | — | — | none | none | none | n/a | **missing** | **T002 adds column** |

### Links, meta, tenancy

| MVP field | Status | Notes |
|-----------|--------|-------|
| Social/profile links | **partial** | `profile_links` + RLS; no CRUD UI (WS02-T005) |
| Profile completion | **partial** | `linkCount` omitted on dashboard home |
| Timestamps | **works** | `created_at`, `updated_at` trigger |
| Owner / tenant | **works** | `owner_user_id`, `tenant_id`, provisioning trigger |

---

## Signup provisioning

`handle_new_user()` (`20250627000005`) creates tenant, membership, profile with `headline = NULL`, `is_public = false`. New columns in T002 use DB defaults — trigger unchanged.

Tests: `supabase/tests/database/010_ws01_t001_signup_provisioning.test.sql`, `020_ws01_t002_signup_slug.test.sql`.

---

## Duplicated sources of truth (pre-T002)

1. **Location** — DB (missing) vs dashboard `useState` vs `DEMO_PROFILE.location`.
2. **Skills** — nowhere persisted.
3. **Company** — `headline` parsing vs dashboard local state (out of scope for T002).
4. **Profile links** — DB canonical for auth users; demo constants for preview.

---

## RLS summary

- `profiles_public_select`: public OR owner OR tenant member.
- `profiles_update` / `delete`: owner only.
- New scalar columns: covered by existing row-level policies.

---

## Approved implementation decision

- **`location`:** optional persisted profile field (`text`, NULL default, max 120 chars after trim).
- **`skills`:** optional persisted profile field (`text[]`, default `'{}'`, max 30 items, 1–50 chars each after trim, case-insensitive dedupe on save).
- **Existing local/demo-only copies** must be replaced with database-backed values in WS02-T002.
- **T002** implements the smallest safe version: one forward migration, shared Zod validation, `ProfileEditor` + existing client update path.
- **Profile saves** remain on the current browser Supabase update path until **WS02-T003** moves them to validated server actions.
- **Public skills rendering** is deferred; **public location** wires to DB where `public-profile-focused` already displays it.
- **Profile completion percentage** is unchanged in T002 (WS02-T008).

---

*WS02-T001 complete. No migrations or application code modified in this task.*

# WS03-T001 — Project Schema Audit

**Date:** 2026-07-13  
**Scope:** Analysis and documentation only. No schema, UI, or application behavior changes in this task.  
**Sources inspected:** `supabase/migrations/20250627000001_initial_schema.sql` through `20250627000008_storage_buckets_rls.sql`, `20250627000006_project_case_study_sections.sql`, `20250627000002_rls_policies.sql`, `20250627000003_force_rls.sql`, `packages/validation/src/index.ts`, `packages/types/src/index.ts`, `packages/config/src/index.ts`, `apps/web/src/lib/projects/featured.ts`, `apps/web/src/lib/dashboard/portfolio.ts`, `apps/web/src/lib/projects/demo-data.ts`, `apps/web/src/lib/projects/create-project-action.ts`, `apps/web/src/app/dashboard/(authenticated)/projects/page.tsx`, `apps/web/src/app/[slug]/page.tsx`, `apps/web/src/app/[slug]/projects/[id]/page.tsx`, `apps/web/src/components/dashboard/dashboard-projects-portfolio.tsx`, `apps/web/src/components/featured-work/project-detail-view.tsx`, `apps/web/src/components/profile/public-project-stack.tsx`, `supabase/seed.sql`.

---

## Executive summary

The database models core project identity and content (`title`, `tagline`, `description`, `technologies`, `is_published`, `sort_order`, `case_study_sections`, tenant/profile/owner linkage) plus normalized child tables for domains, focus areas, media, and links. Dashboard and public UIs read persisted project rows through Supabase; demo routes additionally use local `FeaturedProject` fixtures.

**Confirmed gaps before WS03-T002:**

| Field | Status |
|-------|--------|
| `slug` | **Missing** — public routes use project UUID, not slug |
| `user_role` | **Missing** — no DB column; not in demo fixtures |
| `started_at` / `ended_at` | **Missing** — no DB columns; not in UI |
| `status` (lifecycle) | **Missing** — UI uses `is_published` only for Published/Draft badges |

**Route architecture:** Public project detail is `/{profileSlug}/projects/{projectId}` (UUID). Per-profile project slug uniqueness is correct for future slug-based URLs without requiring global uniqueness.

---

## Explicit findings

### 1. Does project `slug` currently exist?

**No column.** Public navigation uses `project.id` (UUID):

| Location | Identifier |
|----------|------------|
| `apps/web/src/app/[slug]/projects/[id]/page.tsx` | `row.id === id` param |
| `project-detail-view.tsx` prev/next links | `projects/${previousProject.id}` |
| `portfolio.ts` dashboard href | `/dashboard/projects/${project.id}` |
| `public-project-stack.tsx` | Links via project `id` |

Research papers already use per-profile `slug`; projects do not.

### 2. Should project slug be unique globally or per profile?

**Per profile (`UNIQUE (profile_id, slug)`).** Public URLs are namespaced by profile slug today and will remain ID-based until a dedicated route migration. Two profiles may reuse the same project slug (e.g. both have `devflow`).

### 3. Do `user_role`, dates, or lifecycle `status` exist outside demo/local state?

| Field | Persisted? | UI/demo? |
|-------|------------|----------|
| `user_role` | No | No — not in `FeaturedProject`, `PortfolioProject`, or demo data |
| `started_at` / `ended_at` | No | No — `startedAt` in `project-detail-view.tsx` is analytics timing only |
| `status` (lifecycle) | No | No — chips show **Published/Draft/Live** from `is_published` only |

### 4. Current status labels in the repository

Lifecycle status enum does **not** exist. Visibility labels derived from `is_published`:

| Label | Source |
|-------|--------|
| `Published` | `dashboard-project-manage-card.tsx`, `projects-vertical-stack.tsx`, etc. |
| `Draft` | Same components when `is_published === false` |
| `Live` | `projects-bubble-grid.tsx` |
| `Published · featured` | `project-cards.ts` subtitle |
| `Featured project` / `Featured hero` | Marketing/detail copy, not lifecycle |

`is_published` controls **visibility**; it must remain separate from lifecycle `status`.

### 5. Ownership chain

```
auth.users (owner_user_id)
    └── tenants (tenant_id)
    └── profiles (profile_id)
            └── projects
                    ├── project_domains
                    ├── project_focus_areas
                    ├── project_media_assets
                    ├── project_links
                    └── project_orderings (table exists; app uses projects.sort_order)
```

Provisioning: projects are inserted with `tenant_id`, `profile_id`, and `owner_user_id` from the authenticated owner's profile (`create-project-action.ts`).

### 6. RLS coverage

| Table | SELECT | Owner write |
|-------|--------|-------------|
| `projects` | Published on public profile OR owner | `owner_user_id = auth.uid()` |
| Child tables | Follow parent project visibility | Owner via project ownership |
| `project_orderings` | Owner only (no public SELECT policy) | Owner via profile ownership |

New columns on `projects` inherit `projects_public_select` and `projects_owner_all` — **no RLS gap** for T002.

### 7. Unpublished filtering

Public profile (`[slug]/page.tsx`) and project detail load only `is_published = true` projects on public routes. Dashboard loads all projects for the owner. **Unchanged by T002.**

### 8. Project ordering

- **Persisted:** `projects.sort_order` (integer, default 0) — used in all queries.
- **`project_orderings` table:** exists with `UNIQUE (profile_id, project_id)` but **not referenced** in application code yet.

### 9. Media and cover images

- **Persisted:** `project_media_assets` with `storage_path`, `type` (`poster`, `hero_video`, `screenshot`, etc.).
- **Mapped in app:** `normalizeFeaturedProject()` reads `poster` → `posterUrl`, `screenshot` → `screenshots`.
- **Demo:** Unsplash URLs and inline SVG data URLs in `demo-data.ts` (not storage paths).
- **Storage:** `project-media` bucket (WS04-T001); upload not wired in project UI yet.

### 10. TypeScript / database alignment gaps

| Column | In DB | In `packages/types` `Project` |
|--------|-------|-------------------------------|
| `case_study_sections` | Yes (migration 006) | **Missing** |
| `slug` | No | No |
| `user_role` | No | No |
| `started_at` / `ended_at` | No | No |
| `status` | No | No |

Generated Supabase types are **not** checked into the repository; `packages/types` is the hand-maintained source of truth.

### 11. Existing project rows and seed data

- `supabase/seed.sql` contains commented example `INSERT` for one project (`DevFlow`) without slug.
- No production seed in repo; migration must backfill safely for any existing rows using deterministic title-based slugs with per-profile collision suffixes.
- `title` is `NOT NULL` — safe slug source. Fallback: `project-{stable_id_fragment}` when title slugifies to fewer than 3 characters.

### 12. Migration timestamp

Latest migration: `20250627000008_storage_buckets_rls.sql`.  
**Next valid timestamp for T002: `20250627000009`.**

### 13. `(profile_id, slug)` vs route architecture

**Consistent.** Public routes use profile slug + project UUID. Adding per-profile project slug does not conflict with current routing. Slug-based public URLs are deferred to a future task.

---

## Table inventory

### `projects`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `tenant_id` | uuid | NOT NULL | — | FK → tenants |
| `profile_id` | uuid | NOT NULL | — | FK → profiles |
| `owner_user_id` | uuid | NOT NULL | — | FK → auth.users |
| `title` | text | NOT NULL | — | max 120 in validation |
| `tagline` | text | NULL | — | maps to summary; max 160 |
| `description` | text | NULL | — | full description; max 10000 |
| `technologies` | text[] | NOT NULL | `'{}'` | max 20 items |
| `is_published` | boolean | NOT NULL | `false` | visibility |
| `sort_order` | int | NOT NULL | `0` | display order |
| `case_study_sections` | jsonb | NOT NULL | `'{}'` | optional showcase text/media |
| `created_at` / `updated_at` | timestamptz | NOT NULL | `now()` | auto-updated |

**Indexes:** `idx_projects_profile_published (profile_id, is_published, sort_order)`, `idx_projects_owner (owner_user_id)`.

### `project_links`

| Column | Type | Notes |
|--------|------|-------|
| `type` | `project_link_type` enum | live, repo, demo, paper, other |
| `label`, `url` | text | url required |
| `sort_order` | int | default 0 |

### `project_domains` / `project_focus_areas`

Normalized name tags per project. App maps to `domains[]` / `focusAreas[]` in `FeaturedProject`.

### `project_media_assets`

Storage-backed media with `storage_path` (public URLs or paths depending on upload wiring).

### `project_orderings`

Per-profile ordering join table; unused in app queries (reserved for future ordering UI).

---

## MVP field audit

Legend: **Status** = `works` | `partial` | `demo-only` | `missing`

### Core identity

| MVP field | DB | App type | Dashboard | Public profile | Project detail | Validation | Status | Gap |
|-----------|-----|----------|-----------|----------------|----------------|------------|--------|-----|
| `id` | uuid PK | string | Yes | Yes (routing) | Yes | uuid in reorder | **works** | — |
| `tenant_id` | uuid | string | implicit | — | — | — | **works** | — |
| `profile_id` | uuid | string | filter | filter | filter | — | **works** | — |
| `owner_user_id` | uuid | string | implicit | — | — | — | **works** | RLS |
| `title` | text | string | Yes | Yes | Yes | max 120 | **works** | — |
| `slug` | — | — | — | — | — | — | **missing** | **T002** |

### Content

| MVP field | DB column | Mapping | Status | Gap |
|-----------|-----------|---------|--------|-----|
| Tagline / summary | `tagline` | `FeaturedProject.tagline` | **works** | — |
| Description | `description` | `FeaturedProject.description` | **works** | — |
| Technologies | `technologies` | array | **works** | — |
| Domains | `project_domains.name` | `domains[]` | **works** | — |
| Focus areas | `project_focus_areas.name` | `focusAreas[]` | **works** | — |
| User role | — | — | **missing** | **T002** |
| Case study sections | `case_study_sections` | parsed jsonb | **partial** | type missing in `Project` |

### Lifecycle

| MVP field | DB | Dashboard | Public | Status | Gap |
|-----------|-----|-----------|--------|--------|-----|
| `is_published` | boolean | badges | filtered | **works** | visibility only |
| `status` | — | — | — | **missing** | **T002** (lifecycle) |
| `started_at` | — | — | — | **missing** | **T002** |
| `ended_at` | — | — | — | **missing** | **T002** |
| `sort_order` | int | ordered list | ordered | **works** | — |
| Timestamps | timestamptz | `updated_at` chips | — | **works** | — |

### Presentation

| Area | Status | Notes |
|------|--------|-------|
| Cover / poster | **partial** | DB media assets; demo uses fake URLs |
| Screenshots | **partial** | `project_media_assets` type `screenshot` |
| Project links | **partial** | DB + read; no links CRUD UI |
| Public routing | **works** | UUID-based `/{profileSlug}/projects/{id}` |
| Prev/next navigation | **works** | By ID within published set |
| Create form | **partial** | `create-project-action.ts` exists; out of T002 scope |
| Edit route | **missing** | No `/dashboard/projects/[id]/edit` route |

---

## Confirmed field mapping

| MVP / UI concept | Database source |
|------------------|-----------------|
| Title | `projects.title` |
| Tagline | `projects.tagline` |
| Summary | `projects.tagline` |
| Full description | `projects.description` |
| Technologies | `projects.technologies` |
| Domains | `project_domains.name` |
| Focus areas | `project_focus_areas.name` |
| Visibility | `projects.is_published` |
| Display order | `projects.sort_order` (not `project_orderings` yet) |
| Cover image | `project_media_assets` where `type = 'poster'` |
| Screenshots | `project_media_assets` where `type = 'screenshot'` |
| Project links | `project_links` |

---

## T002 implementation decision

### Columns to add

| Column | Type | Nullable | Default | Length / format |
|--------|------|----------|---------|-----------------|
| `slug` | `text` | NOT NULL after backfill | — | Same rules as profile slug: `^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$`, max 63 |
| `user_role` | `text` | NULL | — | max 120; Unicode allowed; trim in app validation |
| `started_at` | `date` | NULL | — | ISO date `YYYY-MM-DD` |
| `ended_at` | `date` | NULL | — | ISO date `YYYY-MM-DD` |
| `status` | `text` | NULL | — | max 40; **no DB enum check** (lifecycle values not confirmed in UI) |

### Uniqueness

- `CONSTRAINT projects_profile_slug_unique UNIQUE (profile_id, slug)`
- Unique index covers lookup needs; no redundant index.

### Constraints

- `projects_slug_format_chk` — same character class as profile slugs
- `projects_user_role_length_chk` — `char_length <= 120`
- `projects_status_length_chk` — `char_length <= 40` when not null
- `projects_date_range_chk` — `ended_at >= started_at` when both present

### Status strategy

- **Defer enum/check constraint** until WS03 CRUD defines allowed lifecycle values.
- Document provisional values for future CRUD: `draft`, `active`, `completed`, `on_hold` (not enforced in T002).
- `is_published` remains the visibility switch.

### Slug backfill strategy

1. Add `slug` column nullable.
2. Backfill deterministically:
   - Normalize title: lowercase, non-alphanumeric → hyphen, trim hyphens, truncate to 63.
   - If result length < 3: use `project-{first 8 hex of id}`.
   - Collision within profile: append `-2`, `-3`, … (stable by `created_at`, `id` order).
3. Verify no null slugs.
4. Set `NOT NULL`.
5. Add unique constraint and format check.

### Insert compatibility

Existing `create-project-action.ts` does not supply `slug`. Add a **BEFORE INSERT** trigger on `projects` that generates a slug from `title` when `slug` is null, using the same normalization/collision rules within the profile. This preserves the current create path without implementing CRUD in T002.

### Type updates (`packages/types`)

Add to `Project`: `slug`, `user_role`, `started_at`, `ended_at`, `status`, and `case_study_sections` (existing DB column).

### Validation updates (`packages/validation`)

Add:

- `projectSlugSchema` / `normalizeProjectSlug()` — reuse `SLUG_REGEX` and 3–63 length
- `projectUserRoleSchema` — trim, max 120, nullable
- `projectDateSchema` — `YYYY-MM-DD` optional nullable
- `validateProjectDateRange()` — reject `ended_at < started_at`
- `PROJECT_STATUS_MAX_LENGTH` constant; **no** `createProjectSchema` changes yet

### Migration test strategy

- pgTAP: `supabase/tests/database/050_ws03_t002_project_fields.test.sql`
- Vitest migration contract: `apps/web/src/lib/projects/project-schema-migration-contract.test.ts`
- Vitest slug/date validation: `packages/validation/src/project-fields.test.ts`

### Old-row compatibility

- All new fields nullable except `slug` (after backfill).
- No invented `user_role`, dates, or `status` for existing rows.
- Existing queries unchanged; `select('*')` will include new columns automatically.

---

## Stop conditions checked

| Check | Result |
|-------|--------|
| `(profile_id, slug)` matches route architecture | **Pass** — proceed to T002 |
| Unsafe existing data blocking backfill | **None found** in repo |

---

## Remaining WS03 work (out of scope)

- WS03-T003+ — project CRUD, publishing, links, ordering, media, limits, save/retry UX
- Public route migration from UUID to slug (separate task)
- WS02-T008 profile completion (deferred)

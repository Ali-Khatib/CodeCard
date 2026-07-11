# WS02-T001 — Profile Schema Audit

**Date:** 2026-07-11  
**Scope:** Analysis and documentation only. No schema, UI, or application behavior changes.  
**Sources inspected:** `supabase/migrations/20250627000001_initial_schema.sql`, `20250627000002_rls_policies.sql`, `20250627000005_handle_new_user_slug.sql`, `packages/validation/src/index.ts`, `packages/types/src/index.ts`, dashboard and public profile routes, `ProfileEditor`, `profile-completion.ts`, signup provisioning tests.

---

## Executive summary

The database already models most core MVP profile identity fields (`display_name`, `headline`, `bio`, `avatar_url`, `slug`, `is_public`, timestamps, ownership, tenant linkage). Social and contact links are modeled in `profile_links` with a typed enum and RLS, but there is **no dashboard CRUD UI** for links yet.

**Gaps vs. current product UI:**

| Area | Status |
|------|--------|
| `location` | Shown in demo/dashboard local state only — **no DB column** |
| `skills` | Not in DB or authenticated UI — marketing copy only |
| `company` | Not a DB field; parsed from `headline` on public pages; dashboard uses hardcoded local state |
| Avatar upload | Column exists; **no persistence path** in `ProfileEditor` |
| Profile links | DB + public read work; **no editor** |
| Profile completion | Logic exists; dashboard omits `linkCount` argument |
| Dedicated `/dashboard/profile` | Redirects to `/dashboard`; editing lives on home overview |

**Recommendation:** Keep `location` and `skills` **out of MVP** unless product explicitly adds them in WS02-T002+. Fold company into `headline` (current public parsing) or add a column later — do not ship dashboard-local `company`/`location` inputs without persistence (WS02-T003+). Prioritize avatar upload (WS02-T006) and profile-link CRUD (WS02-T005) over new scalar fields.

---

## MVP field audit

Legend: **Status** = `works` | `partial` | `demo-only` | `missing` | `n/a`

### Identity & copy

| MVP field | Requirement | DB column | Type | Nullable | Validation | UI support | Public profile | RLS / ownership | Status | Gap | Recommendation |
|-----------|-------------|-----------|------|----------|------------|------------|----------------|-----------------|--------|-----|----------------|
| Display name | Required public identity | `profiles.display_name` | `text` | NOT NULL | `createProfileSchema`: 1–80 chars, trim | Sign-up, `ProfileEditor`, dashboard overview | Rendered in `PublicProfileFocused` | Owner update; public read when `is_public` | **works** | None | Keep as-is |
| Headline | Short role/tagline | `profiles.headline` | `text` | NULL | Max 120 chars, optional | `ProfileEditor`, sign-up metadata → provisioning | Shown; `parseHeadline()` splits role/company | Same as profile row | **partial** | Company is UI fiction in dashboard; not a separate field | Document headline format (`Role · Company`) or add `company` column in WS02-T002 if needed |
| Bio | Longer intro | `profiles.bio` | `text` | NULL | Max 2000 chars | `ProfileEditor` | Rendered with fallback copy if null | Same | **works** | Label says "shown later" — bio is live on public page | Update copy only (WS02 UI pass) |
| Avatar | Profile photo | `profiles.avatar_url` | `text` | NULL | **Not** in `updateProfileSchema` | Display + placeholder "Change photo" (no upload) | Rendered when set | Same; storage buckets noted in RLS migration comments | **partial** | No upload/update path; no Zod field | Implement in WS02-T006 (storage + schema validation) |
| Public slug | URL segment `/{slug}` | `profiles.slug` | `text` | NOT NULL | `slugSchema`: 3–63, lowercase alphanumeric + hyphens | Sign-up, `ProfileEditor` | Route `[slug]/page.tsx` | Unique per `(tenant_id, slug)`; owner manages | **partial** | Public lookup is `slug` only (no tenant filter) — cross-tenant slug collision risk in multi-tenant future | Acceptable for single-profile-per-user MVP; add global slug index/constraint if multi-profile tenants ship |
| Public / private | Control visibility | `profiles.is_public` | `boolean` | NOT NULL, default `false` | Boolean in create/update schemas | `ProfileEditor` checkbox | Query filters `.eq('is_public', true)` | Public SELECT when `is_public`; owner always reads own | **works** | Default private on signup | Keep default `false` |
| Location | Optional geography | — | — | — | None | Demo (`DEMO_PROFILE.location`), dashboard local state (`useState('San Francisco')`), optional `location` prop on public components | Rendered only when prop passed — **not from DB** | n/a | **demo-only** | No column; dashboard edits are ephemeral | **Remove from MVP UI** or defer to post-MVP column (WS02-T002 decision) |
| Skills | Skill tags | — | — | — | None | Not in authenticated UI | Not on public profile | n/a | **missing** | Referenced only in research/marketing copy | **Remove from MVP scope**; use project `technologies` and headline instead |

### Links & contact

| MVP field | Requirement | DB column | Type | Nullable | Validation | UI support | Public profile | RLS / ownership | Status | Gap | Recommendation |
|-----------|-------------|-----------|------|----------|------------|------------|----------------|-----------------|--------|-----|----------------|
| Social links | GitHub, LinkedIn, X, etc. | `profile_links` rows | `type profile_link_type`, `url text`, `label text`, `sort_order int` | `url` NOT NULL; `label` NULL | `profileLinkSchema` per row | Read on dashboard home & projects; **no add/edit/delete UI** | Loaded, sorted; icons via `resolveProfileLinkIcon` | Owner ALL; public SELECT when profile public or owner | **partial** | No CRUD; seed/demo data only for previews | WS02-T005 link editor |
| Contact links | Email, website, resume | Same table; types `email`, `website`, `resume` | enum | — | `urlSchema` (http/https) | Same as social | Same | Same | **partial** | `email` type stores URL string, not mailbox validation | WS02-T005; consider `mailto:` handling in validation |

**Supported `profile_link_type` values:** `website`, `github`, `linkedin`, `twitter`, `resume`, `email`, `other`.

### Meta & tenancy

| MVP field | Requirement | DB column | Type | Nullable | Validation | UI support | Public profile | RLS / ownership | Status | Gap | Recommendation |
|-----------|-------------|-----------|------|----------|------------|------------|----------------|-----------------|--------|-----|----------------|
| Profile completion | % readiness | *computed* | — | — | `profileCompletion()` in `profile-completion.ts` | Dashboard overview & profile views | Not shown publicly | n/a | **partial** | Dashboard calls `profileCompletion(profile, projectCount)` **without `linkCount`** even though links are loaded | Pass `links.length` in WS02-T004 |
| Created at | Audit | `profiles.created_at` | `timestamptz` | NOT NULL | DB default | Not surfaced in UI | Not shown | Owner read | **works** | — | Optional admin/display later |
| Updated at | Audit | `profiles.updated_at` | `timestamptz` | NOT NULL | Trigger `update_updated_at()` | Not surfaced | Not shown | Owner read | **works** | — | Same |
| Ownership | Row owner | `profiles.owner_user_id` | `uuid` FK → `auth.users` | NOT NULL | Insert CHECK `owner_user_id = auth.uid()` | Implicit via session | n/a | `profiles_update` / `delete` USING `owner_user_id = auth.uid()` | **works** | — | Keep |
| Tenant relationship | Multi-tenant isolation | `profiles.tenant_id` | `uuid` FK → `tenants` | NOT NULL | Provisioning sets tenant from `handle_new_user()` | Not shown | Not shown | SELECT via `user_tenant_ids()` or public flag | **works** | One profile per signup today | Document 1:1 user→tenant→profile for MVP |

---

## Signup provisioning

`handle_new_user()` (migration `20250627000005`) on `auth.users` INSERT:

1. Creates `tenants` row (name from `display_name` metadata or email local-part).
2. Creates `tenant_memberships` with role `owner`.
3. Inserts `profiles` with normalized `slug`, `display_name`, `headline = NULL`, `is_public = false`.

Sign-up form supplies `display_name` and `slug` via `raw_user_meta_data` (validated by `signUpSchema`). **Avatar, bio, links, location, skills are not provisioned** — expected.

Database tests: `supabase/tests/database/010_ws01_t001_signup_provisioning.test.sql`, `020_ws01_t002_signup_slug.test.sql`.

---

## UI vs database map

| Surface | Persists to DB | Notes |
|---------|----------------|-------|
| `ProfileEditor` | `display_name`, `headline`, `slug`, `bio`, `is_public` | Uses `updateProfileSchema`; no `avatar_url` |
| `DashboardOverviewView` inline edit | Same via embedded `ProfileEditor` | `company` / `location` are `useState` defaults only |
| `DashboardProfileView` | Same | `/dashboard/profile` redirects to `/dashboard` |
| `PublicProfileExperience` | Read-only | No `location` from server unless passed (demo pages pass it) |
| Demo routes (`/demo/*`, `dashboard/preview/*`) | None | `DEMO_PROFILE` includes `location`, `followers`, inline `links` |

---

## Duplicated or conflicting sources of truth

1. **Company / location** — Dashboard inputs vs `headline` parsing vs demo constants. Only `headline` and demo props are reflected on public pages for real users.
2. **Profile links** — DB is canonical for authenticated users; demo uses `DEMO_PROFILE.links` / `DEMO_PROFILE_LINKS` in preview routes.
3. **Avatar** — `avatar_url` column vs non-functional "Change photo" buttons (overview and profile views).
4. **Stats on dashboard home** — Mix of real counts (`profileViews`, `projectViews`) and hardcoded fallbacks (`saves: 47`, `qrScans: 128`, activity feed from `DEMO_OVERVIEW_ACTIVITY`).

---

## RLS and privacy summary

**`profiles`**

- `profiles_public_select`: `is_public = true` OR `owner_user_id = auth.uid()` OR tenant member.
- `profiles_insert`: owner + tenant membership.
- `profiles_update` / `delete`: owner only.

**`profile_links`**

- `profile_links_public_select`: parent profile public OR owner.
- `profile_links_owner_all`: owner full CRUD on own profile's links.

**Implications**

- Private profiles are hidden from anonymous public route (404 via `is_public` filter).
- Owners can read/write links even when profile is private.
- No RLS gap identified for MVP single-owner profiles.
- Email-type links expose URL on public profiles — ensure users understand visibility when WS02-T005 ships.

---

## Indexes and constraints (current & eventual)

| Object | Purpose |
|--------|---------|
| `UNIQUE (tenant_id, slug)` | Slug uniqueness within tenant |
| `idx_profiles_tenant_slug` | Tenant-scoped slug lookup |
| `idx_profiles_public` | Partial index on public profiles |
| `idx_profiles_owner` | Owner dashboard queries |
| `idx_profile_links_profile` | Ordered links per profile |

**May be required later (not in scope for T001):**

- Global unique `slug` if public URLs remain tenant-agnostic.
- Check constraint or trigger syncing `profile_links.tenant_id` with parent profile.
- Limit on link count per profile (application-level today).

---

## Fields to remove vs implement

| Field | Verdict |
|-------|---------|
| `location` | **Remove from MVP UI** unless WS02-T002 adds a column — current inputs mislead users |
| `skills` | **Do not add** for MVP — use projects/headline |
| `company` (dashboard local) | **Remove or merge into headline** — do not add column without product sign-off |
| `followers` | Demo-only (`DEMO_PROFILE.followers`) — **not MVP** |
| Avatar upload | **Implement** (column exists) — WS02-T006 |
| Profile links CRUD | **Implement** — WS02-T005 |

---

## Implementation status checklist

| Capability | Status |
|------------|--------|
| DB core profile columns | Done |
| Sign-up provisioning | Done |
| Zod create/update validation | Done (except avatar) |
| Profile editor (text fields + visibility) | Done |
| Public profile page | Done |
| Profile links read path | Done |
| Profile links write UI | Not started |
| Avatar upload | Not started |
| Location / skills | Demo or missing |
| Profile completion accuracy | Partial (link count omitted) |
| Dedicated profile settings route | Redirect only |

---

## Security & privacy notes

- Slug in public URL is enumerable; `is_public` gate is the primary privacy control.
- `profile_links` with type `email` still require a URL — users may paste `mailto:` or web contact URLs; validate UX copy in WS02-T005.
- Service-role bypass is not used for profile reads in app routes; anon/authenticated clients respect RLS.
- Avatar storage buckets (`avatars`) are documented in RLS migration comments but upload policies are not verified in this audit.

---

## Next tasks (out of scope for WS02-T001)

- **WS02-T002** — Schema decisions for deferred fields (if any).
- **WS02-T003** — Profile settings route and navigation.
- **WS02-T004** — Profile completion fixes.
- **WS02-T005** — Profile links CRUD.
- **WS02-T006** — Avatar upload and `avatar_url` validation.

---

*This document satisfies WS02-T001. No migrations or application code were modified.*

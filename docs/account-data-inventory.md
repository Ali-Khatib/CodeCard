# CodeCard account data inventory (WS10-T001)

**Status:** Technical implementation map — legal review pending.  
**Source:** Current repository schema (`supabase/migrations/*`) and application code as of review.  
**Review date:** 2026-07-17  
**Legal review:** Pending. This document has **not** been attorney-approved.  
**Technical owner:** CodeCard MVP engineering (WS10).  
**Dependencies:** WS10-T002/T003 (export), WS04-T010 (storage cleanup), WS10-T004+ (deletion orchestration).

Do not treat this document as a completed compliance or legal review.

**WS10-T004 note:** `POST /api/account/delete` exists with confirmation + recent reauthentication + capability gate. Production deletion remains **fail closed** (`ACCOUNT_DELETION_NOT_READY`) until WS10-T005–T008 register real capabilities. Lock table migration: `20260717000001_account_deletion_operations.sql` (local only; not remotely applied).

---

## 1. Purpose

Map every account-associated data category and define how it behaves for:

| Concern | Meaning in this map |
|---|---|
| **Export** | Included in structured JSON account export (`POST /api/account/export`) |
| **Deletion** | Intended later behavior for account deletion (not implemented in WS10-T001–T003) |
| **Anonymization** | Intended later behavior where deletion is inappropriate |
| **Retention** | Why rows may be kept temporarily or permanently |

---

## 2. Ownership model (authoritative)

| Concept | Authoritative key | Notes |
|---|---|---|
| Authenticated account | `auth.users.id` | Resolved only from server session — never from client body |
| Profile | `profiles.owner_user_id` → `auth.users.id` | One profile per signup path today |
| Tenant | `profiles.tenant_id` / `tenant_memberships.user_id` | Personal tenant created at signup |
| Projects / research | `owner_user_id` **and** `profile_id` | Dual ownership; queries must filter both when applicable |
| Child rows | Parent FK (`project_id`, `research_paper_id`, `profile_id`, `collection_id`) | Cascade with parent; never trust client-supplied parent IDs for export scope |

**Rule:** Export and future deletion always derive owner from `supabase.auth.getUser()` (authenticated server client). Do not use the service-role client to bypass RLS for export.

---

## 3. Table-by-table map

### 3.1 Account and tenancy

| Table | Purpose | Owner key | Path to `auth.users` | Other-person data? | Export | Deletion (later) | Anonymize | Retention | Storage | RLS | Cascade | Task |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `auth.users` | Auth identity | `id` | self | No | Safe metadata only (email, created_at, providers) | Delete **last** after dependents (WS10-T005) | N/A | Auth provider | None | Supabase Auth | — | WS10-T005 |
| `tenants` | Personal workspace | via membership | `tenant_memberships.user_id` | Possibly shared later | Do not export tenant internals beyond profile linkage | Delete with memberships when account deleted | — | Operational | None | Enabled | Memberships CASCADE | WS10-T004 |
| `tenant_memberships` | User↔tenant | `user_id` | direct | No | Metadata/reference only if needed | Delete | — | Operational | None | Enabled | CASCADE from tenant/user | WS10-T004 |
| `profiles` | Public/owner card | `owner_user_id` | direct | No | **Export in full** (allowlisted fields) | Delete | — | User content | Avatar object | Owner RLS | CASCADE from user | WS10-T004 |

### 3.2 Profile children

| Table | Purpose | Owner key | Path | Other-person? | Export | Deletion | Anonymize | Storage | Task |
|---|---|---|---|---|---|---|---|---|---|
| `profile_links` | Social/contact links | via `profile_id` → profile owner | `profiles.owner_user_id` | No | **Export in full** | Delete with profile | — | None | WS10-T004 |
| Profile avatar | Photo object | path segment `owner_user_id` | storage path | No | **Metadata / public URL only** | Delete objects via WS04-T010 | — | `avatars` bucket | WS04-T010 + WS10-T004 |

Profile columns (current): `id`, `tenant_id`, `owner_user_id`, `slug`, `display_name`, `headline`, `avatar_url`, `bio`, `is_public`, `location`, `skills`, `created_at`, `updated_at`.  
No cover-image column is implemented.

### 3.3 Projects

| Table | Purpose | Owner key | Other-person? | Export | Deletion | Storage | Task |
|---|---|---|---|---|---|---|---|
| `projects` | Project records | `owner_user_id` + `profile_id` | No | **Export in full** (allowlist) | Delete | Media via children | WS10-T004 |
| `project_domains` | Domain tags | via `project_id` | No | **Export in full** | Cascade delete | None | WS10-T004 |
| `project_focus_areas` | Focus tags | via `project_id` | No | **Export in full** | Cascade delete | None | WS10-T004 |
| `project_links` | Project URLs | via `project_id` | No | **Export in full** | Cascade delete | None | WS10-T004 |
| `project_media_assets` | Poster/screenshot/video/doc refs | via `project_id` | No | **Metadata only** (no signed URLs; no raw path secrets) | Cascade DB + storage cleanup WS04-T010 | `project-media` | WS04-T010 + WS10-T004 |
| `project_orderings` | Sort positions | via `profile_id`/`project_id` | No | **Export in full** | Cascade delete | None | WS10-T004 |

Project columns include foundation fields: `slug`, `user_role`, `started_at`, `ended_at`, `status`, `case_study_sections`, plus core title/description/technologies/`is_published`/`sort_order`.

### 3.4 Research

| Table | Purpose | Owner key | Other-person? | Export | Deletion | Storage | Task |
|---|---|---|---|---|---|---|---|
| `research_papers` | Papers | `owner_user_id` + `profile_id` | Related project is owner’s only | **Export in full** (allowlist); `pdf_url` as stored external URL | Delete | External PDF only (no hosted PDF upload) | WS10-T004 |
| `research_figures` | Figures | via `research_paper_id` | No | **Metadata + captions**; storage metadata only | Cascade + cleanup WS04-T010 | `project-media` as `research-figure` | WS04-T010 + WS10-T004 |

### 3.5 Private organizational data

| Table | Purpose | Owner key | Other-person? | Export | Deletion | Task |
|---|---|---|---|---|---|---|
| `saved_connections` | Saved profiles | `owner_user_id` | References another profile id | **Safe/redacted**: owner’s connection row only; **not** the other profile’s private fields/email | Delete | WS10-T004 |
| `connection_notes` | Private notes | `owner_user_id` | May mention others in free text | **Export in full** (user-authored) | Delete | WS10-T004 |
| `collections` | Private collections | `owner_user_id` | No | **Export in full** | Delete | WS10-T004 |
| `collection_items` | Collection membership | via `collection_id` | May reference others’ public items | **Export metadata** of item refs owned via collection | Cascade delete | WS10-T004 |
| `circle_activity` | Actor-owned Circle events | via `actor_profile_id` → owner | References public work of the actor; viewers never export others’ views | **Export actor-owned events only** (allowlisted fields; no private notes) | Cascade with profile/content; explicit delete for owner | WS16-T002 |
| `circle_viewer_state` | Private Circle last-seen | `viewer_user_id` | No (never actor-visible) | **Export last_seen_at only** for requesting owner | Delete | WS16-T006 |

### 3.6 Analytics

| Table | Purpose | Owner key | Other-person / visitor? | Export | Deletion / anonymize | Retention | Task |
|---|---|---|---|---|---|---|---|
| `analytics_events` | Primary raw events | `profile_id` → owner | Visitor signals; session_id | **Aggregate only** via WS08 helpers | Anonymize/delete (WS10-T007); also subject to 90-day raw retention | ≤90 days raw | WS08-T012 / WS10-T007 |
| `public_profile_events` | Legacy/parallel profile visits | `profile_id` | Visitor | **Not raw-exported**; sources used inside aggregates only | Same | ≤90 days | WS08-T012 / WS10-T007 |
| `project_view_events` | Legacy project views | `profile_id`/`project_id` | Visitor | **Do not export raw**; not double-counted in WS08 totals | Same | ≤90 days | WS08-T012 / WS10-T007 |

**Export policy:** owner-facing analytics **summary** only (totals, top content, traffic-source aggregates, 7/30-day trend summaries, range/retention notes).  
**Never export:** raw rows, IP, full UA, fingerprints, viewer user ids, session ids, arbitrary full referrers.

### 3.7 Billing

| Table | Purpose | Owner key | Export | Deletion | Never export | Task |
|---|---|---|---|---|---|---|
| `subscription_customers` | Stripe customer map | `user_id` | **Do not export** Stripe customer id | Cancel Stripe then delete local (WS10-T006) | `stripe_customer_id` | WS10-T006 |
| `subscriptions` | Local subscription state | `user_id` | **Safe/redacted**: status, period dates, `cancel_at_period_end`, timestamps; no Stripe ids | After cancel | `stripe_subscription_id`, `stripe_price_id` | WS10-T006 |
| `billing_events` | Webhook audit | `tenant_id` nullable | **Do not export** | Retain operationally | Full `payload` jsonb | Internal |

### 3.8 Compliance and operations

| Table | Purpose | Owner key | Export | Deletion / anonymize | Task |
|---|---|---|---|---|---|
| `moderation_reports` | User reports | `reporter_user_id` | **Safe/redacted** reporter’s own submissions only | Anonymize reporter where required | WS10-T004/T007 |
| `dmca_notices` | DMCA intake | email on notice (no user FK) | **Do not export** by default; optional match on claimant email is product/legal decision | Retain per legal | Legal decision |
| `audit_logs` | Internal audit | `actor_user_id` | **Do not export** | Retain; anonymize actor later | WS10-T008-ish |
| `jobs` | Background jobs | `tenant_id` nullable | **Do not export** | Operational | WS04-T010 / ops |

---

## 4. Storage inventory

Canonical path (code: `apps/web/src/lib/storage/path.ts`):

`{tenant_id}/{owner_user_id}/{resource_type}/{resource_id}/{uuid}.{ext}`

| Bucket | Public | Resource types | DB reference | Export representation | Future deletion | Orphan risk | Cleanup today |
|---|---|---|---|---|---|---|---|
| `avatars` | Yes | `avatar` | `profiles.avatar_url` (often public URL or path) | Metadata + stable public URL if already public HTTPS | WS04-T010 + account delete | Replaced avatars | Partial best-effort on replace |
| `project-media` | Yes | `project-media`, `research-figure` | `project_media_assets.storage_path`, `research_figures.storage_path` | MIME, size, type, sort_order, caption; **no signed URLs**; **no privileged path dump** | WS04-T010 on content/account delete | High if DB deleted without cleanup | **WS04-T010 required before WS10-T004** |
| `private-docs` | No | `private-doc` | App supports type; hosted private PDF upload **not** product-enabled for research | Do not export bytes; metadata only if rows exist | WS04-T010 | Low if unused | Same |

**Binary/ZIP decision (MVP):** Structured export is **JSON only**. No ZIP dependency is present. File **bytes are not** bundled. Signed URLs are never exported.

---

## 5. MVP export package (approved)

Required sections:

1. Safe account metadata  
2. Profile (allowlisted fields)  
3. Profile links  
4. Projects + child records (domains, focus areas, links, media metadata, orderings)  
5. Research + figures metadata  
6. Real owner analytics summary (WS08)  
7. Additional owner data when present: saved connections (redacted), notes, collections/items, safe subscription status, reporter’s moderation submissions  

`export_notes` may list omitted categories (raw analytics, billing secrets, jobs, audit logs, ZIP/binary).

---

## 6. Deletion matrix (documented only — not implemented)

| Category | Intended action | Blockers / notes |
|---|---|---|
| Profile + links | Delete | Cascade OK |
| Projects + children | Delete | Capture storage refs **before** cascade → WS04-T010 |
| Research + figures | Delete | Same storage capture requirement |
| Connections / notes / collections | Delete | Cascade OK |
| Stripe subscription | Cancel first | WS10-T006 |
| Local subscription/customer | Delete after cancel | Requires Stripe cancel success |
| Analytics raw | Anonymize or delete | WS10-T007; 90-day policy also applies |
| Moderation reports | Anonymize reporter | Legal input |
| Audit logs | Retain; anonymize actor | Legal input |
| Storage objects | Delete owner-scoped targets | **WS04-T010** (next after export batch) |
| `auth.users` | Delete last | WS10-T005 |

**Schema note:** WS04-T010 adds `jobs.attempts`, `jobs.available_at`, `jobs.claimed_at`, plus claim RPCs (`claim_storage_cleanup_jobs`, `claim_storage_cleanup_job_by_id`). Migration is local-only until ops deploy — see `supabase/migrations/20260716235701_storage_cleanup_jobs.sql`.

---

## 7. Unresolved questions

1. Whether DMCA notices should ever be re-exported to the claimant via account export (legal).  
2. Whether `stripe_price_id` may appear as a non-secret plan label after mapping (product).  
3. Whether sharing a future multi-member tenant changes export scope (product/architecture).  
4. Binary media archive demand beyond JSON metadata (product).  
5. Exact analytics anonymization algorithm for WS10-T007 (engineering + legal).

---

## 8. Explicit non-claims

- Legal review is **pending**.  
- Account deletion is **not** implemented.  
- Storage orphan cleanup job is **not** implemented (WS04-T010).  
- Settings export/delete UI wiring is deferred (**WS09-T008** after WS10 APIs).  
- ZIP/binary export is **unsupported** in MVP.

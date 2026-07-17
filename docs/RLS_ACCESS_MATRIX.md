# RLS Access Matrix (WS11-T001)

Internal security reference for every CodeCard application table and storage bucket.

**Executable RLS:** run with local Supabase (`npx supabase start` then `npx supabase test db`).  
Contract tests in `apps/web/src/lib/security/rls-access-matrix.contract.test.ts` always run in CI without Docker.

Do **not** apply migrations via `supabase db push` from agents. Manual deploy only.

---

## Principals

| Principal | Meaning |
|---|---|
| `anon` | Unauthenticated |
| `owner_A` | Authenticated owner of the row / parent |
| `user_B` | Authenticated non-owner |
| `target_B` | Profile that was saved as a Connection (not the saver) |
| `service` | Service role (bypasses RLS; server-only) |

Legend: ✅ allowed · ❌ denied · — N/A · 🔒 service/trusted path only

---

## Application tables

| Table | FORCE RLS | anon SELECT | anon WRITE | owner_A | user_B | Notes |
|---|---|---|---|---|---|---|
| `tenants` | ✅ | ❌ | ❌ | SELECT; UPDATE if owner/admin | SELECT if same tenant | Membership via `user_tenant_ids()` |
| `tenant_memberships` | ✅ | ❌ | ❌ | SELECT | SELECT if same tenant | No client INSERT/UPDATE/DELETE |
| `profiles` | ✅ | published only | ❌ | full | published only | Drafts private |
| `profile_links` | ✅ | if profile public | ❌ | full | if profile public | |
| `projects` | ✅ | published+public profile | ❌ | full | published+public | Drafts private |
| `project_domains` | ✅ | via project visibility | ❌ | full | via project visibility | |
| `project_focus_areas` | ✅ | via project visibility | ❌ | full | via project visibility | |
| `project_media_assets` | ✅ | via project visibility | ❌ | full | via project visibility | |
| `project_links` | ✅ | via project visibility | ❌ | full | via project visibility | |
| `project_orderings` | ✅ | ❌ | ❌ | full | ❌ | Owner profile only |
| `research_papers` | ✅ | published+public profile | ❌ | full | published+public | |
| `research_figures` | ✅ | via paper visibility | ❌ | full | via paper visibility | |
| `saved_connections` | ✅ | ❌ | ❌ | full | ❌ | Target cannot see saver |
| `connection_notes` | ✅ | ❌ | ❌ | full | ❌ | Private to saver |
| `collections` | ✅ | ❌ | ❌ | full | ❌ | |
| `collection_items` | ✅ | ❌ | ❌ | full (same-owner membership) | ❌ | Parent + Connection ownership |
| `circle_activity` | ✅ | ❌ | ❌ | SELECT via Connection / own actor; INSERT/DELETE own actor | SELECT only if Connection | No UPDATE; feed also filters published |
| `circle_viewer_state` | ✅ | ❌ | ❌ | full on own row | ❌ | Viewer-private; actors cannot read |
| `public_profile_events` | ✅ | INSERT if public profile | INSERT only | SELECT own | ❌ SELECT | |
| `project_view_events` | ✅ | INSERT if published | INSERT only | SELECT own | ❌ SELECT | |
| `analytics_events` | ✅ | INSERT if published target | INSERT only | SELECT own | ❌ SELECT | |
| `subscription_customers` | ✅ | ❌ | ❌ | full | ❌ | |
| `subscriptions` | ✅ | ❌ | ❌ | SELECT | ❌ | |
| `billing_events` | ✅ | ❌ | ❌ | ❌ | ❌ | No client policies |
| `moderation_reports` | ✅ | INSERT (reporter nullable) | INSERT | SELECT own reports | ❌ | |
| `dmca_notices` | ✅ | INSERT (`WITH CHECK (true)`) | INSERT | ❌ SELECT | ❌ | Deliberate public legal intake; validated server route |
| `audit_logs` | ✅ | ❌ | ❌ | SELECT tenant | SELECT if same tenant | |
| `jobs` | ✅ | ❌ | ❌ | ❌ | ❌ | Service-role / SECURITY DEFINER claim only |
| `account_deletion_operations` | ✅ | ❌ | ❌ | ❌ | ❌ | Grants revoked from anon/authenticated |

---

## Storage buckets

| Bucket | Public read | Owner write | Other user write | Anon write | Notes |
|---|---|---|---|---|---|
| `avatars` | ✅ (avatars resource) | ✅ canonical path | ❌ | ❌ | Path: `{tenant}/{user}/avatars/...` |
| `project-media` | ✅ (project-media resource) | ✅ | ❌ | ❌ | Also `research-figure` writes |
| `private-docs` | ❌ | ✅ SELECT+write | ❌ | ❌ | PDF only; not used for hosted research PDFs in MVP |

Storage policies require five-segment canonical paths matching `auth.uid()` and tenant membership.

---

## SECURITY DEFINER functions

| Function | Purpose | Client callable? | `search_path` |
|---|---|---|---|
| `user_tenant_ids()` | Tenant IDs for `auth.uid()` | Yes (RLS helper) | set |
| `handle_new_user()` | Signup provisioning | Trigger only | set |
| `claim_storage_cleanup_jobs` | Job claim | ❌ revoked from anon/auth | set |
| `claim_storage_cleanup_job_by_id` | Single claim | ❌ revoked | set |
| `cleanup_circle_activity_on_project_delete` | Trigger | Trigger only | set |
| `cleanup_circle_activity_on_research_delete` | Trigger | Trigger only | set |

---

## Permanent privacy rules

- Connections, collections, and private notes are owner-only.
- Circle is a private latest-work feed (not social). Actors never see viewer read state.
- Draft / unpublished content never appears in public SELECT.
- Service-role credentials never reach the client.
- Alex Chen demo data is not used as an authenticated RLS fixture.

## Executable suite location

`supabase/tests/database/060_ws11_t001_rls_integration.test.sql`

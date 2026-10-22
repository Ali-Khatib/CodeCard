# Database inventory

Source: SQL files in `supabase/migrations`. This is not a live `pg_catalog` dump. Row counts, table sizes, index sizes, and schema drift against production were not measured. Do not drop a table because this list is the only evidence.

## Profiles (save path)

`profiles` (`20250627000001_initial_schema.sql`, later alters):

| Column | Notes |
|---|---|
| `id` | Primary key |
| `tenant_id` | FK to `tenants`, cascade |
| `owner_user_id` | FK to `auth.users`, cascade. Owner reads and the update filter use this. |
| `slug` | Unique index `profiles_slug_key` (`20261003180000`). Also `UNIQUE (tenant_id, slug)`. |
| `display_name`, `headline`, `bio`, `avatar_url`, `location` | Editor and public card |
| `skills` | `text[]`, count and item-length checks |
| `card_history` | jsonb back-of-card lines |
| `audience_role` | `20261004143000_profile_audience_role.sql` |
| `is_public` | Publish flag. Trigger `profiles_sync_visibility` mirrors a legacy `visibility` column when that column exists. |
| `created_at`, `updated_at` | `profiles_updated_at` sets `updated_at` on update. The save API uses it as the optimistic lock. |

Indexes used by the save: `idx_profiles_owner (owner_user_id)`, primary key, slug unique index when the slug changes. No new index was added. `updated_at` does not need its own index while the update is already constrained to one primary key.

RLS is enabled. Owner update policy `profiles_update` is `USING (owner_user_id = auth.uid())`. PostgreSQL uses that expression as the `WITH CHECK` when `WITH CHECK` is omitted, so a write cannot move the row to another owner. There is no separate `WITH CHECK` clause in the migration. The payload builder never sends `owner_user_id`, `tenant_id`, or `is_public`.

Two permissive select policies both exist in migrations: `profiles_public_select` (public, owner, or tenant member) and `profiles_mvp_public_select` (public or owner). Permissive policies are OR'd. That can add planner work. It was not measured with `EXPLAIN`, so it was not dropped.

Publish and suspension triggers (`profiles_moderation_hold_publish_block`, `profiles_suspension_publish_block`) block publishing. A normal text update that leaves `is_public` unchanged should not trip them. Not timed on a live database.

## Tables present in migrations

RLS enable statements exist for each of these. Policies were not re-audited line by line in this pass; see `docs/RLS_ACCESS_MATRIX.md` and `SECURITY_AND_RLS_AUDIT.md`.

| Area | Tables | Role |
|---|---|---|
| Identity | `tenants`, `tenant_memberships`, `profiles`, `profile_links` | Account shell and public card |
| Work | `projects`, `project_domains`, `project_focus_areas`, `project_media_assets`, `project_links`, `project_orderings`, `research_papers`, `research_figures` | Showcase |
| People | `saved_connections`, `connection_notes`, `collections`, `collection_items`, `connection_scan_offers`, `owner_events` | Connections, QR handshake, calendar |
| AI results | `ai_owner_results` | Owner-private saved project drafts and Analysis reviews. Pro is checked in the server before the write |
| Circle | `circle_activity`, `circle_viewer_state` | Activity feed and unread cursor |
| Analytics | `public_profile_events`, `project_view_events`, `analytics_events` | Events. Retention is a product decision, not a new table. |
| Billing | `subscription_customers`, `subscriptions`, `billing_events` | Stripe |
| Trust | `moderation_reports`, `moderation_content_holds`, `dmca_notices`, `audit_logs`, `account_suspensions`, `account_deletion_operations` | Moderation and deletion |
| Other | `jobs`, `storage_upload_intents`, `waitlist_signups` | Background work, upload intents, marketing |

`storage.objects` RLS is enabled from `20250627000008_storage_buckets_rls.sql`. Buckets in app config: `avatars`, `project-media`, `private-docs`.

## AI results

`supabase/migrations/20261022160000_ai_owner_results.sql` adds `ai_owner_results`. `kind` is `project_draft` or `analytics_review`. Authenticated clients can select and delete their own rows. They cannot insert or update. `saveAiOwnerResult` writes with the service role after `resolveTenantPlanId` returns `pro`. This migration has not been applied to the remote database.

Generated database types are not checked into the repo; the app uses hand-written types in `packages/types`.

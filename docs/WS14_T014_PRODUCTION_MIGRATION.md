# WS14-T014 — Production migration deployment evidence

**Status:** Schema deployed to new production Supabase project.
**Vercel cutover:** Complete (see [`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md) §30).
**T018:** Launch checklist recorded in [`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md).

## Target

| Field | Value |
|-------|--------|
| Project name | `codecard-production` |
| Project ref | `amneeddkxfbednqwzhao` |
| Region | `ap-southeast-2` |
| Organization | `heimachokziyxrepjcjl` |
| Plan | Free |
| Status at deploy | `ACTIVE_HEALTHY` |

## Untouched projects

| Project | Ref | Status |
|---------|-----|--------|
| Legacy | `gclteunkzorwaliwhatp` | `INACTIVE` |
| Staging | `zbumnudyvclkmynpqjsr` | `ACTIVE_HEALTHY` |

## Deployment method

| Item | Value |
|------|--------|
| CLI | `npx supabase` **2.109.1** |
| Workspace | Temporary dir outside git (not committed); copied `config.toml` + `migrations/` only |
| Link | `supabase link --project-ref amneeddkxfbednqwzhao` (temp workspace only; repo staging link untouched) |
| History repair | `supabase migration repair 20250627000001 --status applied --linked` |
| Apply command | `supabase migration up --linked --include-all` |
| **Not used** | `supabase db push`, `db reset`, seed scripts |

Migration 1 was previously applied via Dashboard SQL Editor; repair registered it without re-executing SQL. Migrations 2–29 applied by CLI in timestamp order.

## Deployment timestamp

- Apply completed: **2026-07-20T23:57:54Z** (UTC; agent terminal)

## Migration manifest (29) + SHA-256

| Version | File | SHA-256 |
|---------|------|---------|
| 20250627000001 | `20250627000001_initial_schema.sql` | `87ea3889afe513934aad45bf37cdb6b260c0c473a600855b8c1f5ce4a00d5736` |
| 20250627000002 | `20250627000002_rls_policies.sql` | `7258540855e9c3217429583f2478fac0cd213540d0dbcdc13566613f818378d9` |
| 20250627000003 | `20250627000003_force_rls.sql` | `4ac94607a29bb4b11d01c252b30655ad3a5bcef990512c2b9356ecd92cf36808` |
| 20250627000004 | `20250627000004_research_papers.sql` | `c01d29ddd916325133d04e09ce7144405dd38bec7854cd3f53c4b3a5d6a4c7dc` |
| 20250627000005 | `20250627000005_handle_new_user_slug.sql` | `1a9c88d2646140a61e2393f70973379b8c7894909990bd18ff8cd964ec2c5408` |
| 20250627000006 | `20250627000006_project_case_study_sections.sql` | `e0f29d90850cfedd934707512c6198940121ea3defcb4f08236ce06b89c44d67` |
| 20250627000007 | `20250627000007_profile_location_skills.sql` | `337817458abde190a8cad400f9b504dd778b77603cac0da8f49834004f4d24ba` |
| 20250627000008 | `20250627000008_storage_buckets_rls.sql` | `40544437752da80f53956d2d0e616c480ead80408eb2072681b00b3b26b116bb` |
| 20250627000009 | `20250627000009_project_foundation_fields.sql` | `b3bae633e154bb21b68d6117378b88a2f14400111b043b27055efd49a1ee1f0e` |
| 20250715000001 | `20250715000001_research_figure_storage.sql` | `bad4f8e0c76a4c17d5cc663f922316471abfa60b3eab0700a9e81e6d640577cd` |
| 20260716235701 | `20260716235701_storage_cleanup_jobs.sql` | `4a799c9367e79eafd4e9fdf23385ea4572920e38dcc648f0ad3d9638ce339bf1` |
| 20260717000001 | `20260717000001_account_deletion_operations.sql` | `e022ba03d4b4e0bf3a4e197ef2f8599154c5fd7f35d5063df9ea893d03a5f3fb` |
| 20260717010001 | `20260717010001_account_deletion_audit.sql` | `5fcb0a4cda732db18fb2eefbc3d53c071499a361d41c65db2caea39216f2d1c0` |
| 20260717020001 | `20260717020001_connections_self_guard.sql` | `4a3dff715f4f7bec98147477af8485d892a6ced1d3a08315154adc16da70b58c` |
| 20260717031351 | `20260717031351_connections_collections_hardening.sql` | `aa479fa28b445226f3c7322e713861caaaa40e7638625d5b192e93a1820f4d2e` |
| 20260717034827 | `20260717034827_circle_activity.sql` | `53bd0be729e23a5aff69f0932dc690b86dae45140a6a64547b3bdd0d66fb0b15` |
| 20260717040001 | `20260717040001_connection_notes_metadata.sql` | `71f3e76eca54cdc189d235300d2b351ecb615a08ba644e41b2f1c37753fce2ee` |
| 20260717080001 | `20260717080001_circle_viewer_state.sql` | `09d568aa1218866deca8df8fa0e03cffc1ae9570732e48bbb7b151e93cb5e889` |
| 20260717120001 | `20260717120001_billing_events_processing_state.sql` | `aafb512c613f565aa2edaf2a6b38ec38dfe8ae40a58b4cd58db33dbb2e4601c6` |
| 20260717140001 | `20260717140001_storage_upload_security_hardening.sql` | `1fa263ca20e287a8801a817de25cfcf1ca92db12161023a8cf0a1e993f292ac8` |
| 20260718012526 | `20260718012526_ws13_t004_report_resolution.sql` | `6c0ca837b3339a53781f15110fccbb7c8fcda0be72e200d64cd4e9e5dbbe9b63` |
| 20260718014945 | `20260718014945_ws13_t008_admin_audit.sql` | `67cc45f8fb9b0e34906963d626629ef0fb643f9ac7df26f369cbcc390292b569` |
| 20260718015921 | `20260718015921_ws13_t005_content_holds.sql` | `3dce9254b2830d2c01c2bd185904ee57101d565798ebebc28be49c5caa039978` |
| 20260718020932 | `20260718020932_ws13_t006_account_suspension.sql` | `cbba32745bd47e547f050082b0e90e1dcee1058fbb90fa70e5ef99f9d27788bb` |
| 20260718052349 | `20260718052349_ws13_t007_moderation_notes.sql` | `05dad48f7f6c9fad6c0d5f0f014c3178a4b9ea60051668a4aabf9c7dc518a37d` |
| 20260718054209 | `20260718054209_ws13_t009_public_reporting.sql` | `5a9bc8d57809fd103548cdf73f02fe8274e04ba0495febcad35ee19e37c25f2b` |
| 20260718180000 | `20260718180000_ws14_migration_history_repair.sql` | `89cc0112ee4acd6ead7eae43b1d2a0b4b04af512f8e8464efaf62011889ed8b5` |
| 20260719010000 | `20260719010000_ws14_upload_intent_grants.sql` | `9e68dfccdea3d488dfb84c3f0edb50bbbd0e16cd1f2d83f876db51c936314212` |
| 20260719153000 | `20260719153000_repair_project_research_tenant_ownership_rls.sql` | `41cbee32ad5662dec6b55dc2bdb3c60394b84a4254d2bd270c78707e8cb86679` |

Checksums recalculated in the temporary workspace before apply; **0 mismatches** vs this manifest.

## Migration-history repair result

```
Repaired migration history: [20250627000001] => applied
```

Did **not** re-execute Migration 1 SQL.

## Migration application result

`Migrations applied` for versions **20250627000002** through **20260719153000** (28 files). Exit code **0**. No SQL errors.

## Remote history after apply

All **29** repository timestamps present on remote (local == remote for each version).

## Post-deploy verification (read-only)

| Check | Result |
|-------|--------|
| Public tables | **32** (matches staging MVP shape) |
| RLS enabled | **32/32** |
| RLS forced | **32/32** |
| Public policies | **51** |
| Storage buckets | **3** — `avatars` (public), `project-media` (public), `private-docs` (private) |
| Storage policies | owner insert/update/delete + avatars/project-media public select + private-docs owner select |
| Auth users | **0** |
| tenants / profiles / projects / research | **0** |
| analytics / subscriptions | **0** |
| Forbidden slugs (`alex-chen`, `local-dev`, `demo`) | **0** |
| Signup trigger `on_auth_user_created` | present |
| Seed / Mailtrap / E2E config copied | **No** |

## Safety confirmations

- No `supabase db push`
- No seed / showcase / test users / analytics generation
- Staging and legacy untouched
- No Vercel / Stripe / Sentry / Upstash / Auth URL / DNS changes
- No secrets recorded in this file

## Cutover outcome

Vercel `codecard-mvp` Production points at `amneeddkxfbednqwzhao`; Preview remains on staging `zbumnudyvclkmynpqjsr`. Auth Site URL / callback configured. Evidence and GO/NO-GO recorded in [`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md).

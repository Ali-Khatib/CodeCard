# WS11-T010 Upload Security Hardening

**Status:** Implemented on `mvp` (application + forward-only migration).  
**Migration deployment:** Requires manual apply — **not** applied remotely by this task.  
**Antivirus / malware scanning:** Deferred with accepted residual risk (see WS04-T013).

## Upload category inventory

| Category | Resource type | Bucket | Public read | Live product |
|----------|---------------|--------|-------------|--------------|
| Avatar | `avatar` | `avatars` | Yes (UUID paths) | Yes |
| Project poster / screenshot | `project-media` | `project-media` | Yes | Yes |
| Research figure | `research-figure` | `project-media` | Yes | Yes |
| Research PDF (hosted) | `private-doc` | `private-docs` | No | **API blocked (403)**; product uses external `pdf_url` |
| Project attachments | — | — | — | Not a live category |

## Per-category limits (live images)

| Control | Value | Status |
|---------|-------|--------|
| Max size | 5 MB (`FILE_LIMITS.image`) | implemented + verified (deterministic) |
| Extensions | jpg, jpeg, png, webp | implemented (schemas; AVIF rejected by live schemas) |
| MIME | image/jpeg, image/png, image/webp | implemented |
| Content signature | JPEG/PNG/WebP magic bytes | implemented + verified (deterministic) |
| Active content | HTML/SVG/XML/PDF-as-image rejected | implemented + verified (deterministic) |
| SVG | Rejected (not sanitized) | implemented |
| Object key | `{tenant}/{owner}/{resourceType}/{resourceId}/{uuid}.{ext}` | implemented; owner/tenant/resource derived server-side |

## Object-key ownership model

- Paths are **server-derived** via `buildCanonicalStoragePath`.
- Clients cannot choose bucket, owner, tenant, or resource id.
- Finalize re-checks authenticated user + owned profile/project/paper + canonical path.
- Storage RLS (`storage_object_owner_may_write`) additionally requires `storage_object_resource_owned` so the path resource id must exist and belong to `auth.uid()`.

## Storage RLS changes

Forward-only migration: `supabase/migrations/20260717140001_storage_upload_security_hardening.sql`

| Change | Status |
|--------|--------|
| `storage_path_resource_id` | implemented |
| `storage_object_resource_owned` (avatar→profiles, project-media→projects, research-figure→research_papers) | implemented |
| `storage_object_owner_may_write` requires resource ownership | implemented |
| `storage_upload_intents` ledger + RLS | implemented |
| Live RLS against a database | **not run** in this task (contract tests only) |
| Remote apply | **requires manual deployment** |

## Signed uploads

| Control | Status |
|---------|--------|
| Auth required before presign | implemented |
| Category / ownership / MIME / extension / size validated before sign | implemented |
| Exact object path + bucket | implemented |
| Intent ledger row recorded | implemented |
| Token lifetime | Provider default for `createSignedUploadUrl` (not custom TTL API in current client) — residual |
| Service role never exposed to browser | implemented |
| Arbitrary bucket/path rejected | implemented |

## Post-upload confirmation

Finalize (avatar / project media / research figure):

1. Auth + ownership + path checks  
2. Object exists in expected bucket  
3. `requireVerifiedRasterObjectForFinalize` — load intent (or extension fallback), download object, verify size + magic bytes, remove on failure  
4. Persist DB reference  
5. Mark intent `finalized_at`  
6. Best-effort previous-object cleanup after successful replace  

| Control | Status |
|---------|--------|
| Magic-byte verification | implemented + verified (deterministic / mocked storage) |
| Unsafe object removed on failure | implemented + verified (deterministic) |
| Idempotent re-finalize of same path | implemented (existing uniqueness / early return + intent finalize) |
| Concurrent duplicate attachments | relies on existing DB uniqueness / path-already-finalized checks |
| Full antivirus | **deferred** — accepted residual risk |

## Active content / download headers

| Surface | Policy | Status |
|---------|--------|--------|
| Uploaded rasters | No HTML/SVG/JS; magic-checked | implemented |
| Hosted private PDF upload | Disabled | implemented |
| Public research PDF proxy | External URL; SSRF hardened; `%PDF-` check in fetch path | implemented (prior work) |
| Public PDF delivery | `Content-Type: application/pdf`, inline disposition | implemented (prior work) |
| Account export | attachment disposition | implemented (prior work) |

## Orphan reconciliation

Scenarios covered by intent ledger + `reconcileAbandonedUploadIntents` / `runAbandonedUploadReconciliation`:

- Presign issued, never uploaded / never finalized (after grace period)  
- Uploaded but finalize never called  
- Finalize validation fails (object removed immediately; intent may remain until abandon)  
- DB attach fails after upload (object removed on failure path)  

| Control | Status |
|---------|--------|
| Executable reconciliation function | implemented |
| Dry-run mode | implemented + verified (deterministic) |
| 24h grace period default | implemented |
| Idempotent abandon marking | implemented |
| Production schedule | **deferred** (document for WS14/ops) — do not claim scheduled |

## Account / project / research deletion

Existing WS04 storage cleanup jobs collect avatar, project-media, and research-figure objects and enqueue removal. Intent rows cascade on `auth.users` delete.

## Demo isolation

Alex Chen demo continues to use fixtures / external links; authenticated signed upload APIs remain gated. Demo must not receive production signed URLs (unchanged product behavior).

## Residual accepted risks

1. No antivirus / malware engine.  
2. Public avatar/project-media buckets rely on UUID path obscurity for secrecy.  
3. Signed-upload URL TTL is provider-default (not custom-configured).  
4. Full-object download for ≤5 MB magic verification (bounded by product max).  
5. Migration not yet applied to remote databases.  
6. Orphan sweep not yet on a production schedule.

## Manual deployment steps

1. Apply `20260717140001_storage_upload_security_hardening.sql` to staging, then production, via approved ops process.  
2. Verify RLS with authenticated cross-user insert/delete probes in staging.  
3. Schedule periodic `runAbandonedUploadReconciliation` (service role, dry-run first).  
4. Do **not** enable `private-doc` uploads without a separate PDF security gate.

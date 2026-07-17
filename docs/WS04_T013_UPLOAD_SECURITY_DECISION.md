# WS04-T013 — Upload security / virus-scanning assessment

**Task:** Document an evidence-based malware-scanning go/no-go for CodeCard uploads.  
**Date:** 2026-07-15  
**Branch basis:** `mvp` (controls verified against repository code; not a live pen test)  
**Status:** Conditional go for private beta raster images only — **not** approval for wide public launch or research PDFs.

This document does **not** claim that antivirus or content-disarm infrastructure exists. **Magic-byte sniffing for live raster finalize paths was added in WS11-T010** and complements MIME/extension allowlists; it is still not malware scanning. Client-side compression (WS04-T012) is a performance aid only and is **not** a security control.

---

## 1. Executive decision

| Question | Answer |
|----------|--------|
| Is malware/virus scanning required for the **controlled private MVP beta** of **current** image uploads (avatar, project cover, screenshots)? | **No — conditional deferral**, if operating conditions below remain true. |
| Is scanning required before **wide public launch** or enabling **untrusted PDFs / video / archives**? | **Yes — reopen and plan scanning / quarantine (or refuse those types).** |
| Verdict label | **CONDITIONAL GO — private beta, raster images only** |

**Private-beta conditions (all must remain true):**

1. Live upload surface stays JPEG / PNG / WebP images for avatar, cover, and screenshots only.
2. Research **private** PDF upload UI stays disabled (external HTTPS `pdf_url` links are the MVP path only).
3. SVG, HTML, archives, executables, and office documents stay rejected.
4. Authenticated upload API, ownership checks, UUID object names, owner-scoped paths, storage RLS, MIME+extension pairing, size limits, and upload rate limits stay in place.
5. Beta audience is intentionally limited (manual ops / invite — not yet enforced in application code).
6. Operators can remove abusive content via account ownership tools, reports/DMCA hooks, and storage cleanup helpers.
7. No automatic upload of user files to third-party malware scanners without privacy/legal review.

If any of the **code-enforced** controls above regress, this deferral is **revoked** until fixed or scanning is added.

---

## 2. Scope reviewed

**In scope (live product):**

- Profile avatar upload / replacement
- Project cover upload / replacement
- Project screenshot multi-upload / deletion
- `POST /api/upload` signed-intent creation
- Finalization ownership and path checks
- Storage buckets / RLS migration contract
- Upload validation schemas and client validators

**Out of scope for this decision as “approved live features”:**

- Research PDF / figure UI (schemas/buckets exist; product pipeline not shipped)
- Video upload UI (config/bucket allowlists exist; live `mediaRole` path is images-only)
- Client image compression
- Orphan cleanup jobs
- Implementing ClamAV / VirusTotal / CDR

---

## 3. Current upload architecture

```
Client selects file
  → client MIME/extension/size validation
  → POST /api/upload (same-origin, auth, rate limit, Zod metadata)
  → server derives bucket + ownership + UUID path
  → signed upload URL
  → client PUT bytes to storage
  → server finalize (re-check auth, path ownership, object existence)
  → persist profile.avatar_url or project_media_assets.storage_path
```

**Buckets (migration `20250627000008_storage_buckets_rls.sql`):**

| Bucket | Public? | Purpose |
|--------|---------|---------|
| `avatars` | Yes | Profile images (UUID object paths) |
| `project-media` | Yes | Covers / screenshots |
| `private-docs` | No | Future research PDFs |

Canonical path shape: `{tenantId}/{ownerUserId}/{resourceType}/{resourceId}/{uuid}.{ext}`  
Implemented in `apps/web/src/lib/storage/path.ts`.

---

## 4. Controls verified (repository evidence)

| Control | Status | Primary evidence |
|---------|--------|------------------|
| MIME allowlist (live images) | Present | `PROJECT_MEDIA_IMAGE_MIME_TYPES`; avatar filters exclude AVIF/SVG |
| Extension allowlist | Present | jpg/jpeg/png/webp; blocked set includes svg/html/exe/… |
| MIME ↔ extension pairing | Present | `refineFilenameMimeCompatibility`, `validateUploadMetadata` |
| Zero-byte rejection | Present | size `.positive()` / `size > 0` |
| Server size limits | Present | App 5 MB images; bucket byte caps |
| App-generated object names | Present | `generateStorageFilename` → UUID |
| Client cannot set bucket | Present | Forbidden fields + `RESOURCE_TYPE_TO_BUCKET` |
| Client cannot mint arbitrary path | Present | Path minted in `createSignedUploadIntent`; finalize re-asserts ownership |
| Authenticated uploads | Present | `getUser()` on `/api/upload` |
| Project ownership check | Present | `resolveUploadOwnership`, `loadOwnedProject`, finalize asserts |
| Rate limiting | Present | `RATE_LIMITS.upload` 20/hour; IP + user keys; prod fail-closed without Redis |
| SVG rejected | Present | Tests + allowlist + blocklist |
| Storage RLS owner writes | Present | Migration policies + contract tests |
| `private-docs` non-public | Present | `public = false`; owner SELECT only |
| Image UI rendering | Present | `next/image` + CSP/`nosniff`; trusted host helpers for avatars |

---

## 5. Missing or incomplete controls

| Gap | Severity for private image beta | Notes |
|-----|----------------------------------|-------|
| ~~No magic-byte / content sniffing~~ | Mitigated (WS11-T010) | Finalize downloads object and verifies JPEG/PNG/WebP magic; still not antivirus |
| No malware scanner | Accepted for scoped deferral | Reassess for public / PDF |
| No invite-only gate in app code | Operational | Must be enforced by ops (closed signup / limited invites) |
| `private-doc` still a valid API `resourceType` | Residual | No research UI; keep PDF UI disabled; tighten before public PDF |
| Avatar server path may still allow AVIF via `FILE_LIMITS` while client rejects it | Low drift | Prefer aligning route with avatar schema before public launch |
| Public media buckets | By design | Object secrecy ≈ obscurity of UUID paths; not ACL secrecy |
| Admin UI not role-gated | Operational | Pending reports page exists; harden before public |
| No formal incident-response runbook | Process | Expectations listed below; write a full IR playbook before public launch |
| Bucket allows video MIME beyond live UI | Residual | Live finalize roles are image-only; do not enable video without a separate review |
| Orphan reconciliation schedule | Residual | Executable reconciler exists (WS11-T010); production cron deferred |

---

## 6. Threat model

| Threat | Current mitigation | Residual | Blocks private beta? | Blocks public launch? | Future control |
|--------|-------------------|----------|----------------------|------------------------|----------------|
| Disguised executable as image | Allowlist + MIME/ext + bucket MIME + **magic-byte finalize (WS11-T010)** | No full AV | No | Reassess | Antivirus / transcoder |
| MIME/extension mismatch | Paired validation | — | No | No if kept | Keep tests |
| Path traversal / directory influence | Strict filename rules; UUID paths | — | No | No | Keep tests |
| Bucket/path forgery | Server-derived bucket/path; finalize asserts | — | No | No | Keep tests |
| Cross-tenant object access | Path owner + tenant RLS | Misconfig risk | No if RLS stays | Yes if RLS breaks | Periodic RLS audits |
| Malicious SVG | Rejected | — | No | Reject unless sanitized | SVG sanitizer only if required |
| Image bomb / huge decode | 5 MB app/bucket limits | Decoder resource use | No | Prefer decode limits / resize | WS04-T012 + server caps |
| Malicious PDF | PDF UI not shipped; private-docs private | API resource type exists | No **if** PDF UI stays off | **Yes** without scan/quarantine plan | Scanner + quarantine states |
| Phishing / abusive images | Reports + DMCA routes | Manual response lag | Conditional on ops | Yes without moderation capacity | Moderator workflow |
| Upload flooding | Rate limits | Bypass if Redis misconfigured | Fail-closed in prod helps | Strengthen | WAF / stricter limits |
| Public bucket enumeration | UUID keys | Path leak | Low | Document + short-lived URLs later | Private buckets + signed reads |
| Private-doc leakage | Bucket private + owner policy | Misconfig | N/A for live images | Critical | Keep private + tests |
| AI processing of uploads | Not implemented | Future risk | No | Yes before AI ingest | Scan/transcode gate |
| Orphan dangerous objects | Best-effort cleanup | Needs WS04-T010 | No | Prefer cleanup job | Orphan job |
| Compromised account abuse | Auth + ownership | Insider misuse | Ops takedown | Stronger moderation | Ban/takedown tools |

---

## 7. Risk by file category

### Category A — Static raster images (JPEG / PNG / WebP)

- **Private beta:** Conditional approval with controls above.  
- **Public launch:** Reassess; consider metadata stripping / re-encode and stronger moderation.  
- Risks: decoder bugs, oversized images, abusive visual content, disguised content without sniffing.

### Category B — SVG

- **Reject** for MVP (private and public) unless a proven sanitization pipeline exists.  
- Risks: script / external resource / XSS if rendered as markup.

### Category C — PDF

- **Do not** inherit the image decision.  
- **Private beta:** Keep research PDF upload **disabled** until WS04-T007 + a PDF-specific gate.  
- **Public launch:** Antivirus / content analysis (or hardened CDR) **strongly recommended** before broad untrusted PDFs; private-only with scan/quarantine preferred.  
- Risks: scripts, attachments, malicious links, parser bugs, future AI ingestion.

### Category D — Archives / executables / HTML / office docs

- **Reject** for MVP and public launch unless a dedicated product + quarantine architecture is approved later.

### Category E — Video

- Present in `FILE_LIMITS` / bucket allowlist scaffolding; **not** part of the live `poster`/`screenshot` pipeline.  
- Treat as **not approved** until a separate assessment.

---

## 8. Private-beta go/no-go

**Verdict: CONDITIONAL GO** for avatar, cover, and screenshot **raster** uploads only.

**Required before inviting beta users:**

1. Confirm ops process for limited audience (invite / closed signup / manual allowlist).
2. Confirm monitoring (Sentry / error logs) and ability to delete abusive media for an owner.
3. Keep research **private** PDF and video product features disabled (external PDF links remain allowed).
4. Do not send beta uploads to third-party scanners without privacy review.

**Not a green light for:** open public signup at scale, PDFs, SVG, video, archives, or automated AI document ingest.

---

## 9. Public-launch requirements

Revisit scanning **before** wide public launch. At minimum require:

- Proven image moderation or rapid human takedown capacity  
- Role-gated admin tooling  
- Formal incident-response playbook  
- Re-audit of public bucket strategy  
- Alignment of all client/server MIME allowlists  
- Decision on AVIF  
- Explicit **disable or quarantine** path for any document types  

**Mandatory scanning / quarantine (or refuse the feature) before:**

- Unrestricted public signup with uploads  
- Research PDF uploads enabled for general users  
- Server-side document parsing  
- Sending user files to AI systems  
- Video or archive uploads  
- Serving downloads of untrusted binary formats from your origin as “trusted”

---

## 10. PDF and research-upload requirements

### MVP decision (updated for WS04-T007)

| Mode | Status |
|------|--------|
| External HTTPS PDF / paper URL (`research_papers.pdf_url`) | **Supported** for MVP |
| Private CodeCard-hosted PDF upload (`private-docs`) | **Intentionally disabled** |
| Malware / virus scanning of documents | **Not implemented** — do not claim otherwise |
| Signed PDF download routes | **Not shipped** (no private PDF objects) |

External PDF links:

1. HTTPS only; reject credentials, `javascript:`, `data:`, `file:`, and non-HTTPS schemes.
2. Persist the normalized external URL only — never signed URLs, Blob URLs, or storage paths in `pdf_url`.
3. Public UI labels the source as externally hosted and offers “Open paper” / “Open external paper”.
4. CodeCard does **not** host, scan, proxy, or verify the remote document.
5. Draft papers and private profiles must not expose the link publicly (existing publication RLS / route gates).

Before enabling **private** research PDFs later:

1. Keep storage in `private-docs` (non-public).
2. Authenticated download / signed URL only.
3. Prefer `Content-Disposition: attachment` for downloads.
4. Do not inline-render untrusted PDFs without additional controls.
5. Plan scan states (`pending_scan` / `clean` / `blocked` / `failed`) or equivalent.
6. Block download until clean **or** refuse broad public PDF uploads.
7. Separate privacy review if using any third-party scanner.
8. Add a schema discriminator (for example `pdf_storage_path` + source type) so external URLs are never mixed with private object keys.
9. Do not treat the image GO or external-URL MVP as private-PDF GO.

---

## 11. External scanner privacy considerations

Do **not** automatically upload user avatars, project media, or research files to public malware-analysis services (for example VirusTotal) without:

- Explicit product/legal approval  
- Privacy policy disclosure and, where required, consent  
- Understanding vendor retention, regional processing, and IP exposure  
- Cost, false-positive, and availability planning  

Research PDFs and unpublished work are especially sensitive. Prefer private, contractual scanning (or in-house quarantine) over public sample sharing.

---

## 12. Operational response plan (MVP expectations)

Until a full IR playbook exists, operators should:

1. Triage reports via `/api/moderation/report` and DMCA intake.  
2. Identify owners via canonical path segment (`owner_user_id`) and `project_media_assets` / `profiles` rows.  
3. Remove abusive objects with existing owner deletion / cleanup helpers; escalate for account suspension offline.  
4. Rotate or invalidate sessions for compromised accounts.  
5. Preserve hashes/IDs of abusive objects for investigation — do not host payloads longer than needed.  
6. Escalate legal/compliance issues per company process.

---

## 13. Evidence and tests reviewed

Representative automated evidence (run during this assessment):

- `packages/validation` upload schema tests (MIME, SVG, size, MIME/ext mismatch)  
- `apps/web/src/lib/storage/upload-validation.test.ts`  
- `apps/web/src/app/api/upload/route.test.ts` (auth, SVG, project ownership)  
- `apps/web/src/lib/storage/path.test.ts`  
- `apps/web/src/lib/storage/storage-migration-contract.test.ts`  
- Avatar / project-media / cleanup / progress regression suites  

This task does **not** execute or mock antivirus engines.

---

## 14. Reassessment triggers

Reopen this decision when any of the following occur:

- Uploads opened to unrestricted public signup  
- Research PDFs or figures enabled  
- Documents parsed server-side  
- Files sent to AI systems  
- Video or archive uploads enabled  
- Organization/team accounts introduced  
- Moderation volume or abuse reports spike  
- File downloads grow materially  
- Regulatory / institutional customers are targeted  
- Storage RLS or path builder changes  
- Public bucket listing / read model changes  

**Review date / trigger:** Before enabling research uploads **or** before public launch marketing that invites open signup — whichever comes first. Target calendar review: not later than the next major audience expansion.

---

## 15. Final sign-off status

| Item | Status |
|------|--------|
| Repository audit completed | Yes |
| Scanner integrated | **No** (intentionally) |
| Migration added | **No** |
| Private-beta raster images | **CONDITIONAL GO** |
| Public launch | **NO-GO without reassessment** |
| Research PDFs (private upload) | **NO-GO** — intentionally disabled |
| Research PDF external HTTPS links | **Supported for MVP** (`pdf_url` only; no hosting/scanning claim) |
| SVG / archives / executables | **REJECT** |

**Sign-off:** Engineering assessment documented for WS04-T013 (2026-07-15). Product/security owners should acknowledge the operational conditions (limited audience, PDF UI off) before expanding invites.

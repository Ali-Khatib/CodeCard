# CodeCard analytics retention policy (WS08-T012)

**Status:** Policy and manual cleanup procedure documented.  
**Automation:** Not implemented. No scheduled cleanup job was added or executed.  
**Legal review:** This document describes the implemented product design. It has **not** been attorney-reviewed.

---

## 1. Policy summary

Raw analytics events are retained for **up to 90 days** from their **server-recorded** timestamp (UTC).

Eligible rows are deleted during the **next scheduled or manual cleanup cycle** after they age past the cutoff. Deletion is not guaranteed at the exact second a row turns 90 days old.

This 90-day window is a **maximum** retention period for raw analytics rows, not a requirement to keep every event for the full 90 days (for example, account deletion may remove owner-linked analytics earlier — see [Account deletion](#7-account-deletion-relationship-ws10)).

---

## 2. What counts as a raw analytics event

A **raw analytics event** is an event-level row that records a single audience or engagement signal for a public CodeCard.

### Canonical tables in scope

| Table | Timestamp column (UTC) | Role |
|---|---|---|
| `analytics_events` | `created_at` | **Primary** unified event store used by authenticated owner analytics aggregations and trends |
| `public_profile_events` | `viewed_at` | Legacy/parallel profile-visit rows (also used for traffic-source breakdown) |
| `project_view_events` | `viewed_at` | Legacy/parallel project-view rows |

All three tables contain **raw** event-level records and are in scope for the 90-day retention policy. Cleanup must target each audited table explicitly. Do not leave legacy tables outside the policy.

### Event types stored in `analytics_events` (validated product types)

Current validated `event_type` values include:

- `profile_view`
- `project_view`
- `research_view`
- `link_click`
- `profile_share`
- `qr_download`
- `resume_click`
- `paper_download`
- `citation_copy`
- `abstract_expand`
- `figure_view`
- `related_project_click`
- `time_spent_on_research`
- `project_time_spent`
- `project_section_time_spent`
- `project_section_view`
- `project_section_hover_or_click`

QR-origin attribution is represented via approved `source` / metadata fields on view events (for example `source: 'qr'`), not as a separate retention category.

### What may be present on raw rows

Depending on table and event type, rows may include:

- opaque first-party `session_id` (deduplication; **not** an authentication credential)
- referrer / connection `source` categories
- target identifiers (`profile_id`, `target_id`, `project_id`, etc.)
- non-PII metadata such as duration seconds or approved link categories

### What the analytics product intentionally does **not** persist

- device fingerprinting
- full User-Agent strings in analytics payloads (request UA is read transiently for bot filtering only; UA-like keys are stripped from metadata)
- client-trusted owner identity for scoping
- visitor IP addresses as stored analytics columns (hosting/rate-limit infrastructure may see IPs transiently; that is not a product analytics column)

---

## 3. Retention clock and cutoff

- **Authoritative clock:** server database timestamps in **UTC**
- **Do not use:** browser local time, user-supplied timestamps, profile timezone, last dashboard view, or account creation date

### Recommended exclusive cutoff

For `analytics_events`:

```text
created_at < (current_utc_timestamp - interval '90 days')
```

For legacy tables:

```text
viewed_at < (current_utc_timestamp - interval '90 days')
```

Rows at or newer than the cutoff remain. Rows older than the cutoff are **eligible** for deletion.

---

## 4. Aggregated / owner-facing analytics

CodeCard MVP owner dashboards currently compute totals and trends **directly from raw event rows** (primarily `analytics_events`, with traffic sources from `public_profile_events`).

There is **no** separate long-lived aggregate store today.

Therefore:

- after raw events older than 90 days are deleted, those historical counts **will no longer appear** in owner analytics;
- the product does **not** currently promise lifetime analytics once cleanup runs;
- future lifetime aggregates (summarized counts without reconstructing individual visitors) are **out of scope for WS08** and must be designed separately if required.

Do not claim long-term aggregate retention exists unless a dedicated aggregate pipeline is implemented later.

---

## 5. Records explicitly **outside** this 90-day analytics policy

Do **not** apply this policy to:

| Category | Examples |
|---|---|
| Billing | `billing_events`, Stripe customer/subscription rows, Stripe webhook processing artifacts |
| Audit / security | `audit_logs`, security incident records, application error logs (e.g. Sentry) |
| Moderation / legal | `moderation_reports`, `dmca_notices` |
| Account / auth | auth users, tenant membership, profile content, account-deletion workflow records |
| Operational jobs | `jobs` table rows unrelated to analytics |
| Backups | database/storage backups (separate policy — see below) |

Those categories follow their own retention and legal rules.

---

## 6. Backup limitation

Primary-table deletion does **not** guarantee immediate removal from every backup snapshot.

CodeCard does **not** yet document a guaranteed backup expiration period for analytics data. Backup retention must be defined in the operational runbook before production launch claims about complete erasure are made. Until then, treat backup lag as an acknowledged limitation.

---

## 7. Account deletion relationship (WS10)

WS10 will define export and full account deletion behavior. That work is **not** complete in WS08.

Intended relationship (pending WS10):

- account deletion **may** remove or anonymize owner-linked analytics **earlier** than the normal 90-day maximum;
- the 90-day period remains a maximum for ordinary analytics retention, not a keep-until requirement;
- do not claim account-deletion analytics handling already works until WS10 ships and is verified.

---

## 8. Privacy alignment

User-facing Privacy Policy text must describe analytics retention as **up to 90 days** for raw analytics events, consistent with this document.

The Privacy Policy is a product disclosure of current design. It is **not** a substitute for attorney review.

---

## 9. Operational ownership

**Owner:** CodeCard engineering / operations (person executing production database maintenance).

Cleanup is an **authorized server/database operations** responsibility. It must never:

- run from the browser;
- expose a public cleanup endpoint;
- accept arbitrary table names or SQL from a web request;
- use documented service-role secrets in this repository;
- delete billing, audit, moderation, or security records by mistake.

---

## 10. Manual cleanup checklist

Use this checklist for each cleanup cycle until automation exists.

1. Identify the canonical raw analytics tables: `analytics_events`, `public_profile_events`, `project_view_events`.
2. Confirm environment (staging vs production) and that you are connected to the intended database.
3. Compute the UTC cutoff timestamp (`now() - interval '90 days'`).
4. Take or verify the required backup according to the current backup policy (define backup retention if still missing — launch follow-up).
5. Dry-run counts of eligible rows (see SQL examples below).
6. Confirm only the three analytics tables are targeted.
7. Delete expired rows in bounded batches if volume is large.
8. Verify the remaining minimum timestamp is at or after the cutoff for each table.
9. Smoke-check owner analytics dashboard queries still load.
10. Confirm RLS / owner isolation expectations are unchanged (no policy edits in this procedure).
11. Record cleanup date, environment, cutoff, rows deleted (or dry-run counts), and operator.
12. If deletion volume is unexpected (far higher/lower than prior cycles), **stop** and investigate before continuing.
13. If cleanup fails, escalate to engineering ownership; do not invent ad-hoc destructive scripts; retry after root-cause review.

### Dry-run examples (conceptual)

> **Warning:** Verify environment and backup first. These examples target only audited analytics tables. Do not paste production credentials into docs or tickets.

```sql
-- Dry-run: analytics_events
SELECT COUNT(*) AS eligible
FROM analytics_events
WHERE created_at < (timezone('utc', now()) - interval '90 days');

-- Dry-run: public_profile_events
SELECT COUNT(*) AS eligible
FROM public_profile_events
WHERE viewed_at < (timezone('utc', now()) - interval '90 days');

-- Dry-run: project_view_events
SELECT COUNT(*) AS eligible
FROM project_view_events
WHERE viewed_at < (timezone('utc', now()) - interval '90 days');
```

### Example bounded delete (after dry-run approval)

```sql
-- Example only — run after dry-run and backup verification.
-- Prefer batched deletes in production for large tables.

DELETE FROM analytics_events
WHERE id IN (
  SELECT id
  FROM analytics_events
  WHERE created_at < (timezone('utc', now()) - interval '90 days')
  LIMIT 5000
);
```

Repeat similar batched deletes for `public_profile_events` and `project_view_events` using `viewed_at`.

### Post-delete verification examples

```sql
SELECT MIN(created_at) AS oldest_remaining FROM analytics_events;
SELECT MIN(viewed_at) AS oldest_remaining FROM public_profile_events;
SELECT MIN(viewed_at) AS oldest_remaining FROM project_view_events;
```

---

## 11. Cleanup failure procedure

If cleanup fails or cannot be completed safely:

1. Stop further deletes for that cycle.
2. Preserve dry-run counts and error output (without secrets).
3. Confirm backups remain intact.
4. Escalate to engineering ownership.
5. Do not weaken RLS, open a public maintenance route, or delete unrelated tables to “catch up.”
6. Re-run dry-run after the failure is understood; only then resume bounded deletes.

---

## 12. Automation status (deferred)

### Scheduler audit (as of WS08-T012)

| Mechanism | Present? | Notes |
|---|---|---|
| Supabase `pg_cron` / DB scheduled jobs for analytics cleanup | No | Not configured for this cleanup |
| Vercel Cron | No | `apps/web/vercel.json` has no cron routes |
| GitHub Actions schedule for analytics cleanup | No | Dependabot schedule only |
| Authenticated internal maintenance cleanup route | No | Not present |

### Decision

Because no approved analytics-cleanup scheduler foundation exists, **automated deletion was not added** in WS08-T012.

Follow-up (not part of this task): when a safe scheduler and secrets model exist, wire a job that:

- uses the same UTC cutoff and audited table list;
- runs dry-run metrics / alerting;
- never accepts client SQL;
- never deletes non-analytics tables.

---

## 13. Honest completion statement

The 90-day retention policy and manual cleanup procedure are documented.  
No automated cleanup job was added or executed.  
No production analytics data was deleted as part of documenting this policy.

# CodeCard operations runbook

Operational procedures for CodeCard MVP. Keep secrets out of this repository.

## Analytics event retention (WS08-T012)

Canonical policy and manual cleanup checklist:

→ [`docs/ANALYTICS_RETENTION.md`](./ANALYTICS_RETENTION.md)

Summary:

- Raw analytics events in `analytics_events`, `public_profile_events`, and `project_view_events` are retained for **up to 90 days** (UTC server timestamps).
- Owner dashboards currently aggregate from raw events; cleanup will remove older history from dashboards.
- Cleanup is **manual** until a safe scheduled job is approved and implemented.
- Do **not** apply the 90-day rule to billing, audit, moderation, DMCA, security, or auth records.

### Launch / ops checklist items

- [ ] Raw analytics retention policy reviewed (`docs/ANALYTICS_RETENTION.md`)
- [ ] Manual analytics cleanup dry-run procedure reviewed
- [ ] Backup retention period for analytics defined (currently undefined — launch follow-up)
- [ ] First cleanup cycle dry-run recorded (environment, cutoff, eligible counts)

### Quick ops reminders

1. Dry-run `COUNT(*)` before any delete.
2. Verify environment and backup.
3. Delete only the three audited analytics tables.
4. Record the cleanup result.
5. Escalate unexpected volume or failures.

## Backup retention

Backup expiration for analytics (and other data) is **not yet defined**. Define backup retention before claiming complete erasure after primary-table cleanup. Track as a launch follow-up in `LAUNCH_CHECKLIST.md`.

## Related documents

- [`SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md)
- [`../LAUNCH_CHECKLIST.md`](../LAUNCH_CHECKLIST.md)
- Privacy Policy (web): `/legal/privacy`

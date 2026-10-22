# Executive summary

Date: 2026-10-22. Branch inspected: `mvp`. This audit used the repository. It did not use the Supabase dashboard, a production invoice, or a signed-in browser session. Those gaps are called out wherever a number would otherwise be guessed.

## Current state

CodeCard is a Next.js App Router application in `apps/web`, with shared packages and an Expo app in `apps/mobile`. Data lives in Supabase Postgres with Row Level Security. Auth is Supabase Auth. Uploads use Supabase Storage. Redis (Upstash) rate-limits selected APIs. Stripe, Sentry, and Vercel analytics are present in code. Whether each one is configured in production was not verified from a dashboard.

The product that is implemented includes public profiles, profile editing, projects, research, connections, QR sharing, a home calendar, Circle activity, analytics events, billing tables, moderation, and account export/deletion.

## Critical finding

Save Changes felt slow because the button waited on a Next.js Server Action. That action invalidated `/dashboard` and the response could not finish until the dynamic Home route rendered again. Home loads the profile, completion counts, Circle unread, the schedule, links, and a connection count. The profile write itself is one indexed update. Avatar upload is a separate control and was not on this path.

## What changed

- Profile text now saves with `POST /api/profile`. The response is the write result. It does not render the dashboard.
- Unchanged edits do not write and do not bust caches.
- A matching `updated_at` is required when the editor has one, so a stale tab does not silently overwrite a newer save.
- The card preview updates from the saved form. A background `router.refresh()` still reloads Home after the button has already confirmed.
- Idle sign-out now rejects cross-site requests.
- Server logs record phase timings and a request id. They do not record profile text, tokens, or cookies.

## What was verified

- `npx tsc --noEmit` in `apps/web` completed with no errors.
- New and updated unit tests for the update core, the client helper, and `POST /api/profile` passed.
- The full `apps/web` Vitest run was 1797 passed and 70 failed. The failures inspected are existing contract drift (admin route mocks missing `enforceAdminRateLimit`, stale source-string contracts). None of the new profile-save tests failed.

## What was not verified

- No before/after millisecond timings against Supabase. There is no local `.env` with project credentials in this workspace, and the dashboard was not opened.
- No production build. A build needs the public Supabase URL and was not attempted without it.
- No browser pass of the signed-in editor.
- No `EXPLAIN`, row counts, disk size, MAU, egress, or invoice.

## Do not do next without approval

- Do not drop tables, policies, or storage objects from this audit.
- Do not add tables for search, notifications, or other unbuilt features.
- Do not put Upstash on the profile save path until a limiter has a short timeout and fails open. The current Redis attempt budget is 1500 ms and would sit in front of the write.
- Do not change the live Supabase plan or Vercel project from this work.

## Recommended next actions

1. Save a profile on the deployed MVP while watching the `[profile-update]` log. Confirm `totalMs` for a normal text edit, separately from the later Home refresh.
2. Open the Supabase usage page and record disk, compute size, database size, storage, egress, and MAU. Table count is not a billable line.
3. Run `EXPLAIN` on the owner profile read and update if those logs show the database, rather than auth or the region hop, is the remaining time.

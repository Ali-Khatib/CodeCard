# Save performance report

## Baseline

The editor button label is `Save changes` in `apps/web/src/components/profile-editor.tsx`. Before this change it submitted through `useActionState(updateProfileAction)`.

`updateProfileAction` (`apps/web/src/lib/profile/update-profile-action.ts`):

1. `createClient()` then `executeProfileUpdate`.
2. `getUser()` unless a user was already passed. Inside one request, `createClient` dedupes `getUser`.
3. Read the owner row from `profiles` by `owner_user_id` (`idx_profiles_owner`).
4. Validate. If the slug changed, read `profiles` and `tenants` for a clash.
5. `UPDATE profiles` by primary key.
6. On success, `revalidatePath('/dashboard')`, `/dashboard/profile`, `/dashboard/profile/preview`, and the public profile tag/path.

`apps/web/src/proxy.ts` also calls `getUser()` for `/dashboard/:path*`. That client is separate from `createClient`, so a dashboard Server Action paid for a second Auth round trip before the action ran. `/api/*` is not in the proxy matcher.

After the action, Next.js keeps the `useActionState` pending flag set until the POST finishes. Invalidating `/dashboard` refreshes the current dynamic route in that same turn. Both the authenticated layout and Home call `cookies()` via `createClient`, so they render again:

| Work | Where | Needed to store the profile text? |
|---|---|---|
| Auth user | proxy, then action | The action check is required. The proxy check is not, once the write is an `/api` route. |
| Owner profile | layout and page | No. The editor already holds the saved values. |
| Profile completion counts (links, projects) | layout and page | No. |
| Circle unread (profile id, connections, activity count) | layout | No. |
| Home schedule and follow-ups | page | No. |
| Profile links and connection count | page | No. |

Avatar upload is `AvatarUpload`, not the Save button. Save does not re-upload a photo.

No stopwatch baseline was captured. This environment has no Supabase credentials and no signed-in browser. The bottleneck above is the request each click was waiting on, read from the source.

## Target

Engineering targets from the brief, not measured results:

- Ordinary text save: server response p95 under 500 ms where region and Auth allow it.
- Click to confirmed save: p95 under 1 second.
- Unchanged files must not be uploaded. This path never uploaded files.
- One click must not write twice.
- The UI must not say saved unless the write succeeded.

## Fix

`POST /api/profile` runs the same `executeProfileUpdate` and returns JSON. Cache invalidation still runs after a real write, but the HTTP response does not render Home.

The editor posts `FormData`, keeps a submit lock, and sets the saved state only when the response is OK and `success` is true. Network failures and conflicts stay errors.

If the normalized fields already match the row, the handler returns success and skips the write and the cache bust.

If the editor sends `updated_at` and it does not match the row, or the versioned update matches zero rows, the API returns 409 and does not report success.

Home and the profile page copy the saved fields into the card immediately, then call `router.refresh()` without awaiting it. That refresh still does the heavy Home read. It no longer blocks the button. The editor does not call `router.refresh()` and does not reset the form from server props, so an in-progress edit is not replaced.

Server log shape, production-safe:

```text
[profile-update] { requestId, totalMs, authMs, readMs, writeMs, ok, unchanged, code }
```

## Tests

| Test | Result |
|---|---|
| Unchanged payload does not call `update` | Passed |
| Stale `updated_at` does not call `update` | Passed |
| One write, returned timestamp, no extra `getUser` when the route already authenticated | Passed |
| Zero-row versioned update is not success | Passed |
| `postProfileSave` rejects network failure and non-OK responses | Passed |
| `POST /api/profile` rejects cross-site, signed-out, and conflict; skips revalidation when unchanged; omits diagnostics | Passed |
| `npx tsc --noEmit` in `apps/web` | Passed |

## Remaining limit

Click-to-confirmed-write should now be Auth plus one profile read plus at most one update. Click-to-fully-refreshed Home is still the old dashboard query set, moved off the button. Measure both on the MVP deployment before claiming the p95 targets. Auth latency from the Vercel region to Supabase can dominate a single round trip even when the SQL is indexed.

Redis is not consulted. Adding the current limiter would insert up to 1500 ms of wait, twice, on a path that previously had no Redis call.

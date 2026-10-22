# Implementation log

Date: 2026-10-22. No migration. No production SQL. No env or billing changes. Existing untracked `apps/web/.tmp-preview/` was left untouched.

## Profile save

| File | Change |
|---|---|
| `apps/web/src/lib/profile/profile-update-core.ts` | Skip identical writes. Optimistic `updated_at`. Phase timings on the result object (callers must not send them to the browser). |
| `apps/web/src/lib/profile/profile-update-revalidate.ts` | Dashboard and public cache invalidation, shared by the route and the old action. |
| `apps/web/src/app/api/profile/route.ts` | `POST` save. Same-origin, session, 48 KB content-length cap, no-store JSON. |
| `apps/web/src/lib/profile/save-profile-client.ts` | Browser helper. Success only on HTTP OK and `success: true`. |
| `apps/web/src/components/profile-editor.tsx` | Posts to the API. Submit lock. Does not reset the form and does not refresh the router itself. |
| `apps/web/src/components/dashboard/home-desk.tsx` | Applies the saved card immediately, then refreshes in the background. |
| `apps/web/src/components/dashboard/dashboard-profile-view.tsx` | Same for the profile page preview. |
| `apps/web/src/lib/profile/update-profile-action.ts` | Still available. Strips diagnostics before returning. Editor no longer calls it. |

## Security

| File | Change |
|---|---|
| `apps/web/src/app/api/auth/sign-out/route.ts` | Rejects requests that fail `isSameOriginMutation` before `signOut`. |
| `docs/API_ROUTE_SECURITY_MATRIX.md` | Rows for `/api/profile` and `/api/auth/sign-out`. |
| `docs/CSRF_POSTURE.md` | Same routes listed as cookie mutations. |
| `apps/web/src/lib/security/csrf-posture.contract.test.ts` | Those routes must use the guard. The wildcard assertion now applies to the `serverActions` block, not the image hostname. |
| `apps/web/src/lib/security/secure-api-route-audit.contract.test.ts` | Inventory includes the two routes. `auth/sign-out` was already on disk and missing from the list. |

## Tests executed

| Command | Outcome |
|---|---|
| `npx tsc --noEmit` in `apps/web` | Exit 0 |
| `npx vitest run` in `apps/web` | 1797 passed, 70 failed, 319 files (20 failed) |
| Focused profile, CSRF, and route tests | Passed after the final type fix |

The 70 failures were inspected by message. They are existing source-contract and admin-mock drift (`enforceAdminRateLimit` missing from mocks, stale `htmlFor` / `break-all` / `pdfjs-dist` expectations). They are not in the new profile-save tests. They were not "fixed" by editing expectations to match unrelated UI.

Not run: production `next build`, Playwright, live RLS, `EXPLAIN`, browser save on the MVP URL.

## Rollback

Revert the editor to `useActionState(updateProfileAction)` and stop routing saves to `POST /api/profile`. The database shape is unchanged, so no down migration is required. In-flight editors that already loaded the new bundle would 404 the API if the route were removed first; revert the client and the route together.

## Outstanding risks

- Background `router.refresh()` can still be slow. It must not be folded back into the button's pending state.
- A cached client that still calls `updateProfileAction` keeps the old wait until it reloads.
- 409 handling asks the user to reload. Two tabs editing at once will not merge fields.
- Live p95 is unknown until `[profile-update]` is read on the deployment.

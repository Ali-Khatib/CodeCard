# Security and RLS audit

Scope: profile save, the new route, and issues confirmed while tracing it. This is not a full penetration test.

## Findings

| Item | Severity | Evidence | Status |
|---|---|---|---|
| Profile save waited on a dashboard render | High, user-facing | `useActionState` plus `revalidatePath('/dashboard')` while Home and the shell are dynamic | Resolved for the editor. See `SAVE_PERFORMANCE_REPORT.md`. |
| Stale editor could overwrite a newer save | Medium, integrity | Update had no `updated_at` check | Resolved. Mismatch or zero-row update returns 409 and does not report success. |
| `POST /api/profile` is a cookie mutation | High if CSRF is missing | New route | Resolved. `isSameOriginMutation` runs before auth and the write. Covered by `route.test.ts` and the CSRF contract. |
| Idle `POST /api/auth/sign-out` had no origin check | Low (logout CSRF) | `sign-out/route.ts` called `signOut({ scope: 'global' })` for any caller who could send the cookie | Resolved. Same-origin required. SameSite=Lax still sends cookies on a cross-site form POST, which is why the check matters. |
| Profile update allowlist | — | `pickAllowedProfileUpdate` drops ownership and `is_public` | Already true. Tests cover a forged `owner_user_id` in the form. |
| Owner update RLS | — | `profiles_update` uses `owner_user_id = auth.uid()`. Omitted `WITH CHECK` falls back to `USING` in PostgreSQL. | Holds in migrations. Not re-tested against a live database in this session. |
| Service role in the browser | — | `createServiceClient` lives in a `server-only` module | No change. |
| Duplicate permissive `SELECT` policies on `profiles` | Suspected, not measured | `profiles_public_select` and `profiles_mvp_public_select` | Left in place. Do not drop without `EXPLAIN` and a check that both are still required. |
| Image optimizer allows `*.vercel.app` | Low / suspected | `next.config.ts` `images.remotePatterns` | Not changed. The CSRF contract now checks the `serverActions` block only, so this hostname is not mistaken for an allowed Server Action origin. |
| Profile save is not rate-limited | Accepted | Server Action was not rate-limited either. Upstash's 1500 ms budget would stall the save. | Documented. Abuse is still bounded by an authenticated owner writing one row. |
| Redis outage | — | Non-strict limiters fail open. `auth`, `upload`, and `ai` fail closed in production. | Unchanged. Profile save does not call Redis. |

## Tests run for this area

- `src/app/api/profile/route.test.ts` — cross-site 403, signed-out 401, conflict 409, no diagnostics in the body.
- `src/lib/profile/profile-update-core.test.ts` — unauthenticated, missing profile, slug clash, forged ownership fields, stale version, zero-row update.
- `src/lib/security/csrf-posture.contract.test.ts` — profile and sign-out routes must call `isSameOriginMutation`.
- `src/lib/security/secure-api-route-audit.contract.test.ts` — route inventory includes `profile/route.ts` and `auth/sign-out/route.ts`.

Adversarial tests against a live second user were not run. The unit tests mock Supabase. RLS still has to hold in Postgres; the application filter is `owner_user_id = auth.uid()` on the read and the update.

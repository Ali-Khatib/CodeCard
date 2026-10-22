# Architecture map

## Applications

- `apps/web` — Next.js 16 App Router, React 19, TypeScript, Tailwind. Package manager: npm workspaces (`packageManager` npm 10.9.0). Scripts: `dev`, `build`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`).
- `apps/mobile` — Expo / React Native companion. Not part of the save path.
- `packages/config`, `packages/types`, `packages/validation`, `packages/ui`, `packages/analytics`.

## Request path for a signed-in page

`apps/web/src/proxy.ts` gates `/`, `/dashboard/:path*`, `/admin/:path*`, and the auth pages. It calls Supabase `getUser()` when a session cookie is present. It does not run for `/api/*`.

Dashboard UI:

- `app/dashboard/layout.tsx` — theme and backdrop only.
- `app/dashboard/(authenticated)/layout.tsx` — user, shell profile columns, Circle unread, profile completion.
- `app/dashboard/(authenticated)/page.tsx` — Home: full profile columns, completion, schedule, links, connection count.
- `app/dashboard/(authenticated)/profile/page.tsx` — same profile columns plus links, rendered by `ProfileEditorScreen`.

## Profile save (after this change)

```text
Save changes
  -> profile-editor handleSubmit (client validation, submit lock)
  -> POST /api/profile  (same-origin, session getUser, no proxy)
  -> executeProfileUpdate
       read profiles by owner_user_id
       skip write when unchanged
       reject stale updated_at
       update by id and updated_at
  -> revalidateOwnedProfileCaches only if a row changed
  -> JSON { success, error, fieldErrors, updatedAt }
  -> button shows Saved
  -> parent router.refresh() in the background
```

`updateProfileAction` still exists and still revalidates. The editor no longer calls it. A stale client bundle could still hit the slow action until that bundle is gone.

## Other mutations

Projects, research, connections, calendar, publish, and avatar finalization still use Server Actions and `revalidatePath('/dashboard')`. They can show the same class of delay. They were not rewritten in this pass.

## Supabase clients

`apps/web/src/lib/supabase/server.ts`:

- `createClient` — cookie client, one per request, `getUser` deduped.
- `createPublicClient` — anon, no cookies, for public ISR.
- `createServiceClient` — service role, server-only.

Browser code uses `apps/web/src/lib/supabase/client.ts`. The service role key is not referenced from client components; the server module imports `server-only`.

## Storage

Buckets named in `packages/config`: `avatars`, `project-media`, `private-docs`. Created in `supabase/migrations/20250627000008_storage_buckets_rls.sql`. Upload route: `POST /api/upload` (same-origin, rate-limited, ownership checks). Profile photos do not travel with Save Changes.

## Redis

`apps/web/src/lib/rate-limit.ts`. Used by upload, auth recovery, analytics, connections, admin, and other `secureJsonRoute` callers. Not used by profile save. Missing Redis fails open except `auth`, `upload`, and `ai` in production. A hung call is cut off at 1500 ms. `retry` is 0.

## Billing and mail

Stripe webhook: `POST /api/webhooks/stripe`. Plan copy lives in `packages/config` (`PLANS`). Resend is optional mail (`RESEND_API_KEY` in `.env.example`). Paddle is named in config and was not traced as a live integration.

## Deployment

`apps/web/next.config.ts` sets security headers, image remote patterns, and `experimental.serverActions.allowedOrigins: []`. Sentry wraps the config. `tunnelRoute` is `/monitoring`. Vercel project split (marketing on `main`, MVP on `mvp`) is an operator rule, not something this audit changed.

## Environment names

See `apps/web/.env.example`. Names only: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Stripe keys, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, Sentry DSNs, store URLs, and `CODECARD_E2E_*`. No values are recorded here.

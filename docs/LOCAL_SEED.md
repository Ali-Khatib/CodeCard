# Local development seed (WS14-T020)

Deterministic, idempotent sample data for **approved non-production** Supabase
targets. Never seeds production (`gclteunkzorwaliwhatp`). Never uses the
persistent staging showcase identity (forbidden fixture slug).

## Command

```bash
CODECARD_LOCAL_SEED=1 \
CODECARD_LOCAL_SEED_PASSWORD=<local-only-password> \
npm run db:seed
```

Uses `tsx supabase/seed.ts` (see root `package.json`).

## Required environment

| Variable | Purpose |
|----------|---------|
| `CODECARD_LOCAL_SEED=1` | Deliberate opt-in (required) |
| `CODECARD_LOCAL_SEED_PASSWORD` | Seed user password (required, min 12 chars). **Never logged.** |
| Supabase URL | `CODECARD_LOCAL_SEED_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` |
| Service role | `CODECARD_LOCAL_SEED_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` |

### Allowed targets

1. **Local Supabase CLI** — host `127.0.0.1` / `localhost` / `::1` (default after `npx supabase start`).
2. **Staging MVP** (`zbumnudyvclkmynpqjsr`) — only when `CODECARD_LOCAL_SEED_ALLOW_STAGING=1`.

### Rejected targets

- Production project ref / URL (`gclteunkzorwaliwhatp`)
- Any other remote Supabase project (`unknown_remote_target_forbidden`)
- Missing opt-in or missing password

## What gets seeded

| Item | Value |
|------|--------|
| Email | `local.dev@codecard.local.test` |
| Public slug | `/local-dev` (not `/demo` — that path is an app route) |
| Display name | Local Dev Sample |
| Published project | DevFlow |
| Draft project | Draft Sandbox (not public) |
| Published research | `retrieval-evaluation-for-dev-tools` |
| Draft research | `unpublished-notes` |
| Links | github + website |
| Media | Research `cover_image_url` + project live/repo links (external placeholders; no Storage upload) |

Re-running the script updates the same rows — **no duplicate** projects/research/links for this identity.

## Verify locally

1. `npx supabase start` (or point at an approved target).
2. Apply migrations (`npx supabase db reset` for a clean local DB, then seed).
3. Run `npm run db:seed` with the env above.
4. Sign in at `/sign-in` with the seed email + `CODECARD_LOCAL_SEED_PASSWORD`.
5. Dashboard shows DevFlow + draft project.
6. Public `/local-dev` shows published project/research only.
7. Run seed again — still one of each sample row.

## Cleanup / reset

- **Local:** `npx supabase db reset` drops and recreates the database, then re-run migrations + `npm run db:seed`.
- **Staging (rare):** delete the seed auth user in the Supabase Dashboard, or re-run seed (idempotent upsert). Do **not** delete the persistent staging showcase profile.

## Safety

- No Docker requirement for the seed script itself.
- No hardcoded passwords.
- No production credentials.
- Service-role key stays server-side / CLI-only.

# Connections (WS15)

Internal reference for the real authenticated Connections feature.

## Model

A Connection is a **private directed** relationship:

`authenticated owner user → published target CodeCard profile`

- Not mutual
- Target users cannot see who saved them, which collections they are in, or private notes
- Demo data (`DEMO_CONNECTIONS`, preview `/dashboard/preview/connections`, live Alex Chen demo) is isolated and must never seed authenticated accounts

## Persistence

| Table | Purpose |
|---|---|
| `saved_connections` | Core save + `source`, `connected_at`, `met_at`, `context` |
| `connection_notes` | One private note body per Connection |
| `collections` | Private owner folders |
| `collection_items` | Membership (owned Connection ↔ owned collection) |

Forward-only migrations (manual deploy — do **not** run `supabase db push` from agents):

- `20260717020001_connections_self_guard.sql`
- `20260717031351_connections_collections_hardening.sql`
- `20260717040001_connection_notes_metadata.sql`

## RLS

Owner-only via `owner_user_id = auth.uid()` (and membership checks that both collection and Connection belong to the same owner). FORCE RLS applies.

## Account controls (WS10)

Export and deletion already cover Connections, notes, collections, and memberships. Export includes owner `context` when present.

## UI surfaces

- Public profile: Add / Remove connection (not on own profile; sign-in CTA for anonymous)
- Authenticated `/dashboard/connections`: real list, collections, private notes, search/filter/sort
- Circle remains **out** of authenticated navigation (WS16)

## MVP limits

- No contact importing
- No mutual request/accept
- No recommendations / AI ranking
- No shared collections
- No reminders or messaging
- Client-side search/filter/sort over the owner’s loaded Connections (bounded by `LIMITS.savedConnections`)

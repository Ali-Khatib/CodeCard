# Connections (WS15)

Internal reference for the real authenticated Connections feature.

## Model

A Connection is a **private directed** relationship:

`authenticated owner user → target CodeCard profile`

- Each person has their own row. Scanning does not silently write into the other person’s list.
- After A connects from B’s QR, B gets a pending **scan offer**: “this person just scanned your card.” B can add A, then save where / when / notes / follow-up.
- Demo data (`DEMO_CONNECTIONS`, preview `/dashboard/preview/connections`, live Alex Chen demo) is isolated and must never seed authenticated accounts

## Persistence

| Table | Purpose |
|---|---|
| `saved_connections` | Core save + `source`, `connected_at`, `met_at`, `context` |
| `connection_notes` | One private note body per Connection |
| `connection_scan_offers` | Pending inbound QR handshake (scanned owner) |
| `collections` | Private owner folders |
| `collection_items` | Membership (owned Connection ↔ owned collection) |

Forward-only migrations (manual deploy — do **not** run `supabase db push` from agents):

- `20260717020001_connections_self_guard.sql`
- `20260717031351_connections_collections_hardening.sql`
- `20260717040001_connection_notes_metadata.sql`
- `20260928125647_connection_scan_offers.sql`
- `20260928140000_connection_scan_handshake_rls.sql`

## RLS

Owner-only via `owner_user_id = auth.uid()` (and membership checks that both collection and Connection belong to the same owner). FORCE RLS applies.

## Account controls (WS10)

Export and deletion already cover Connections, notes, collections, and memberships. Export includes owner `context` when present.

## UI surfaces

- Public profile: **Connect from QR** only when the visit carries `?source=qr` (physical CodeCard QR). Otherwise show the in-person principle — never search/add. Remove remains available for existing Connections. Sign-in CTA preserves `?source=qr` after scan.
- Authenticated `/dashboard/connections`: real list, collections, private notes, search/filter/sort of people already connected via QR
- Circle (WS16): feed of work from QR Connections

## Create rule (product invariant)

**Physical QR scan is the only way to create a Connection.** No username/email search, invite links, NFC, LinkedIn import, contact sync, or “Add connection” from a normal profile link. Server rejects any create whose `source` is not `qr`.

## MVP limits

- No contact importing
- No search directory of strangers
- QR scan creates the scanner’s Connection; the scanned owner gets a pending add
- No recommendations / AI ranking / discoverable people
- No shared collections
- No reminders or messaging
- Client-side search/filter/sort over the owner’s loaded Connections (bounded by `LIMITS.savedConnections`)

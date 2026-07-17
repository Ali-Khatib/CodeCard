# Circle (WS16)

Internal reference for the authenticated Circle activity feed.

## Model

Circle is a **private feed projection**:

`authenticated viewer → their Connections → public activity from those profiles`

- Not a global social feed
- Not mutual; actors do not choose who saved them
- Target users cannot see who viewed them through Circle
- Private Connection notes, collections, drafts, billing, and analytics never appear

## Pagination and filters (Batch 2)

- Page size: 20 (max 20)
- Cursor: `{ createdAt, id, filter }` — viewer always from session; Connections re-resolved each request
- Filters: All / Projects / Research / Updates
- Filtered empty: `No Circle updates match this filter.`

## Architecture

**Persisted events + read-time visibility** (`circle_activity`):

1. Trusted server operations emit events after successful publish / meaningful public updates.
2. Feed queries resolve the viewer’s Connections, then return only events whose actor is still a Connection, actor profile is public, and target content is still published.
3. Stable event IDs and chronological ordering (not popularity).

**Circle is a private latest-work feed, not a social engagement platform.**
No likes, reactions, comments, messaging, follower counts, or engagement ranking.

Demo `DEMO_CIRCLE_FEED` remains on preview/Alex Chen surfaces only.

## Event types (Batch 1)

| Type | When |
|---|---|
| `project_published` | First transition draft → published (one per project) |
| `project_updated` | Meaningful public field change while published |
| `research_published` | First transition draft → published (one per paper) |
| `research_updated` | Meaningful public field change while published |

Not emitted: reorder-only, draft saves, analytics counters, private notes, collection/Connection changes, billing, autosave noise, profile_updated (deferred).

## Deduplication

- Publish: `project_published:<id>` / `research_published:<id>` (unique)
- Update: `project_updated:<id>:<fingerprint>` / `research_updated:<id>:<fingerprint>` (identical payload → idempotent)

## Privacy / deletion

| Change | Circle effect |
|---|---|
| Unpublish / make private | Hidden at feed query (target or actor not public) |
| Delete content | Cascade/remove related activity |
| Remove Connection | Actor’s events disappear from that viewer’s feed |
| Actor account deleted | Actor activity cascades with profile |
| Viewer account deleted | Viewer Connections gone; no viewer-specific Circle state in Batch 1 |

## Account controls (WS10)

- **Export:** actor-owned `circle_activity` rows for the requesting owner
- **Deletion:** actor-owned activity removed with profile/content cascade; viewer has no separate Circle state yet

## Migrations

Forward-only (manual deploy — do **not** run `supabase db push` from agents):

- `supabase/migrations/20260717034827_circle_activity.sql`

## MVP limits (Batch 1)

- No reactions, comments, messaging
- No manual social posts
- No Circle notifications / read state (Batch 2)
- No trending / recommendations
- Bounded page size with cursor-ready contract

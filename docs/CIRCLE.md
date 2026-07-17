# Circle (WS16)

Internal reference for the authenticated Circle activity feed.

## Model

Circle is a **private feed projection**:

`authenticated viewer → their Connections → public activity from those profiles`

- Not a global social feed
- Not mutual; actors do not choose who saved them
- Target users cannot see who viewed them through Circle
- Private Connection notes, collections, drafts, billing, and analytics never appear

## Private read state (Batch 2)

- Table: `circle_viewer_state` (`viewer_user_id`, `last_seen_at`)
- Owner-only RLS; actors never see viewer reads
- Deliberate visible Circle visit marks seen after successful load
- Nav badge: real bounded unread count (`9+` cap); never demo values

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

## Deduplication and grouping (Batch 2)

- Publish: unique `project_published:<id>` / `research_published:<id>` (idempotent)
- Update: one row per target via `project_updated:<id>` upsert (latest meaningful update wins)
- Feed also collapses duplicate update cards for the same actor+target
- Reorder / no-op / draft / notes / collections → no activity
- Republish after unpublish: same publish dedupe key (idempotent restore visibility)
- Fingerprints still gate emit (meaningful change required); they are not part of the update dedupe key

## Privacy / deletion

| Change | Circle effect |
|---|---|
| Unpublish / make private | Hidden at feed query (target or actor not public) |
| Delete content | Cascade/remove related activity |
| Remove Connection | Actor’s events disappear from that viewer’s feed |
| Actor account deleted | Actor activity cascades with profile |
| Viewer account deleted | Viewer Connections gone; `circle_viewer_state` removed |

## Account controls (WS10)

- **Export:** actor-owned `circle_activity` + viewer-owned `circle_viewer_state.last_seen_at`
- **Deletion:** actor activity cascades; viewer read state deleted with account

## Migrations

Forward-only (manual deploy — do **not** run `supabase db push` from agents):

- `supabase/migrations/20260717034827_circle_activity.sql`
- `supabase/migrations/20260717080001_circle_viewer_state.sql`

## MVP limits / excluded features

**Circle is a private latest-work feed, not a social engagement platform.**

Excluded (do not implement):

- likes, reactions, comments, replies
- direct messages
- follower counts / follow requests
- public popularity metrics / engagement scores
- reposts / manual social posts
- trending / recommendations / sponsored activity
- creator rankings
- public read receipts / “X people saw this in Circle”
- notifications that someone viewed work

## Batch 2 completion checklist (T005–T008)

| Area | Behavior |
|---|---|
| Pagination | Cursor keyset; page size 20; Load more; Connections revalidated every request |
| Filters | All / Projects / Research / Updates; unknown → All |
| Read state | Private `last_seen_at`; deliberate visible visit; nav badge bounded |
| Quality | Meaningful updates only; per-target update upsert; feed collapse |
| Security | Viewer session only; owner-only RLS; no demo fallback |
| Demo | `DEMO_CIRCLE_FEED` on preview/Alex Chen only |
| E2E | Mocked Playwright fixture (`e2e/circle.spec.ts`); live disposable users when infra available |

## Next workstream

WS11 — security hardening across the complete MVP, including Connections and Circle.

# CodeCard moderation

## Public reporting (WS13-T009)

Visitors and signed-in users can report currently public profiles and projects.
Research is not a supported moderation target in the current schema, and media
does not yet have an independent public-report UI.

The report dialog accepts one allowlisted category:

- spam or misleading content
- harassment or abuse
- impersonation
- copyright concern
- another policy concern

Optional details are trimmed plain text with a 1,500-character limit. The target
type and UUID come from the public page and are not editable form fields.

`POST /api/moderation/report` verifies that the profile is public, or that both
the project and its parent profile are public. Anonymous reports are allowed.
When a valid Supabase session exists, the reporter ID is derived from verified
Auth; it is never accepted from the request body.

The shared CodeCard `moderation` limiter applies a bounded per-source window and
fails closed in production when its configured Redis dependency is unavailable.
Production Upstash behavior has **not** been verified in this task; WS11-T004
production verification remains deferred to WS14-T016.

Obvious same-source, same-target, same-category repeats within a bounded window
are deduplicated using an HMAC source token. Complete IP addresses are not stored.
Inserted and deduplicated submissions return the same accepted response. Public
responses never include report counts, report status, other reporters, or
moderator decisions.

Alex Chen demo pages do not render report controls because they receive no real
production target IDs. Demo interactions therefore cannot write moderation data
or consume the moderation rate limit.

Valid reports appear only in the server-authorized admin moderation list.
Submitting a report does not automatically hide content and does not create an
administrator audit event. Later administrator resolve, dismiss, hide, suspend,
and note mutations use the immutable WS13-T008 audit mechanism.

Coverage includes deterministic API/service/migration contracts and a headless
Playwright dialog flow (desktop and mobile projects). The browser flow mocks the
report response and creates no backend fixture requiring cleanup.

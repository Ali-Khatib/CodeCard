# WS12-T012 Responsive forms QA matrix

Widths: **375 / 390 / 414 / 430** CSS px. Automated coverage lives in `apps/web/e2e/responsive-forms.spec.ts`.

| Flow | 375 | 390 | 414 | 430 | Text ×200% | Keyboard | Automated | Manual visual | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sign in | passed automatically | passed automatically | passed automatically | passed automatically | passed automatically | not run | yes | not run | Long validation covered |
| Sign up | passed automatically | passed automatically | passed automatically | passed automatically | not run | not run | yes | not run | Long display name covered |
| Forgot password | passed automatically | passed automatically | passed automatically | passed automatically | not run | not run | yes | not run | |
| Reset password | not run | not run | not run | not run | not run | not run | no | not run | Same auth shell as forgot |
| Dashboard overview preview | passed automatically | passed automatically | passed automatically | passed automatically | not run | not run | yes | not run | |
| Settings preview | passed automatically | passed automatically | passed automatically | passed automatically | not run | not run | yes | not run | |
| Projects list preview | passed automatically | passed automatically | passed automatically | passed automatically | not run | not run | yes | not run | Create/edit require auth |
| Research list preview | passed automatically | passed automatically | passed automatically | passed automatically | not run | not run | yes | not run | Create/edit require auth |
| Connections / Circle preview | passed automatically | passed automatically | passed automatically | passed automatically | not run | not run | yes | not run | |
| Account delete dialog | passed automatically | passed automatically | passed automatically | passed automatically | not run | not run | yes (fixture) | not run | Internal scroll via `max-h` + `overflow-y-auto` |
| Public report dialog | passed automatically | passed automatically | passed automatically | passed automatically | not run | not run | yes (fixture) | not run | |
| Profile editor | not run | not run | not run | not run | not run | not run | no | not run | Requires auth; preview `/profile` redirects |
| Project create/edit | not run | not run | not run | not run | not run | not run | no | not run | Requires auth session |
| Research create/edit + alt field | not run | not run | not run | not run | not run | not run | no | not run | Requires auth; alt field covered by T009 unit tests |
| Admin moderation dialogs | not run | not run | not run | not run | not run | not run | no | not run | Requires admin session |
| DMCA page | not run | not run | not run | not run | not run | not run | no | not run | Contact/email instructions only (no live form) |

## Residual limitations

- Authenticated project/research/profile editors are not exercised in this headless matrix without seeded sessions.
- Manual visual QA and screen-reader QA were **not** performed in this batch.
- Global `html, body { overflow-x: clip }` remains a pre-existing layout guard; T012 assertions still fail if document scrollWidth exceeds the viewport, so clipping alone cannot hide matrix failures.
- WS12-T011 axe-in-CI remains deferred pending WS14 Playwright CI infrastructure.

## Virtual keyboard

Not automatically tested. Forms use 16px+ control text to reduce iOS focus-zoom; sticky chrome uses safe-area scroll margins from Batch 1.

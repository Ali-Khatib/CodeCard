# Public profile performance (WS14-T019)

Goal: mobile Lighthouse **LCP < 2.5s** on a representative public profile URL.

## Measurement

```bash
# From repo root (writes gitignored JSON under apps/web/)
node apps/web/scripts/lighthouse-public-profile.mjs https://codecard-mvp.vercel.app/alex-chen
```

Script exits non-zero if LCP ≥ 2500ms.

## Optimizations applied

- Hero / avatar render without `opacity: 0` motion gates
- First project poster: `AppReveal eager` + `Image priority`
- Cookie-free `createPublicClient()` for public profile data so `revalidate = 60` can cache
- Connection/auth control hydrates on the client
- Cyber theme fonts: `preload: false`
- `parseHeadline` extracted to avoid pulling canvas badge code into the profile client chunk

## Evidence

Record operator, URL, LCP ms, and commit SHA in the launch checklist when verifying a deployment.

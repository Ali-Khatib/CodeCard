# Public profile performance (WS14-T019)

Goal: mobile Lighthouse **LCP < 2.5s** on a representative public profile URL.

## Measurement

```bash
# From repo root (writes gitignored JSON under apps/web/)
node apps/web/scripts/lighthouse-public-profile.mjs https://codecard-mvp.vercel.app/alex-chen
```

Script exits non-zero if LCP ≥ 2500ms. Do **not** weaken this budget.

## Optimizations applied

- Hero / avatar render without `opacity: 0` motion gates
- First project poster: `priority` + `fetchPriority="high"` (no AppReveal/motion on stack)
- Cyber theme fonts: `preload: false`; Inter uses `display: optional` to avoid late text LCP
- `parseHeadline` extracted to avoid pulling canvas badge code into the profile client chunk
- Cookie-free `createPublicClient()` for public profile load + metadata so `revalidate = 60` ISR can cache anonymous HTML
- `unstable_cache` with **per-slug tags** (`public-profile-slug:{slug}`); mutations call `revalidateTag` + `revalidatePath`
- `dynamic = 'force-static'` + `generateStaticParams` for `alex-chen` + `dynamicParams = true`
- No route `loading.tsx` skeleton on `/[slug]` (skeleton-first paint delayed LCP text)
- Root layout: no ThemeRoot / ProjectOpenProvider / visitor-conversion prompt
- Marketing/dashboard own ThemeRoot (+ conversion prompt on those shells only)
- Connection / report chrome deferred after idle; copy/QR stay light client islands
- Below-fold project stack / research / save card are dynamic imports
- Vercel Analytics / Speed Insights load after idle (`DeferredVercelTelemetry`)
- Above-fold identity + bio rendered as a Server Component shell
- Profile analytics uses `requestIdleCallback` (bounded timeout)

## Cache correctness

- Unknown public slugs remain resolvable (`dynamicParams = true`)
- Cache keys and tags are slug-scoped — no cross-tenant reuse
- Publish/edit/unpublish/delete paths call `revalidatePublicProfile` (tag + path)
- Time-based `revalidate: 60` is the fallback if a mutation path misses invalidation

## Evidence

Record operator, URL, LCP ms, and commit SHA in the launch checklist when verifying a deployment.

# Interactive Scrolling — Implementation Spec

> Core product requirement. Sources are ingredients, not copy-paste libraries.

## Design source roles

| Source | CodeCard use |
|--------|----------------|
| [Patterns.dev](https://www.patterns.dev/) | RSC, code-splitting, lazy hydration, list perf |
| [React Bits](https://reactbits.dev/) | Scroll Stack / Scroll Reveal concepts — custom audit |
| [Devouring Details](https://devouringdetails.com/) | Timing, sequencing, interruption, when to omit motion |
| [Interface Craft](https://www.interfacecraft.dev/) | Quality bar: restraint, anticipation, considered UI |
| [Aceternity UI](https://ui.aceternity.com/) | Parallax/beam ideas — rewritten for mobile 60fps |
| [Refero Styles](https://styles.refero.design/) | DESIGN.md tokens for Cursor/Claude |
| [Mobbin](https://mobbin.com/) | Full flows: onboarding, create, pay, connections |
| [Recent Design](https://recent.design/) | Visual direction validation |
| [10x](https://www.10x.app/) | AI import/build inspiration — not UI substrate |

## Stack

| Layer | Tool |
|-------|------|
| Scroll choreography | **GSAP ScrollTrigger** (proximity measure, scrub) |
| Shared-element + FLIP | **Motion for React** (`layoutId`, `layout`, `AnimatePresence`) |
| GPU properties | `transform`, `opacity` only — no layout-thrashing props |
| Video lifecycle | **IntersectionObserver** + proximity threshold (0.62) |
| Route transition | **View Transitions API** + `router.push` progressive enhancement |
| Reduced motion | Crossfade only; no autoplay video; scale locked to 1 |

## Scroll behavior (implemented in `FeaturedWorkStack`)

1. Cards enter at **0.92 scale** with poster image
2. Scroll position drives **scale**, **border-radius**, **opacity** toward viewport center
3. At **≥62% proximity**: card active → poster crossfades to **muted looped video**
4. **One video plays** at a time; others pause retaining frame
5. Active card **breathes** via GSAP on inner wrapper — scroll transform on outer (scroll wins)
6. **Open**: Motion `layoutId` hero/title/tagline + View Transition API
7. **Filter**: Motion `layout` + `popLayout` FLIP reorder
8. **No scroll hijacking** — native wheel/touch/momentum preserved
9. **Keyboard**: Enter/Space opens project; focus ring visible

## Files

```
apps/web/src/components/featured-work/
  featured-work-stack.tsx   # orchestration + FLIP filter
  scroll-project-card.tsx   # GSAP proximity + video
  project-filter.tsx        # domain/focus filter
  project-detail-view.tsx   # shared-element destination
apps/web/src/lib/projects/featured.ts
apps/web/src/hooks/use-view-transition-navigate.ts
```

## Performance targets

- 60 FPS scroll on mid-tier mobile
- Poster-first; video `preload=metadata` only when proximity > 0.3
- `will-change: transform` on active cards only
- No CLS from animation (fixed aspect-ratio media containers)

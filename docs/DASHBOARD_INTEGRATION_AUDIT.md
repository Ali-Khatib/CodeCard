# Dashboard integration audit (WS09-T001)

**Date:** 2026-07-16  
**Branch context:** `mvp` after WS08-T012  
**Purpose:** Inventory authenticated dashboard surfaces as real, preview/demo, partial, out-of-scope, or blocked — based on code paths, not filenames alone.

This document does **not** claim WS09 is complete. Remaining WS09 tasks after Batch 1 include T006–T012.

---

## Navigation source of truth

Canonical authenticated/preview shell: `apps/web/src/components/dashboard/dashboard-shell.tsx` → `NAV_ITEMS`.

| Segment | Auth href | Label | Classification | WS09 action |
|---|---|---|---|---|
| `''` | `/dashboard` | Home | Partial → wire (T003) | Wire real project/research summaries; keep real analytics from WS08 |
| `profile` | `/dashboard/profile` | Profile | Real | Keep |
| `projects` | `/dashboard/projects` | Projects | Real (verify CRUD nav T004) | Keep / verify |
| `research` | `/dashboard/research` | Research | Partial (CRUD real; `#` public fallback; hard-coded `/dashboard` paths) | Keep / wire (T005) |
| `circle` | `/dashboard/circle` | Circle | Out of MVP scope (demo feed) | Hide/remove from MVP nav (T002) |
| `analytics` | `/dashboard/analytics` | Analytics | Real (WS08) | Keep / verify later (T006) |
| `connections` | `/dashboard/connections` | Connections | Out of MVP scope (demo list) | Hide/remove from MVP nav (T002) |
| `settings` | `/dashboard/settings` | Settings | Partial (email + sign-out + billing link; stub rows/`demoAction`) | Keep label; defer real account actions (T008 / WS10) |

Billing is reachable at `/dashboard/billing` but is **not** a `NAV_ITEMS` entry (linked from Settings). Classification: real Stripe checkout/portal — verify later (T009).

---

## Surface inventory

### Home / Overview

| Field | Detail |
|---|---|
| Route | `/dashboard` |
| Component | `dashboard-overview-view.tsx` via `(authenticated)/page.tsx` |
| Data | Real profile, links, completion, `loadOwnerAnalytics` reach KPIs |
| Mutations | Share hero uses real QR/copy/share (WS07); no demo activity mutations |
| Values | Real (WS08-T008); `activity={[]}` empty, not sample |
| Gaps | No project/research totals or recent lists on overview |
| MVP status | Partial |
| WS09 action | Wire (T003) |

### Profile

| Field | Detail |
|---|---|
| Route | `/dashboard/profile` (+ `/dashboard/profile/preview`) |
| Data / mutations | Real profile editor and owner published preview |
| MVP status | Real |
| WS09 action | Keep |

### Projects

| Field | Detail |
|---|---|
| Routes | `/dashboard/projects`, `/dashboard/projects/new`, `/dashboard/projects/[id]/edit` |
| Components | `dashboard-projects-portfolio.tsx`, create/edit forms |
| Data | Owner `projects` (+ media/links/orderings) |
| Mutations | Real create/update/delete/publish/reorder |
| MVP status | Real |
| WS09 action | Verify CRUD navigation from list (T004) |

### Research

| Field | Detail |
|---|---|
| Routes | `/dashboard/research`, `/dashboard/research/new`, `/dashboard/research/[id]/edit` |
| Component | `dashboard-research-view.tsx` |
| Data | Owner `research_papers` (+ figures) |
| Mutations | Real create/update/delete/publish/reorder |
| Gaps | Public card may `href="#"` without slug; create/edit links hard-coded to `/dashboard/...` (breaks preview basePath; auth OK) |
| MVP status | Partial → wire |
| WS09 action | Wire (T005) |

### Analytics

| Field | Detail |
|---|---|
| Route | `/dashboard/analytics` |
| Data | `loadOwnerAnalytics` + `loadOwnerAnalyticsTrends` only |
| Demo | Must not import `buildAnalyticsData` (WS08 isolation) |
| MVP status | Real |
| WS09 action | Verify later (T006) |

### Circle

| Field | Detail |
|---|---|
| Route | `/dashboard/circle` |
| Data | `DEMO_CIRCLE_FEED` from `circle-demo.ts` |
| Mutations | None (buttons without real hrefs) |
| MVP status | Out of scope / demo |
| WS09 action | Hide from authenticated MVP nav (T002); preview route may remain |

### Connections

| Field | Detail |
|---|---|
| Route | `/dashboard/connections` |
| Data | `DEMO_CONNECTIONS` from `workspace-demo.ts` |
| Mutations | Fake follow-up async sleep |
| MVP status | Out of scope / demo |
| WS09 action | Hide from authenticated MVP nav (T002); preview route may remain |

### Settings

| Field | Detail |
|---|---|
| Route | `/dashboard/settings` |
| Real | Session email, sign-out action, link to billing |
| Demo/stub | Username/plan/session rows; `demoAction` fake delays |
| MVP status | Partial |
| WS09 action | Defer account APIs (T008 / WS10) |

### Billing

| Field | Detail |
|---|---|
| Route | `/dashboard/billing` |
| Data / mutations | Real subscription row + Stripe Checkout / Customer Portal |
| MVP status | Real (nav secondary) |
| WS09 action | Verify later (T009) |

### Shell notifications

| Field | Detail |
|---|---|
| Surface | Top bar `DashboardNotifications` |
| Data | `DEMO_NOTIFICATIONS` |
| MVP status | Preview-demo embedded in auth shell |
| WS09 action | Defer (not Batch 1); do not treat as real inbox |

### Explicit preview workspace

| Field | Detail |
|---|---|
| Routes | `/dashboard/preview`, `/projects`, `/research`, `/circle`, `/analytics`, `/connections`, `/settings` |
| Data | Demo modules / `buildAnalyticsData` |
| MVP status | Allowed explicit preview |
| WS09 action | Keep isolated; do not use as authenticated fallback |

### Sharing

| Field | Detail |
|---|---|
| Surfaces | Overview `ProfileShareHero`; profile editor share; QR helpers |
| MVP status | Real (WS07) |
| WS09 action | Verify on overview later (T007) |

---

## Authenticated demo-import audit (production paths)

| Import | Where (authenticated) | Deceptive? |
|---|---|---|
| `DEMO_CIRCLE_FEED` | `/dashboard/circle` | Yes — nav presents as real |
| `DEMO_CONNECTIONS` | `/dashboard/connections` | Yes — nav presents as real |
| `DEMO_NOTIFICATIONS` | Shell notifications | Mild — not a nav tab |
| `workspace-demo` types | Overview activity type only | No values after WS08-T008 |
| `buildAnalyticsData` | **Not** on authenticated analytics | OK (WS08-T011) |
| Preview sample stats | Preview home only | OK if isolated |

---

## Dependent workstreams

| Gap | Dependency |
|---|---|
| Real Circle / social graph | Future product; not MVP |
| Real Connections CRM | Future product; not MVP |
| Account export / delete / full settings | WS10 + WS09-T008 |
| Analytics tab verification | WS09-T006 |
| Overview share verification | WS09-T007 |
| Billing verification | WS09-T009 |
| Optimistic nav / mobile QA | WS09-T010 / T011 |
| Global mutation toasts | WS09-T012 |

---

## Batch 1 intended outcomes

1. **T001** — This inventory (complete).
2. **T002** — Remove Circle and Connections from active MVP `NAV_ITEMS` (preferred); leave preview routes intact.
3. **T003** — Overview shows real project/research summaries without demo fill.
4. **T004** — Projects tab CRUD navigation verified/fixed if gaps.
5. **T005** — Research tab CRUD navigation verified/fixed (`#` fallback, consistent paths).

---

## Honest statement

Home reach analytics and authenticated analytics are already real (WS08). Circle and Connections remain demo-only behind enabled nav labels until T002. Overview still lacks real project/research inventory cards until T003. Project/research CRUD pages exist; Batch 1 focuses on truthful nav and list→CRUD reachability, not reimplementing editors.

# CodeCard Design System

> The shared design contract for engineers, designers, and AI tooling.
> Inspired by Patterns.dev (architecture), Devouring Details (interaction craft), Interface Craft (timeless care), and Refero-style codification.

## Brand essence

**Tagline:** Share what you build.

CodeCard is the modern identity for technical professionals. It doesn't diminish achievements — it changes the order. Work-first, credentials later. Premium, editorial, dark-first.

**The first 30 seconds answer only:**
1. Who are you?
2. What have you built?

See `PRODUCT.md` for the full product brief.

## Two experiences

| Visitor (web) | CodeCard user (app) |
|---------------|---------------------|
| QR/NFC → instant premium web | Native open, save, notes, collections |
| No app, no sign-up | Living contact cards with met-at metadata |
| Featured Work immediately | Professional networking companion |

Browser showcases work. App maintains relationships.

## Visual tone

- **Dark-first** — background `#09090b`, cards `#18181b`, borders `#27272a`
- **Premium** — generous whitespace, restrained typography, intentional motion
- **Editorial** — strong hierarchy, featured work as hero content
- **Restrained** — no chaotic backgrounds, no motion for motion's sake

## Color system

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#09090b` | Page backgrounds |
| `foreground` | `#fafafa` | Primary text |
| `card` | `#18181b` | Cards, elevated surfaces |
| `border` | `#27272a` | Dividers, card borders |
| `muted` | `#71717a` | Secondary text |
| `accent` | `#8b5cf6` | CTAs, links, focus rings |
| `accent-hover` | `#a78bfa` | Hover states |

Semantic: `emerald-400` for success/published, `amber-400` for draft/warning, `red-400` for errors.

## Typography

- **Sans**: Geist Sans — headings, body, UI
- **Mono**: Geist Mono — code, tech tags

| Scale | Size | Weight | Usage |
|-------|------|--------|-------|
| Display | 48–72px | 700 | Landing hero |
| H1 | 32–40px | 700 | Profile name |
| H2 | 20–24px | 600 | Section headers |
| Body | 16px | 400 | Default text |
| Small | 14px | 400 | Metadata, captions |
| Overline | 12px | 500 | "FEATURED WORK" labels |

## Spacing scale

4px base: `1=4, 2=8, 3=12, 4=16, 6=24, 8=32, 10=40, 12=48, 16=64, 20=80, 24=96`

Public profile max-width: `672px` (max-w-3xl). Dashboard max-width: `1152px` (max-w-6xl).

## Motion rules

### Target: Featured Work scroll (post-MVP polish)

- Cards begin as still poster images
- Near viewport center: card enlarges, borders expand fluidly
- Active card: poster crossfades to looped video; subtle breathe animation
- Preload next video optimistically
- **MVP fallback:** poster + hover scale; video on detail page only

### Target: Card → project page (post-MVP)

- Non-selected cards fade and slide off-screen
- Selected card expands to full viewport
- Hero video scales to page background
- Title, tagline, tech logos stagger in
- **MVP fallback:** standard route transition with shared element where possible

### General

- **Public profile**: subtle fade-in (`0.5s ease-out`), slide-up on project cards
- **Dashboard**: minimal — no decorative animation
- **Easing**: ease-out entrances; custom spring for card focus (iOS-like)
- **Loading**: black screen ~200ms max before profile fade-in on QR/NFC opens
- **Never**: chaotic particles, motion-only meaning

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

All non-essential motion must degrade gracefully.

## Card system

**Project card** (public):
- `rounded-2xl`, `border border-zinc-800`, `bg-zinc-900/40`
- Aspect-video media area with poster image
- Title → tagline → tech badges
- Hover: border lightens, subtle shadow, title shifts to accent

**Dashboard card**:
- Quieter — no hover scale, functional layout
- Status badges for published/draft

## Layout principles

### Public profile
1. Avatar + name + headline (centered, minimal)
2. Primary links (pill buttons)
3. **Featured Work** (immediate, no scroll required for first project on mobile)
4. About/bio (below the fold)
5. Footer attribution

### Dashboard
- Left-nav or top-nav on desktop
- Overview cards → action buttons
- Forms: single column, max-w-xl

### Mobile app
- Tab bar: Connections, Collections, Settings
- Dark theme matching web
- No in-app purchase UI

## Form language

- Inputs: `rounded-lg`, `border-zinc-700`, `bg-zinc-900`, violet focus ring
- Labels: `text-sm font-medium text-zinc-200`
- Errors: `text-sm text-red-400` below field
- Buttons: primary violet, secondary zinc, outline bordered

## Icon language

- Lucide-style line icons (when added)
- 20px default, 16px inline
- `text-zinc-400` default, `text-violet-400` active

## Surface examples

### Public profile
Dark background. Centered identity only:
`[Photo] Name / Headline / GitHub • LinkedIn • Website • Resume`

No bio, timeline, education, or experience at top. **Featured Work** immediately below.

Optional `Filter ▼` for domains and focus areas — collapsed by default.

### Dashboard
Muted header. Metric cards in 3-column grid. Clear CTAs: Edit profile, Manage projects, View public profile.

### Mobile
Sign-in screen centered. Saved connections as bordered cards. Settings note about web-only billing.

## Do's

- Put work above credentials
- Use poster + optional looped video for project heroes
- Validate everything server-side
- Respect `prefers-reduced-motion`
- Keep public pages fast (SSR, lazy media)
- Use semantic HTML and focus states

## Don'ts

- Don't clone Aceternity UI wholesale — selective inspiration only
- Don't add LinkedIn-style timelines to v1
- Don't require transparent alpha video
- Don't put billing CTAs in the mobile app
- Don't use motion as the only way to convey information
- Don't expose secrets via `NEXT_PUBLIC_` env vars

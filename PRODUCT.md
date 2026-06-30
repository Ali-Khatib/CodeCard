# CodeCard Product Brief

> Canonical product vision — Ali Khatib, June 21, 2026  
> CodeCard doesn't diminish achievements. It simply prioritizes showcasing your work first.

## Tagline

**Share what you build.**

## Vision

CodeCard is the modern identity for technical professionals.

- Not a portfolio.
- Not a résumé.
- Not a GitHub replacement.

It connects everything into one premium, mobile-first experience that makes your work easy to discover, understand, and remember.

## Philosophy

### Who is CodeCard for?

**If you build things, CodeCard is for you.**

Students, developers, researchers, AI engineers, founders, freelancers, designers, cybersecurity engineers — anyone with work worth sharing.

It doesn't matter where you studied or where you've worked. What matters is that you've built something worth sharing.

### The first 30 seconds

Every CodeCard answers only two questions:

1. **Who are you?**
2. **What have you built?**

Everything else comes later.

### The order matters

CodeCard is not about replacing résumés, universities, or companies. Those accomplishments remain valuable.

CodeCard simply **changes the order**.

Instead of introducing yourself through credentials first, you introduce yourself through the things you've built. Your work becomes the conversation starter.

If someone wants to know where you studied, they'll find it. If someone wants to know where you've worked, they'll find it.

**But first — they'll see what you've built.**

## Two experiences

### Experience 1 — Visitor (no app)

Someone taps NFC or scans QR.

Within one second:

- Phone vibrates (haptic on supported devices)
- Premium mobile web opens instantly
- Smooth black loading screen (~200ms)
- Profile fades into view
- Featured Work appears immediately
- Feels native, even from the browser

No app download. No account. No sign-up. No browser clutter. No opening GitHub, LinkedIn, and portfolio separately.

**One beautiful place to understand what you've built.**

### Experience 2 — CodeCard user (app installed)

- CodeCard opens natively
- Profile loads with native animations
- Save profile with one tap
- Private notes
- Organize into collections
- View later without scanning again

Every saved profile becomes a **living contact card**.

**Connection metadata:** connected date, met at (summit, career fair, hackathon, etc.), source (QR, NFC, link).

**The browser showcases work. The app builds and maintains professional relationships.**

## Public profile structure

Opens immediately:

```
[Photo]  Ali Khatib
         AI Engineer @ Company
         GitHub • LinkedIn • Website • Resume ↓
```

Nothing else at the top. No long bio. No timeline. No education. No experience.

**The work begins immediately.**

## Featured Work

Projects ordered strongest → weakest. Each project is a large interactive card:

- Project title
- Hero image
- Hero video (looped; transparent alpha is a post-MVP enhancement)
- One-line tagline

### Scroll animation (target experience)

- Cards start as still images
- As a card nears center: smooth enlargement, liquid-like borders
- Still image → playing video on the active card
- Active card gently breathes
- Optimistic video preload

### Open project (target experience)

One continuous animation:

- Other cards fade and slide off-screen
- Selected card expands into full page
- Hero video becomes page background
- Title enlarges, subtitle fades in
- Tech logos animate in sequence
- Description and content reveal on scroll

**The card should feel like it transforms into the page.**

### Project page contents

- Hero video
- Description
- Technologies
- Screenshots
- Architecture diagram (optional)
- GitHub / research paper / additional resources

### Filtering

Small `Filter ▼` above Featured Work. Most visitors won't need it — best work shown by default.

**Domains** (broad): AI, Mobile, Computer Vision, Research, Cybersecurity, Cloud…  
**Focus areas** (specific): Emotion Recognition, NLP, Object Detection, OCR, LLMs, RAG…

Projects can belong to multiple domains and focus areas. Filtering reorganizes with smooth animation.

## Creating projects

Should feel effortless — like importing, not building a portfolio. **Under five minutes.**

### Free tier

Guided flow: name → GitHub link (optional) → description → technologies → hero media → publish

### Pro tier

Paste public GitHub repo → auto-import title, README, description, technologies, languages, topics, links. User reviews and edits.

### Hero media (three paths)

1. **Upload** — own image or video
2. **AI Generate (Pro)** — analyze repo; use screenshots/GIFs/demos if available, else premium static hero
3. **Guided Recorder (Pro)** — walk through recording a demo; auto trim, stitch, loop, optimize

## Sharing

QR code, link, Apple/Google Wallet, email signature, resume, social profiles. Physical NFC card is the fastest opener — not the product itself.

## CodeCard App

**Only the owner needs the app for editing.** Visitors never install anything.

Owners: edit profile, manage projects, upload media, reorder, configure filters, manage links, analytics, NFC cards.

### Connections

Save contacts permanently, private notes, collections, connection metadata.

### Analytics

**Free:** profile views, project views  
**Pro:** avg viewing time, resume downloads, GitHub/website clicks, visitor insights, premium analytics

## Pro features

- Unlimited projects
- Custom domain
- Premium themes
- Custom animations
- Remove branding
- AI project summaries
- Resume hosting
- Visitor insights
- Premium analytics
- NFC management
- Early access

## Design principles

- Mobile-first
- Premium by default
- Every animation has a purpose
- Nothing snaps — everything flows
- Simplicity over features
- Quality over quantity
- **The work always comes first**

## Long-term goal

Become the standard digital identity for people who build things.

Instead of *"Here's my LinkedIn"* → **"Here's my CodeCard."**

## MVP vs vision (current build)

| Vision | MVP status |
|--------|------------|
| Work-first public profile | ✅ Built |
| Featured Work cards | ✅ Built (static; motion roadmap below) |
| Visitor instant web open | ✅ SSR + fast load |
| App save/notes/collections | 🔶 Partial (mobile scaffold) |
| NFC / QR | 🔶 Placeholder in settings |
| Scroll-focus card animation | 📋 Post-MVP |
| Card-to-page transform | 📋 Post-MVP |
| Transparent hero video | 📋 Post-MVP (poster + MP4/WebM in MVP) |
| GitHub import (Pro) | 📋 Post-MVP |
| AI hero generate | 📋 Post-MVP |
| Guided recorder | 📋 Post-MVP |
| Custom domain / themes | 📋 Post-MVP |

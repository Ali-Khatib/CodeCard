# Photography — generation prompts

One prompt per slot. Generate each at the stated aspect ratio, save it to the
stated path, then set `src` on that slot in
`apps/web/src/components/ls/ls-slots.ts`. Nothing else has to change — the
slot keeps its focal point, its responsive sizes and its place in the
choreography.

## House style

Prepend this to every prompt, so the set reads as one campaign:

> Documentary editorial photograph, natural available light, soft shadows,
> realistic skin texture, natural unposed expression, real lived-in
> environment, shallow natural depth of field, subtle fine grain, restrained
> colour grading with warm neutral tones, slightly imperfect candid framing,
> shot on a 35mm prime. Not advertising, not stock, not glossy, not
> oversharpened, not oversaturated, no studio lighting, no AI gloss.

Avoid across the whole set: strong green or blue casts (they fight the
tangerine), visible logos or brand marks, legible screen content, anyone
looking at the camera except where a slot says otherwise.

Keep subjects, ages, rooms and cities varied across the set. No two frames
should look like the same shoot on the same day.

---

## hero/01-primary.jpg — 16:9

A single software engineer at work in a large daylit studio with an
architectural window. Shot wide enough that the room matters as much as the
person. Late afternoon light raking from one side. They are absorbed in the
work, not looking at camera.

## hero/02-mosaic-collab.jpg — 4:3

Two engineers mid-conversation over one shared screen, one of them
gesturing to explain something. Candid, slightly off-centre composition.
The exchange is the subject, not the monitor.

## hero/03-mosaic-detail.jpg — 3:4

A close, quiet detail of the work itself: a handwritten notebook with a
half-drawn system diagram beside a laptop on a worn desk. No faces, no
hands. The texture frame that lets the mosaic breathe.

## hero/04-mosaic-meeting.jpg — 4:3

Two professionals being introduced at a technology conference — a real
handshake or the moment just after. Lanyards, a crowd soft and out of focus
behind them. Warm indoor light.

## hero/05-mosaic-present.jpg — 16:10

Someone presenting their work to a small room, photographed from among the
audience so the viewer is in the room rather than watching it. Screen glow
and stage light on the speaker.

## identity/01-window.jpg — 3:4

A researcher alone at a desk by a tall window, papers and a laptop, caught
mid-thought. Quiet and still. Leave generous empty air above them — a
headline sits in that space.

## identity/02-walking.jpg — 16:10

A professional walking through contemporary city architecture at dusk,
carrying a bag, caught mid-stride. Long shadows. Reads as momentum between
one place and the next.

## identity/03-portrait.jpg — 4:5

An editorial half-length portrait of a young engineer in their own
workspace. **This is the one frame where the subject meets the camera.**
Honest and unpolished rather than corporate. Natural window light.

## work/01-build.jpg — 16:9

An engineer testing a hardware prototype on a cluttered workbench, tools and
cables in frame, mid-task. The mess is the point — this is what building
actually looks like.

## work/02-research.jpg — 4:3

Late at night, one person deep in a problem, notes spread across the desk, a
warm pool of lamplight against a darker room.

## work/03-team.jpg — 3:2

Three or four people working together around one physical table —
mid-work, not mid-meeting. Natural daylight, nobody posed.

## connections/01-exchange.jpg — 3:2

The moment of exchange: one phone held up to scan a code on another
person's phone or badge, at an event. Shot close and slightly from the
side, both hands and faces readable. Leave a clean mid-tone area in the
frame — an acid-lime accent sits over this section.

## connections/02-crowd.jpg — 21:9

Wide, slightly elevated view of small groups in conversation at a
technology event. Some motion blur is welcome. Energy without chaos.

## editorial/01-statement.jpg — 21:9

One person small within a large, beautiful architectural space, facing away
or in profile. Scale and possibility. Keep the upper third calm and
uncluttered — a large statement sits there.

## editorial/02-closing.jpg — 16:9

A small group at the end of a project, genuinely laughing together. Warm,
loose, slightly imperfect framing. The last photograph on the page.

---

## Video (optional)

Two slots would take footage well if you generate it later. Both want slow,
locked-off or very slow dolly movement, no cuts, 6–10 seconds, silent, and
the same grade as the stills.

- `hero/01-primary` — the opening frame as footage rather than a still:
  the engineer at work, dust in the light, almost imperceptible camera drift.
- `connections/02-crowd` — the event, with people moving through frame.

Export MP4 (H.264) and WebM, long edge 1920, and keep a still frame at the
same path as the poster image.

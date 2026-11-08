# Photography

Every slot the site needs is declared in
`src/components/ls/ls-slots.ts`, with the art direction a photo editor
would work from. Until a file exists the slot renders that direction at
exactly the dimensions the photograph will occupy, so the layout, the
crops and the scroll choreography are already final.

## Adding a photograph

1. Put the file at the path named by the slot's `id`, e.g.
   `public/images/hero/01-primary.jpg`.
2. Set `src: 'hero/01-primary.jpg'` on that slot.

Nothing else changes. The slot keeps its aspect ratio, its focal point and
its responsive sizes.

## House treatment

Natural light. No heavy grade, no stock gloss. People doing something
rather than posing at camera, in real rooms. Warmth in the light is
welcome because it sits beside tangerine; avoid strong green or blue
casts, which fight the palette.

Keep the long edge at 2400px or more, export AVIF/WebP, and check the
focal point holds at the mobile crop as well as the desktop one.

## Licensing

Only photography CodeCard has the right to publish: commissioned work, or
stock under a licence that permits commercial web use. Record the source
and licence for each file before it ships.

import type { PhotoSlot } from './ls-photo';

/**
 * The photography manifest.
 *
 * One entry per photograph the site needs, with the direction a photo editor
 * would work from. Add `src` once the file sits at `public/images/<src>` and
 * that slot goes live; nothing else has to change.
 *
 * House treatment for every shot: natural light, no heavy grade, no stock
 * gloss, people doing something rather than posing at camera, real rooms.
 * Warmth in the light is welcome because it sits beside tangerine; avoid
 * strong green or blue casts, which fight the palette.
 */

export const SLOTS = {
  /* ── 01 opening ──────────────────────────────────────────────────── */
  heroPrimary: {
    id: 'hero/01-primary',
    alt: 'An engineer working at a desk in a daylit studio',
    direction:
      'The opening frame. A single engineer at work in a large daylit room — architectural window, real desk, visible craft. Shot wide enough that the room matters as much as the person. Late afternoon light from one side. They are absorbed in the work, not looking at camera.',
    ratio: '16 / 9',
    focal: '58% 44%',
    focalMobile: '62% 40%',
  },

  /* ── the mosaic that opens out of the hero ───────────────────────── */
  mosaicA: {
    id: 'hero/02-mosaic-collab',
    alt: 'Two engineers talking through an idea at a shared screen',
    direction:
      'Two people mid-conversation over one screen, one gesturing. Candid, slightly off-centre, shallow depth. The point is the exchange, not the monitor.',
    ratio: '4 / 3',
    focal: '50% 42%',
  },
  mosaicB: {
    id: 'hero/03-mosaic-detail',
    alt: 'Close detail of a notebook, pen and laptop on a working desk',
    direction:
      'A close, quiet detail of the work itself: handwritten notes beside a laptop, a half-drawn diagram. No faces. This is the texture shot that lets the mosaic breathe.',
    ratio: '3 / 4',
    focal: '50% 55%',
  },
  mosaicC: {
    id: 'hero/04-mosaic-meeting',
    alt: 'Two people meeting and talking at a technology conference',
    direction:
      'Two professionals meeting properly at an event — a real handshake or an introduction in progress, lanyards, a crowd softly out of focus behind. Warm indoor light.',
    ratio: '4 / 3',
    focal: '46% 40%',
  },
  mosaicD: {
    id: 'hero/05-mosaic-present',
    alt: 'A founder presenting work to a small audience',
    direction:
      'Someone presenting their work to a small room. Shot from among the audience, so the viewer is in the room rather than watching it. Screen glow and stage light.',
    ratio: '16 / 10',
    focal: '52% 46%',
  },

  /* ── 02 the problem with professional identity ───────────────────── */
  scatterA: {
    id: 'identity/01-window',
    alt: 'A researcher working alone by a large window',
    direction:
      'A researcher at a desk by a tall window, papers and a laptop, mid-thought. Quiet, a lot of negative space above them — the headline will sit in that air.',
    ratio: '3 / 4',
    focal: '58% 50%',
  },
  scatterB: {
    id: 'identity/02-walking',
    alt: 'A professional walking through a modern city at dusk',
    direction:
      'A person walking through contemporary architecture, carrying a bag, caught mid-stride. Dusk, long shadows. Reads as momentum between places.',
    ratio: '16 / 10',
    focal: '44% 54%',
  },

  /* ── 03 what CodeCard is ─────────────────────────────────────────── */
  identityPortrait: {
    id: 'identity/03-portrait',
    alt: 'An editorial portrait of a young engineer in their workspace',
    direction:
      'An editorial half-length portrait in the subject’s own workspace. They meet the camera here — this is the one frame on the site where someone looks straight out. Honest, unpolished, confident.',
    ratio: '4 / 5',
    focal: '50% 38%',
  },

  /* ── 04 your work ────────────────────────────────────────────────── */
  workA: {
    id: 'work/01-build',
    alt: 'An engineer testing a hardware prototype on a workbench',
    direction:
      'Hands-on building: a prototype mid-test on a cluttered bench, tools in frame. The mess is the point — this is what work actually looks like.',
    ratio: '16 / 9',
    focal: '54% 56%',
  },
  workB: {
    id: 'work/02-research',
    alt: 'A researcher working late with notes and a screen',
    direction:
      'Late, lamp-lit, one person deep in a problem with notes spread out. Warm pool of light against a darker room.',
    ratio: '4 / 3',
    focal: '48% 48%',
  },
  workC: {
    id: 'work/03-team',
    alt: 'A small team working together around a physical workspace',
    direction:
      'Three or four people around one table, mid-work rather than mid-meeting. Natural light, nobody posed.',
    ratio: '3 / 2',
    focal: '50% 46%',
  },

  /* ── 05 connections ──────────────────────────────────────────────── */
  connectA: {
    id: 'connections/01-exchange',
    alt: 'Two people exchanging details on a phone at an event',
    direction:
      'The moment itself: one phone held up to another person’s screen or badge. Shot close, slightly from the side, hands and faces both readable. This frame has to carry the whole QR idea without a screenshot — the lime accent lives in this section, so leave a clean mid-tone area for it.',
    ratio: '3 / 2',
    focal: '50% 50%',
  },
  connectB: {
    id: 'connections/02-crowd',
    alt: 'Small groups talking at a technology conference',
    direction:
      'Wide, warm, slightly elevated view of people in conversation at an event. Movement blur is welcome. Energy without chaos.',
    ratio: '21 / 9',
    focal: '50% 48%',
  },

  /* ── 06 the brand statement ──────────────────────────────────────── */
  statement: {
    id: 'editorial/01-statement',
    alt: 'A person standing in a large architectural space',
    direction:
      'The emotional full-bleed passage. One person small in a large, beautiful architectural space, facing away or in profile. Scale and possibility. Needs a calm upper third for the statement type.',
    ratio: '21 / 9',
    focal: '50% 42%',
  },

  /* ── 07 the close ────────────────────────────────────────────────── */
  closing: {
    id: 'editorial/02-closing',
    alt: 'A team at the end of a project, mid-celebration',
    direction:
      'Genuine, unforced: a small group at the end of something, laughing. Warm, loose, slightly imperfect framing. The last image on the page.',
    ratio: '16 / 9',
    focal: '50% 44%',
  },
} satisfies Record<string, PhotoSlot>;

export type SlotKey = keyof typeof SLOTS;

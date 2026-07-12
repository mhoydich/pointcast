# Manus brief — Poster 01 · /coffee

**Date:** 2026-05-07 PT
**Series:** Rooms · Midcentury Modern Brutalist Abstract
**Spec:** `docs/briefs/2026-05-07-poster-series-rooms-mcm-brutalist.md` (read this first)
**Approval gate:** Mike approval before any poster ships to a public PointCast surface
**Route:** Manus generates via ChatGPT image generation. Codex is on main-street-art today.

## What this room is

`/coffee` is the moka pot, still on. A pixel-art stovetop pot brews on the page; visitors tap it and the global mug shelf adds a cup. The room runs on Workers, holds a 7-day history, and gates five rarity-tiered mintable mugs (Coffee Mugs FA2 source ready, awaiting Mike's origination). The whole room is a quiet ritual — small house, coffee pot always on.

## The geometric reduction

A single **stacked silhouette** carries this poster — abstracted moka pot as **circle on trapezoid on rectangle**:

- Bottom: a flat wide rectangle (the boiler), oxblood ink line, hollow
- Middle: an inverted trapezoid (the collector), filled solid mustard
- Top: a perfect circle (the lid), oxblood ink line, hollow with a single small filled dot offset right (the knob)

The shapes don't touch — small concrete-grey gaps between each, like an exploded-axonometric diagram. The whole stack sits centered on the upper-two-thirds, riding a Rothko field of mustard `#c4952e` whose edges go slightly soft into bone at the margins.

A single **steam wisp** rendered as three short concrete-grey vertical strokes rises from the lid — pixel-art rhythm, not a curl. That's the only living mark.

## Hero color

`#c4952e` (mustard) — large Rothko field behind the stack, occupying the upper two-thirds with soft silkscreen edges.

## Type lockup (lower-third)

- **Slab serif:** `COFFEE` — set huge, low-tracked, ink `#1f160c`, baseline-anchored to the lower-third grid line, left-aligned to column 2
- **Mono below:** `CH.CFE · POT STILL ON · POINTCAST` — IBM Plex Mono spirit, uppercase, ink, ~1/8 the size of the slab
- **Oversized numeral:** `01` — concrete grey `#a8a39a`, set in the slab, bleeding off the upper-right edge so only ~70% is visible. Bigger than `COFFEE`. The brutalist anchor.

## Background + neutrals

- Field: mustard `#c4952e` in the upper two-thirds, soft silkscreen edge
- Margin/canvas: bone `#efe7d6` (the ~1/12 margin on every side)
- Lower-third behind type: bone, no field
- All ink lines: ink `#1f160c`, hand-drawn weight (~3px equivalent at 1024×1536)

## Image-gen prompt (paste-ready)

> Midcentury modern brutalist abstract poster, portrait 2:3, for a room called "/coffee" in a small internet town. The composition is strict and quiet. Upper two-thirds: a large Rothko-style flat color field of warm mustard `#c4952e` with slightly soft silkscreen edges. Inside the mustard field, centered, a single abstract geometric stack — three separated shapes evoking a moka pot but never literal: a flat wide hollow rectangle at the bottom (ink outline only, ~3px line weight), an inverted solid mustard trapezoid in the middle, and a perfect hollow circle at the top with one small filled dot offset right. The three shapes do not touch — small concrete-grey gaps between them, like an exploded diagram. Above the circle, three short vertical concrete-grey strokes rising as steam (pixel-art rhythm, not a curl). Lower-third: bone-cream background `#efe7d6`. Type lockup, left-aligned to a 12-column grid: slab serif "COFFEE" in ink `#1f160c`, set huge and low-tracked, baseline-anchored. Below, in monospace uppercase ink, much smaller: "CH.CFE · POT STILL ON · POINTCAST". Bleeding off the upper-right edge of the entire poster, an oversized numeral "01" in concrete grey `#a8a39a` set in the same slab serif as "COFFEE" — larger than the room mark, only ~70% visible, the rest cropped off the canvas. Strict 12-column grid, generous margin (~1/12 on every side) of bone `#efe7d6`. Flat colors only, no gradients, no drop shadows, no chrome, no glossy 3D, no neon, no AI sparkle, no photorealism. Hand-drawn line weight, slight silkscreen imperfection at color edges. Reads like a 1968 Polish university poster crossed with Saul Bass and Rothko.

## Output

- File: `public/images/posters/rooms-mcm/01-coffee.png` (1024 × 1536, sRGB)
- Source prompt: `public/images/posters/rooms-mcm/01-coffee.prompt.txt`
- Log: `docs/manus-logs/2026-05-07-poster-01-coffee.md` — render at top, prompt + model used, one-line "what worked / what didn't"

## Acceptance

- [ ] Geometry is abstract — no literal moka pot, the three shapes don't touch
- [ ] Hero color is mustard `#c4952e`, edges soft (not vector-perfect)
- [ ] Oversized `01` bleeds off the upper-right edge, larger than `COFFEE`
- [ ] No banned aesthetic moves (gradients, chrome, neon, sparkle, photorealism)
- [ ] PNG + prompt + log all written at the listed paths
- [ ] **Do not promote to homepage / footer / /explore / social.** File-landing only. Mike eyes before any user-visible promotion.
- [ ] One PR with the PNG, the prompt, and the log. Don't auto-merge.

## After this lands

cc writes Poster 02 (`/window`, deep teal) once Mike has approved the chord direction. One poster at a time so the chord can shift after any sheet.

— cc · 2026-05-07 PT · El Segundo

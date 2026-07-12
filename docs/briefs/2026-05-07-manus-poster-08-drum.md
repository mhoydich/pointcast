# Manus brief — Poster 08 · /drum

**Date:** 2026-05-07 PT
**Series:** Rooms · Midcentury Modern Brutalist Abstract
**Spec:** `docs/briefs/2026-05-07-poster-series-rooms-mcm-brutalist.md` (read this first)
**Approval gate:** Mike approval before any poster ships to a public PointCast surface
**Route:** Manus generates via ChatGPT image generation.

## What this room is

`/drum` is the attention-coin altar ring. Visitors tap pads to play the drum; an FA1.2 token rewards the tappers; a global count tallies the world's playing.

## The geometric reduction

The drum membrane viewed from directly above — **three concentric brass arcs**.

- Outermost arc: a hollow brass ring (only the line, ~6px), occupying ~70% of the canvas width
- Middle arc: a hollow brass ring (line only), ~50% of canvas width, concentric with the outer
- Innermost: a solid filled brass disc (~25% of canvas width), the drum's center, also concentric

All three are perfectly concentric, sitting in the upper two-thirds, dead-center horizontally.

Across all three rings, **one thin concrete-grey radial line** crossing at a ~45° angle from the upper-left through the center to the lower-right of the outermost ring — the strike vector. The line passes cleanly through the disc and both hollow rings.

That's it. Bass would draw this in 1962. Polish poster school would print it in 1968.

## Hero color

`#7a5024` (brass) — the three rings and the disc.

## Type lockup (lower-third)

- **Slab serif:** `DRUM` — set huge, ink `#1f160c`, low-tracked, baseline-anchored, left-aligned to column 2
- **Mono below:** `CH.DRM · ALTAR RING · POINTCAST` — uppercase, ink, ~1/8 the slab size
- **Oversized numeral:** `08` — concrete grey `#a8a39a`, slab serif, bleeding off the upper-right edge, larger than `DRUM`, ~70% visible

## Background + neutrals

- Canvas: bone `#efe7d6` filling the entire canvas, generous margin
- Rings + disc: brass `#7a5024`
- Strike vector: concrete grey `#a8a39a`, ~3px line weight

## Image-gen prompt (paste-ready)

> Midcentury modern brutalist abstract poster, portrait 2:3, for a room called "/drum" in a small internet town. Strict 12-column grid. Bone-cream background `#efe7d6` filling the entire canvas with generous margins. In the upper two-thirds, dead-center horizontally, three perfectly concentric circular forms in brass `#7a5024`: an outermost hollow ring (line only, ~6px stroke) occupying ~70% of the canvas width; a middle hollow ring (line only) at ~50% width; an innermost solid filled brass disc at ~25% width. All three concentric, slight silkscreen imperfection. Across all three forms, one thin concrete-grey straight line `#a8a39a` (~3px stroke) crossing at a ~45° angle from the upper-left of the outermost ring through the center of the disc and continuing to the lower-right of the outermost ring — the strike vector, passing cleanly through every layer. No other marks. Lower-third: type lockup left-aligned to column 2. Slab serif "DRUM" in ink `#1f160c`, set huge, baseline-anchored, low-tracked. Below in monospace uppercase ink, much smaller: "CH.DRM · ALTAR RING · POINTCAST". Bleeding off the upper-right edge of the entire poster, an oversized numeral "08" in concrete grey set in the same slab serif as "DRUM" — larger than the room mark, only ~70% visible. Flat colors only, no gradients, no drop shadows, no chrome, no glossy 3D, no neon, no AI sparkle, no photorealism. Reads like a 1962 Saul Bass film-title card or a 1968 Polish concert poster.

## Output

- File: `public/images/posters/rooms-mcm/08-drum.png` (1024 × 1536, sRGB)
- Source prompt: `public/images/posters/rooms-mcm/08-drum.prompt.txt`
- Log: `docs/manus-logs/2026-05-07-poster-08-drum.md`

## Acceptance

- [ ] Three perfectly concentric brass forms — outer hollow ring, middle hollow ring, inner solid disc
- [ ] One thin concrete-grey 45° radial line crossing all three layers
- [ ] No other marks above or below
- [ ] Oversized `08` bleeds off upper-right, larger than `DRUM`
- [ ] No banned aesthetic moves
- [ ] **File-landing only.** Mike eyes before any user-visible promotion.
- [ ] One PR with the PNG, the prompt, and the log. Don't auto-merge.

— cc · 2026-05-07 PT · El Segundo

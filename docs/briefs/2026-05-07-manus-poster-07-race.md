# Manus brief — Poster 07 · /race

**Date:** 2026-05-07 PT
**Series:** Rooms · Midcentury Modern Brutalist Abstract
**Spec:** `docs/briefs/2026-05-07-poster-series-rooms-mcm-brutalist.md` (read this first)
**Approval gate:** Mike approval before any poster ships to a public PointCast surface
**Route:** Manus generates via ChatGPT image generation.

## What this room is

`/race` is the daily front-door race. A single line race that resets every day, runners ticked off as they cross. The town's standing wager with itself.

## The geometric reduction

A single horizontal **dusty blue line** spans ~80% of the canvas width, dead-center vertically in the upper two-thirds. The line cleaves the upper Rothko field horizontally.

- At the line's **left end**: one short vertical perpendicular tick (~40px tall, dusty blue), centered on the line — the start gate
- At the line's **right end**: one slightly longer vertical perpendicular tick (~60px tall, dusty blue), centered on the line — the finish
- Two small concrete-grey vertical tick marks at 25% and 75% along the line — quarter-laps
- One small **filled dusty blue circle** at ~30% along the line, sitting on the line — the runner

The geometry reads as a track diagram from a midcentury textbook. Bass would draw this in 1962.

## Hero color

`#5b7fb0` (dusty blue) — line, start gate, finish, runner.

## Type lockup (lower-third)

- **Slab serif:** `RACE` — set huge, ink `#1f160c`, low-tracked, baseline-anchored, left-aligned to column 2
- **Mono below:** `CH.RAC · DAILY FRONT DOOR · POINTCAST` — uppercase, ink, ~1/8 the slab size
- **Oversized numeral:** `07` — concrete grey `#a8a39a`, slab serif, bleeding off the upper-right edge, larger than `RACE`, ~70% visible

## Background + neutrals

- Canvas: bone `#efe7d6` filling the entire canvas, generous margin
- Line + ticks + runner: dusty blue `#5b7fb0`
- Quarter-lap ticks: concrete grey `#a8a39a`

## Image-gen prompt (paste-ready)

> Midcentury modern brutalist abstract poster, portrait 2:3, for a room called "/race" in a small internet town. Strict 12-column grid. Bone-cream background `#efe7d6` filling the entire canvas with generous margins. In the upper two-thirds, dead-center vertically, a single horizontal dusty-blue line `#5b7fb0` spanning ~80% of the canvas width, hand-drawn weight ~6px, slight silkscreen imperfection. At the line's left end, one short vertical dusty-blue tick perpendicular to the line, ~40px tall, centered on the line (the start gate). At the line's right end, a slightly longer vertical dusty-blue tick perpendicular to the line, ~60px tall, centered on the line (the finish). At 25% and 75% along the line, two small concrete-grey vertical tick marks `#a8a39a` (~20px tall each, quarter-lap markers). At ~30% along the line, a single small filled dusty-blue circle (~18px diameter) sitting on the line — the runner. Nothing else above or below the line. Lower-third: type lockup left-aligned to column 2. Slab serif "RACE" in ink `#1f160c`, set huge, baseline-anchored, low-tracked. Below in monospace uppercase ink, much smaller: "CH.RAC · DAILY FRONT DOOR · POINTCAST". Bleeding off the upper-right edge of the entire poster, an oversized numeral "07" in concrete grey set in the same slab serif as "RACE" — larger than the room mark, only ~70% visible. Flat colors only, no gradients, no drop shadows, no chrome, no glossy 3D, no neon, no AI sparkle, no photorealism. Reads like a 1962 Saul Bass track diagram.

## Output

- File: `public/images/posters/rooms-mcm/07-race.png` (1024 × 1536, sRGB)
- Source prompt: `public/images/posters/rooms-mcm/07-race.prompt.txt`
- Log: `docs/manus-logs/2026-05-07-poster-07-race.md`

## Acceptance

- [ ] One horizontal dusty-blue line, ~80% width, with start tick (left, shorter) and finish tick (right, longer)
- [ ] Two concrete-grey quarter-lap ticks at 25% and 75%
- [ ] One small filled dusty-blue circle at ~30% (the runner)
- [ ] Nothing else above or below the line
- [ ] Oversized `07` bleeds off upper-right, larger than `RACE`
- [ ] No banned aesthetic moves
- [ ] **File-landing only.** Mike eyes before any user-visible promotion.
- [ ] One PR with the PNG, the prompt, and the log. Don't auto-merge.

— cc · 2026-05-07 PT · El Segundo

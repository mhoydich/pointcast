# Manus brief — Poster 09 · /battle

**Date:** 2026-05-07 PT
**Series:** Rooms · Midcentury Modern Brutalist Abstract
**Spec:** `docs/briefs/2026-05-07-poster-series-rooms-mcm-brutalist.md` (read this first)
**Approval gate:** Mike approval before any poster ships to a public PointCast surface
**Route:** Manus generates via ChatGPT image generation.

## What this room is

`/battle` is Nouns Nation Battler — the in-town tournament where Nouns characters squad up across the Rift. Bowl, lanes, matchplay.

## The geometric reduction

**Two opposing isoceles triangles**, points facing inward across the canvas's vertical axis, just touching at the tips dead-center of the upper two-thirds.

- Left triangle: solid slate `#5e5e5e`, point right, base on the left margin
- Right triangle: solid concrete grey `#a8a39a`, point left, base on the right margin

Both triangles are tall and narrow (height ~3× their base width). Their tips meet but do not overlap — a single hairline of bone shows between them. The composition is symmetric on the vertical axis, asymmetric in color weight (slate is heavier than concrete).

Below the triangle pair, nothing. Above, nothing. The tension at the touch-point is the entire image.

## Hero color

`#5e5e5e` (slate) — the left triangle.

## Type lockup (lower-third)

- **Slab serif:** `BATTLE` — set huge, ink `#1f160c`, low-tracked, baseline-anchored, left-aligned to column 2
- **Mono below:** `CH.BTL · NOUNS NATION · POINTCAST` — uppercase, ink, ~1/8 the slab size
- **Oversized numeral:** `09` — concrete grey `#a8a39a`, slab serif, bleeding off the upper-right edge, larger than `BATTLE`, ~70% visible. Note: the oversized `09` and the right-triangle both use concrete grey — keep them visually separated by spacing.

## Background + neutrals

- Canvas: bone `#efe7d6` filling the entire canvas, generous margin
- Left triangle: slate `#5e5e5e` solid, slight silkscreen edges
- Right triangle: concrete grey `#a8a39a` solid, slight silkscreen edges
- Hairline gap between tips: bone (1-2px showing)

## Image-gen prompt (paste-ready)

> Midcentury modern brutalist abstract poster, portrait 2:3, for a room called "/battle" in a small internet town. Strict 12-column grid. Bone-cream background `#efe7d6` filling the entire canvas with generous margins. In the upper two-thirds, two opposing isoceles triangles facing each other across the vertical axis. Left triangle: filled solid slate grey `#5e5e5e`, point facing right, base anchored against the left margin, tall and narrow (height ~3× its base width). Right triangle: filled solid concrete grey `#a8a39a`, point facing left, base anchored against the right margin, same proportions. The two triangle tips meet at the dead-center vertical axis but do not overlap — a 1-2px hairline of bone background shows between them. The composition is symmetric on the vertical axis, asymmetric in tonal weight (slate is darker than concrete). Slight silkscreen imperfection at the color edges. Nothing else above or below the triangles. Lower-third: type lockup left-aligned to column 2. Slab serif "BATTLE" in ink `#1f160c`, set huge, baseline-anchored, low-tracked. Below in monospace uppercase ink, much smaller: "CH.BTL · NOUNS NATION · POINTCAST". Bleeding off the upper-right edge of the entire poster, an oversized numeral "09" in concrete grey set in the same slab serif as "BATTLE" — larger than the room mark, only ~70% visible, separated visually from the right triangle by spacing. Flat colors only, no gradients, no drop shadows, no chrome, no glossy 3D, no neon, no AI sparkle, no photorealism. The tension at the triangle touch-point is the entire image. Reads like a 1968 brutalist civic emblem.

## Output

- File: `public/images/posters/rooms-mcm/09-battle.png` (1024 × 1536, sRGB)
- Source prompt: `public/images/posters/rooms-mcm/09-battle.prompt.txt`
- Log: `docs/manus-logs/2026-05-07-poster-09-battle.md`

## Acceptance

- [ ] Two opposing isoceles triangles, tips meeting at vertical center, hairline bone gap between them
- [ ] Left triangle slate, right triangle concrete grey
- [ ] Nothing above or below the triangles
- [ ] Oversized `09` bleeds off upper-right, visually separated from right triangle
- [ ] No banned aesthetic moves
- [ ] **File-landing only.** Mike eyes before any user-visible promotion.
- [ ] One PR with the PNG, the prompt, and the log. Don't auto-merge.

— cc · 2026-05-07 PT · El Segundo

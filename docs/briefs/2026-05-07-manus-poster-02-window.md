# Manus brief — Poster 02 · /window

**Date:** 2026-05-07 PT
**Series:** Rooms · Midcentury Modern Brutalist Abstract
**Spec:** `docs/briefs/2026-05-07-poster-series-rooms-mcm-brutalist.md` (read this first)
**Approval gate:** Mike approval before any poster ships to a public PointCast surface
**Route:** Manus generates via ChatGPT image generation.

## What this room is

`/window` is a pure-CSS pixel-art window onto El Segundo. The view tints with time-of-day and pulls live weather from Open-Meteo. No content, no widgets — the room is the view.

## The geometric reduction

A single **deep teal square** carries this poster. Sized to occupy ~70% of the canvas width, slightly off-center to the left, riding in the upper two-thirds of the page on a bone Rothko field. The square is the window.

Inside the teal square:
- One thin horizon line bisecting at the upper third, ink `#1f160c`, hand-drawn weight
- One small concrete-grey perfect circle in the upper-left quadrant of the square (sun)

The square's right edge bleeds **off the canvas** to the right — only ~85% of the square is visible. Suggests the wall continues. Three sides sharp; one side cropped.

No frame, no curtains, no muntins, no view beyond the horizon. The field IS the view.

## Hero color

`#1f5d6e` (deep teal) — solid flat fill of the square, soft silkscreen edges.

## Type lockup (lower-third)

- **Slab serif:** `WINDOW` — set huge, ink, low-tracked, baseline-anchored, left-aligned to column 2
- **Mono below:** `CH.WIN · LIVE EL SEGUNDO · POINTCAST` — uppercase, ink, ~1/8 the slab size
- **Oversized numeral:** `02` — concrete grey `#a8a39a`, slab serif, bleeding off the upper-right edge, larger than `WINDOW`, ~70% visible

## Background + neutrals

- Canvas: bone `#efe7d6`, the ~1/12 margin on every side
- Square: deep teal `#1f5d6e` flat fill, slightly soft edges
- Inside marks: ink `#1f160c` for horizon, concrete grey `#a8a39a` for sun

## Image-gen prompt (paste-ready)

> Midcentury modern brutalist abstract poster, portrait 2:3, for a room called "/window" in a small internet town. Strict 12-column grid. Generous bone-cream margin `#efe7d6` (~1/12 on every side). The composition centers on a single large flat deep-teal square `#1f5d6e` occupying ~70% of the canvas width, riding in the upper two-thirds, slightly left of center. The square's right edge crops off the canvas — only about 85% of the square is visible, suggesting a wall that continues. Inside the teal field: one thin horizontal ink line `#1f160c` bisecting the square at its upper third (the horizon); one small perfect concrete-grey circle `#a8a39a` in the upper-left quadrant of the teal square (the sun). No frame, no muntins, no curtains, no view — the teal field IS the view. Lower-third: bone background. Type lockup left-aligned to column 2: slab serif "WINDOW" in ink, set huge, baseline-anchored, low-tracked. Below in monospace uppercase ink, much smaller: "CH.WIN · LIVE EL SEGUNDO · POINTCAST". Bleeding off the upper-right edge of the entire poster, an oversized numeral "02" in concrete grey set in the same slab serif as "WINDOW" — larger than the room mark, only ~70% visible. Flat colors only, no gradients, no drop shadows, no chrome, no glossy 3D, no neon, no AI sparkle, no photorealism. Hand-drawn line weight, slight silkscreen imperfection at color edges. Reads like a 1968 Polish university poster crossed with Saul Bass and Rothko.

## Output

- File: `public/images/posters/rooms-mcm/02-window.png` (1024 × 1536, sRGB)
- Source prompt: `public/images/posters/rooms-mcm/02-window.prompt.txt`
- Log: `docs/manus-logs/2026-05-07-poster-02-window.md`

## Acceptance

- [ ] One large deep-teal square, right edge bleeding off canvas
- [ ] Horizon line + sun circle inside the square — that's the only inner content
- [ ] No frame, no curtains, no muntins
- [ ] Oversized `02` bleeds off upper-right, larger than `WINDOW`
- [ ] No banned aesthetic moves
- [ ] **File-landing only.** Mike eyes before any user-visible promotion.
- [ ] One PR with the PNG, the prompt, and the log. Don't auto-merge.

— cc · 2026-05-07 PT · El Segundo

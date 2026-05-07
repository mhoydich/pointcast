# Manus brief — Poster 10 · /scoreboard

**Date:** 2026-05-07 PT
**Series:** Rooms · Midcentury Modern Brutalist Abstract
**Spec:** `docs/briefs/2026-05-07-poster-series-rooms-mcm-brutalist.md` (read this first)
**Approval gate:** Mike approval before any poster ships to a public PointCast surface
**Route:** Manus generates via ChatGPT image generation.

## What this room is

`/scoreboard` is the per-agent tally — how many blocks each resident has shipped, refreshed live. The town's running ledger.

## The geometric reduction

**Four columns of stacked monospace numerals**, occupying the upper two-thirds, evenly spaced left-to-right across the canvas width. Each column has three numerals stacked vertically.

- Column 1 (leftmost): `47 / 23 / 19` — set in ember `#e85a1a`, the leader column
- Column 2: `38 / 17 / 14` — set in ink `#1f160c`
- Column 3: `29 / 11 / 09` — set in ink
- Column 4 (rightmost): `12 / 06 / 03` — set in ink

The numerals are large monospace digits, brutalist weight (think Departure Mono or IBM Plex Mono Bold but bigger). Each column's numerals are vertically center-aligned. Generous gutters between columns.

The numerals themselves are abstracted — they don't represent real scores. They are dense rectangular digit shapes carrying the visual weight, like a stadium scoreboard read from far away.

This is the only poster in the series where the type IS the geometry across the whole upper field — no separate graphic anchor.

## Hero color

`#e85a1a` (ember) — Column 1 numerals only (the leader accent).

## Type lockup (lower-third)

- **Slab serif:** `SCOREBOARD` — set huge, ink `#1f160c`, low-tracked, baseline-anchored, left-aligned to column 2
- **Mono below:** `CH.SCR · PER AGENT · POINTCAST` — uppercase, ink, ~1/8 the slab size
- **Oversized numeral:** `10` — concrete grey `#a8a39a`, slab serif, bleeding off the upper-right edge, larger than `SCOREBOARD`, ~70% visible

## Background + neutrals

- Canvas: bone `#efe7d6` filling the entire canvas, generous margin
- Column 1: ember `#e85a1a`
- Columns 2-4: ink `#1f160c`
- All numerals slight silkscreen imperfection

## Image-gen prompt (paste-ready)

> Midcentury modern brutalist abstract poster, portrait 2:3, for a room called "/scoreboard" in a small internet town. Strict 12-column grid. Bone-cream background `#efe7d6` filling the entire canvas with generous margins. In the upper two-thirds, four columns of stacked monospace numerals evenly spaced left-to-right across the canvas width with generous gutters between columns. Each column contains three numerals stacked vertically, vertically center-aligned. Column 1 (leftmost) reads "47 / 23 / 19" — these three numerals set in ember orange `#e85a1a`, the leader accent. Column 2 reads "38 / 17 / 14" in ink `#1f160c`. Column 3 reads "29 / 11 / 09" in ink. Column 4 (rightmost) reads "12 / 06 / 03" in ink. All numerals are large brutalist monospace digits — heavy weight, dense rectangular forms, slight silkscreen imperfection at the edges, hand-drawn pixel rhythm. The numerals themselves carry the entire visual weight — no separate graphic anchor on this poster. The grid of digits reads like a stadium scoreboard from far away. Lower-third: type lockup left-aligned to column 2. Slab serif "SCOREBOARD" in ink, set huge, baseline-anchored, low-tracked. Below in monospace uppercase ink, much smaller: "CH.SCR · PER AGENT · POINTCAST". Bleeding off the upper-right edge of the entire poster, an oversized numeral "10" in concrete grey `#a8a39a` set in the same slab serif as "SCOREBOARD" — larger than the room mark, only ~70% visible. Flat colors only, no gradients, no drop shadows, no chrome, no glossy 3D, no neon, no AI sparkle, no photorealism. Render the digits cleanly — no spelling errors, no garbled glyphs. Reads like a 1968 brutalist scoreboard panel.

## Output

- File: `public/images/posters/rooms-mcm/10-scoreboard.png` (1024 × 1536, sRGB)
- Source prompt: `public/images/posters/rooms-mcm/10-scoreboard.prompt.txt`
- Log: `docs/manus-logs/2026-05-07-poster-10-scoreboard.md`

## Acceptance

- [ ] Four columns of three monospace numerals each, evenly spaced
- [ ] Column 1 ember `#e85a1a`, Columns 2-4 ink `#1f160c`
- [ ] Numerals are dense brutalist digits — no garbled glyphs, no misspellings
- [ ] No separate graphic anchor — the digit grid IS the geometry
- [ ] Oversized `10` bleeds off upper-right, slab serif, concrete grey
- [ ] No banned aesthetic moves
- [ ] **File-landing only.** Mike eyes before any user-visible promotion.
- [ ] One PR with the PNG, the prompt, and the log. Don't auto-merge.

— cc · 2026-05-07 PT · El Segundo

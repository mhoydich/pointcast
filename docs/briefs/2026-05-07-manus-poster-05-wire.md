# Manus brief — Poster 05 · /wire

**Date:** 2026-05-07 PT
**Series:** Rooms · Midcentury Modern Brutalist Abstract
**Spec:** `docs/briefs/2026-05-07-poster-series-rooms-mcm-brutalist.md` (read this first)
**Approval gate:** Mike approval before any poster ships to a public PointCast surface
**Route:** Manus generates via ChatGPT image generation.

## What this room is

`/wire` is the live commits-and-blocks ticker — every PR merged, every block published, in real time. The town's heartbeat in tape form.

## The geometric reduction

The most reduced poster in the series. **One single horizontal terracotta vector** spanning ~80% of the canvas width, dead-center vertically in the upper two-thirds. ~6px line weight at 1024×1536, hand-drawn imperfection along its length.

One small **notch** breaks the line at ~60% along its length (the latest commit) — the line briefly stops, drops vertically by ~20px, then resumes.

Above the line, three small terracotta-filled circles at varying spacing across the width (commit nodes — past events). Below the line, nothing.

That's it. The wire IS the poster.

## Hero color

`#c95c2e` (terracotta) — the line and the three circles.

## Type lockup (lower-third)

- **Slab serif:** `WIRE` — set huge, ink `#1f160c`, low-tracked, baseline-anchored, left-aligned to column 2
- **Mono below:** `CH.WIR · LIVE TICKER · POINTCAST` — uppercase, ink, ~1/8 the slab size
- **Oversized numeral:** `05` — concrete grey `#a8a39a`, slab serif, bleeding off the upper-right edge, larger than `WIRE`, ~70% visible

## Background + neutrals

- Canvas: bone `#efe7d6` filling the entire canvas, generous margin
- Line + circles: terracotta `#c95c2e`
- Notch: clean terracotta, hand-drawn weight

## Image-gen prompt (paste-ready)

> Midcentury modern brutalist abstract poster, portrait 2:3, for a room called "/wire" in a small internet town. Strict 12-column grid. Bone-cream background `#efe7d6` filling the entire canvas with generous margins. The composition is radically reduced. In the upper two-thirds, dead-center vertically, a single horizontal terracotta line `#c95c2e` spanning ~80% of the canvas width, hand-drawn weight ~6px, slight silkscreen imperfection along the length. At ~60% along the line, a small notch — the line briefly drops vertically by ~20px and resumes — like a dent in a wire. Above the line, three small filled terracotta circles at varying spacing across the width, each circle ~15px diameter. Below the line, completely empty bone. No other marks, no other colors. Lower-third: type lockup left-aligned to column 2. Slab serif "WIRE" in ink `#1f160c`, set huge, baseline-anchored, low-tracked. Below in monospace uppercase ink, much smaller: "CH.WIR · LIVE TICKER · POINTCAST". Bleeding off the upper-right edge of the entire poster, an oversized numeral "05" in concrete grey `#a8a39a` set in the same slab serif as "WIRE" — larger than the room mark, only ~70% visible. Flat colors only, no gradients, no drop shadows, no chrome, no glossy 3D, no neon, no AI sparkle, no photorealism. The poster's restraint is the point — it is one line, three dots, and a notch. Reads like a 1968 minimalist Swiss poster.

## Output

- File: `public/images/posters/rooms-mcm/05-wire.png` (1024 × 1536, sRGB)
- Source prompt: `public/images/posters/rooms-mcm/05-wire.prompt.txt`
- Log: `docs/manus-logs/2026-05-07-poster-05-wire.md`

## Acceptance

- [ ] One horizontal terracotta line, ~80% width, dead center vertically in upper two-thirds
- [ ] One notch at ~60% along the line, drops ~20px and resumes
- [ ] Three small terracotta circles above the line at varied spacing
- [ ] Nothing else above or below the line — the restraint is the point
- [ ] Oversized `05` bleeds off upper-right, larger than `WIRE`
- [ ] No banned aesthetic moves
- [ ] **File-landing only.** Mike eyes before any user-visible promotion.
- [ ] One PR with the PNG, the prompt, and the log. Don't auto-merge.

— cc · 2026-05-07 PT · El Segundo

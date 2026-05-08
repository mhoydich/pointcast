# Manus brief — Poster 04 · /residents

**Date:** 2026-05-07 PT
**Series:** Rooms · Midcentury Modern Brutalist Abstract
**Spec:** `docs/briefs/2026-05-07-poster-series-rooms-mcm-brutalist.md` (read this first)
**Approval gate:** Mike approval before any poster ships to a public PointCast surface
**Route:** Manus generates via ChatGPT image generation.

## What this room is

`/residents` is RFC 0003 made visible — four active AI residents (Claude Code, Codex, Manus, plus director Mike) and two open slots (Kimi, Gemini). The room declares who lives in the town.

## The geometric reduction

A **3×2 grid of six rectangular blocks** dominates the upper two-thirds. Six identical rectangles, evenly spaced, generous gutters between them. A brutalist parking-lot diagram.

- **Four blocks filled solid plum** `#8a2e62` (active residents)
- **Two blocks hollow** — only an ink outline, ~3px weight, no fill (open slots)

The fill/hollow positions: top-left filled, top-center filled, top-right hollow, bottom-left filled, bottom-center filled, bottom-right hollow. The hollow column on the right reads as the open seats.

No labels, no initials, no portraits inside the blocks. The meaning comes from filled vs hollow — that's the brutalist move. Like a stadium seat-map.

## Hero color

`#8a2e62` (plum) — solid fill of the four occupied blocks.

## Type lockup (lower-third)

- **Slab serif:** `RESIDENTS` — set huge, ink `#1f160c`, low-tracked, baseline-anchored, left-aligned to column 2
- **Mono below:** `CH.RES · 4 + 2 · RFC 0003 · POINTCAST` — uppercase, ink, ~1/8 the slab size
- **Oversized numeral:** `04` — concrete grey `#a8a39a`, slab serif, bleeding off the upper-right edge, larger than `RESIDENTS`, ~70% visible

## Background + neutrals

- Canvas: bone `#efe7d6` filling the entire canvas, generous margin
- Filled blocks: plum `#8a2e62` solid fill, slight silkscreen edges
- Hollow blocks: ink `#1f160c` outline only (~3px), bone fill (transparent to background)

## Image-gen prompt (paste-ready)

> Midcentury modern brutalist abstract poster, portrait 2:3, for a room called "/residents" in a small internet town. Strict 12-column grid. Bone-cream background `#efe7d6` filling the entire canvas with generous margins. Upper two-thirds: a 3-column × 2-row grid of six identical rectangles, evenly spaced with generous gutters between them. Four rectangles are filled solid plum `#8a2e62` with slight silkscreen edges; two rectangles are hollow with only an ink outline `#1f160c` (~3px line weight) and no fill, the bone background showing through. Layout: top-left filled, top-center filled, top-right hollow, bottom-left filled, bottom-center filled, bottom-right hollow. The hollow right column reads as open seats. No labels, no initials, no portraits, no faces inside the blocks. Lower-third: type lockup left-aligned to column 2. Slab serif "RESIDENTS" in ink, set huge, baseline-anchored, low-tracked. Below in monospace uppercase ink, much smaller: "CH.RES · 4 + 2 · RFC 0003 · POINTCAST". Bleeding off the upper-right edge of the entire poster, an oversized numeral "04" in concrete grey `#a8a39a` set in the same slab serif as "RESIDENTS" — larger than the room mark, only ~70% visible. Flat colors only, no gradients, no drop shadows, no chrome, no glossy 3D, no neon, no AI sparkle, no photorealism. Hand-drawn line weight, slight silkscreen imperfection. Reads like a 1968 brutalist civic diagram.

## Output

- File: `public/images/posters/rooms-mcm/04-residents.png` (1024 × 1536, sRGB)
- Source prompt: `public/images/posters/rooms-mcm/04-residents.prompt.txt`
- Log: `docs/manus-logs/2026-05-07-poster-04-residents.md`

## Acceptance

- [ ] 3×2 grid of six identical rectangles, even spacing
- [ ] Four filled plum, two hollow (right column hollow), correct fill positions
- [ ] No labels, initials, portraits, or content inside the blocks
- [ ] Oversized `04` bleeds off upper-right, larger than `RESIDENTS`
- [ ] No banned aesthetic moves
- [ ] **File-landing only.** Mike eyes before any user-visible promotion.
- [ ] One PR with the PNG, the prompt, and the log. Don't auto-merge.

— cc · 2026-05-07 PT · El Segundo

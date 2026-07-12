# Poster series spec — Rooms · Midcentury Modern Brutalist Abstract

**Date filed:** 2026-05-07 PT
**Filed by:** Claude Code (cc), on Mike's ask
**Type:** asset-generation series spec (image-gen)
**Mike's ask (verbatim):** *"lets create pointcast, ues posters, use manus or codex to produce, create indivisually, yes ues"* / *"midcentury modern brutalist abstract"*
**Routing:** Manus produces. Codex is on `feat/codex-main-street-art-2026-05-07` today — keep this off their lane.
**Cadence:** **one poster per brief, one at a time.** Each individual brief lives at `docs/briefs/2026-05-07-manus-poster-NN-{slug}.md`. This file holds the rules they all share.

## Series

Ten posters, one per room. The series is **one cohesive design system** — not ten different worlds. The variety is in the geometry and the color, not the aesthetic.

The rooms (locked order):

01. `/coffee` — the moka pot, still on
02. `/window` — pure-CSS window onto El Segundo
03. `/mythos` — the canonical 60-second read
04. `/residents` — RFC 0003 made visible (4 + 2)
05. `/wire` — live commits ticker
06. `/briefs` — multi-agent handoff queue
07. `/race` — daily front-door race
08. `/drum` — attention coin altar ring
09. `/battle` — Nouns Nation Battler
10. `/scoreboard` — per-agent tally

## Aesthetic anchor

**Midcentury Modern Brutalist Abstract.**

Three reference modes, each contributing one move:

- **Saul Bass / Paul Rand** — one graphic mark per poster, hand-drawn warmth, single bold shape carrying the whole frame
- **Rothko color fields** — large flat blocks of warm muted color, no gradients, edges that breathe
- **Brutalism (Polish poster school, 1970s civic monuments)** — heavy slab type, oversized numerals, asymmetric weight, raw concrete texture as a connecting neutral

The result should read like a 1968 university poster shelf: cohesive chord, one room per sheet, the geometry doing the work.

**No** literal depictions of the rooms. Each room becomes a single geometric reduction (a circle, a slot, a stack, a notch). No moka pot — a circle and a trapezoid. No drum — concentric arcs. No race — a single horizontal vector with a notch.

## Palette (cohesive across the 10)

Rotate the hero color so the 10 form a chord, not 10 of the same swatch. One hero + one neutral + ink + cream per poster.

Hero rotation (one per poster, in order):
1. mustard `#c4952e`
2. deep teal `#1f5d6e`
3. oxblood `#5a1818`
4. plum `#8a2e62`
5. terracotta `#c95c2e`
6. sage `#8aa07a`
7. dusty blue `#5b7fb0`
8. brass `#7a5024`
9. slate `#5e5e5e`
10. ember `#e85a1a`

Connecting neutrals (every poster):
- raw concrete `#a8a39a`
- bone `#efe7d6`
- warm cream `#fffdf7`
- ink `#1f160c`

**Banned:** neon, gradients, drop shadows, chrome, glossy 3D, photorealism, AI sparkle, watermarks, signatures.

## Type system

- **Slab serif** for the room mark — set huge, low-tracked. Think Vesper, Caslon Brutal, or a mid-century slab in that family. One word or one short phrase, baseline-anchored to the lower-third grid line.
- **Monospace** for the channel code, room slug, and the tiny metadata. IBM Plex Mono or Departure Mono spirit. Uppercase, tight letterspacing, small.
- **Oversized numeral** somewhere on every poster — the room number `01`–`10` set in the slab, bigger than anything else, in concrete grey. This is the brutalist move.

## Composition

- Strict 12-column grid. Generous margin (≥1/12 on every edge).
- **One geometric anchor** per poster — the abstract reduction of the room. Filled flat color, no shading, hand-drawn line weight. Sized to dominate the upper two-thirds.
- Color field behind the anchor: one large Rothko block of the hero color, edges slightly soft (think silkscreen, not vector-perfect).
- Type lockup pinned to the lower-third grid line. Slab serif room mark + mono channel code below.
- Oversized numeral floats — usually upper-right or bleeding off-edge. Concrete grey.
- Asymmetric weight. The Bass move (single mark) plus the brutalist move (oversized numeral + slab type) plus the Rothko move (warm color field).

## Output spec (every poster)

- **Format:** PNG, 1024 × 1536 (portrait, 2:3)
- **Path:** `public/images/posters/rooms-mcm/NN-{slug}.png` — e.g. `01-coffee.png`
- **Color profile:** sRGB
- **Source prompt:** save alongside output as `NN-{slug}.prompt.txt`
- **Model:** ChatGPT image generation (`gpt-image-1` or DALL-E 3, whichever is available — note in the log)

## Per-poster brief format

Each individual brief in this series follows this shape:

```
# Manus brief — Poster NN · {room}

Date · 2026-05-07
Series · Rooms · Midcentury Modern Brutalist Abstract
Spec · docs/briefs/2026-05-07-poster-series-rooms-mcm-brutalist.md
Approval gate · Mike approval before any poster ships to a public PointCast surface

## What this room is (one paragraph)

## The geometric reduction (one paragraph)

## Hero color: {hex}

## Image-gen prompt (one paragraph, paste-ready)

## Where to write the result
docs/manus-logs/2026-05-07-poster-NN-{slug}.md — log includes the rendered image, the prompt used, the model, and a one-line note on what worked.
```

## Acceptance criteria (per poster)

- [ ] PNG at the listed path, 1024 × 1536, sRGB
- [ ] Reads as part of the series — same type system, same neutral chord, hero color rotated as listed
- [ ] One geometric mark, one color field, slab + mono lockup, oversized concrete numeral
- [ ] No spelled-wrong text, no AI artifacts, no banned aesthetic moves
- [ ] Source prompt saved alongside the PNG
- [ ] Log written at `docs/manus-logs/2026-05-07-poster-NN-{slug}.md`

## What NOT to do

- Don't generate all 10 in one batch — **one at a time, one PR per poster**, so Mike can redirect the chord after each
- Don't depict the room literally — abstract reduction only
- Don't use neon, gradients, chrome, drop shadows, photorealism, or AI-sparkle textures
- Don't reuse the same hero color across two posters
- Don't put body copy on the poster — slab room mark + mono channel code + concrete numeral, that's it
- Don't promote any poster to a public PointCast surface (homepage, footer, /explore, social) without Mike eyes — landing files in `public/images/posters/rooms-mcm/` is fine; promoting them is the gate
- Don't auto-merge any PR

## Why this series

PointCast has rooms but the rooms don't have anchors that travel. A cohesive midcentury-brutalist-abstract poster chord gives every room a shareable artifact — the kind of thing that prints, hangs on a wall, and reads at a glance from the couch. Ten rooms, one chord, one sheet at a time.

— cc · 2026-05-07 PT · El Segundo

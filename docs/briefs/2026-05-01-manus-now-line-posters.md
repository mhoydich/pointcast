# Manus brief — 20 NowLine posters · Friday May 1

**Date:** 2026-05-01 (Friday)
**Author:** cc (Claude Code)
**Status:** generation requested — drop results in `docs/manus-logs/2026-05-01-now-line-posters.md`
**Mike approval:** required before any poster ships to PointCast

## What

Generate **20 posters** inspired by today's NowLine work (PR #286 —
the rotating "right now" strip under the masthead that gives the
homepage a delta on every visit). One series, one design system, 20
variations.

## Inspiration brief

The NowLine is a quiet, single-line broadcast. Always one fact,
always changing. A pulse dot, a kicker, a body, a pager. It says
"right now," "last ship," "today," "channel mix" — the same
rhythm you'd see on an arrivals board or an old transit clock.

Posters should evoke that rhythm: **a single quiet statement, perfectly
placed, color doing the heavy lifting.**

## Visual direction

**Mid-century modern minimalist. Color forward but subtle.**

Reference shelf:
- Saul Bass (negative space, single bold shape, hand-drawn warmth)
- Massimo Vignelli / Unimark (NYC Subway 1972 — Helvetica + dot grids)
- Müller-Brockmann (Swiss grid, single accent)
- Paul Rand (IBM, Westinghouse — playful geometry)
- Dieter Rams / Braun T1000 era (warm beige, mustard, slate, no chrome)
- Olivetti studio posters (Pintori) — typographic rhythm
- Eames House textiles — secondary palette

**Palette rules:**
- 1 hero color + 1 supporting + 1 neutral per poster
- Saturated but mature: mustard `#c4952e`, deep teal `#1f5d6e`, plum
  `#8a2e62`, terracotta `#c95c2e`, sage `#8aa07a`, dusty blue `#5b7fb0`,
  warm cream `#fffdf7`, ink `#1f160c`
- No neon, no gradients, no drop shadows, no AI sparkle
- Across the 20, rotate the hero color so the series feels like a
  full chord, not 20 of the same swatch

**Type:**
- One mono / one serif per poster, max
- Mono kicker (uppercase, tight tracking) + a single serif statement
- Numerals are encouraged — "188 BLOCKS · 19 MIN AGO · 1 / 6"

**Composition:**
- Strict grid. Lots of margin. The fact is small; the field is large.
- One graphic element per poster: a dot, a line, a circle, a stacked
  rectangle, a dial mark — chosen to echo the message
- Avoid pictorial illustration; this series is typographic with one
  geometric anchor

## The 20 (one prompt each)

Use these as the kicker / headline pair on each poster. Manus picks
the dominant color from the palette and the geometric anchor.

1. `RIGHT NOW` / morning in el segundo
2. `RIGHT NOW` / midday in el segundo
3. `RIGHT NOW` / afternoon in el segundo
4. `RIGHT NOW` / evening in el segundo
5. `RIGHT NOW` / night in el segundo
6. `LAST SHIP` / 19 minutes ago
7. `LAST SHIP` / just now
8. `TODAY` / two ships landed since midnight
9. `TODAY` / four ships landed since midnight
10. `CHANNEL MIX` / Battler is hot
11. `CHANNEL MIX` / Front Door is hot
12. `188 BLOCKS` / live in el segundo
13. `1 / 6` / pager mark
14. `TRY` / tap a pad in the drum room
15. `TRY` / open /tide for a five-scene break
16. `TRY` / see who is in /here right now
17. `FRESH` / on the twenty-fifth visit
18. `MAY 1` / friday in el segundo
19. `ONE LINE` / always changing
20. `POINTCAST` / shipping while the page is open

## Output

- 20 posters, each at **1080×1350 (4:5)** for IG-friendly + a
  **2400×3000** print-quality master for the same aspect
- Filenames: `now-line-poster-01-right-now-morning.png` (etc.)
- One contact-sheet thumbnail of all 20 at the top of the log so we
  can scan the whole chord at once
- Source prompts saved alongside outputs

## Where to write the result

`docs/manus-logs/2026-05-01-now-line-posters.md` with:
- Contact-sheet image at top
- Each poster inline with: title, hero color hex, prompt used, model used
- A two-line "what worked / what didn't" note at the bottom

## Approval gate

**Do not publish to PointCast or post anywhere external.** This is a
generation pass for Mike to pick from. After Mike picks the keepers,
we'll route the chosen ones into `/posters` or a new edition.

## Reference for the in-product NowLine itself

- Live preview: http://localhost:4321/ (NowLine sits under the masthead)
- PR: https://github.com/mhoydich/pointcast/pull/286
- Source: `src/components/NowLine.astro`

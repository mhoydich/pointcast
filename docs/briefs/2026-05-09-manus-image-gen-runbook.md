# Manus brief — image-gen runbook for /reads + Sprint 3 cards

**Date filed:** 2026-05-09 PT
**Filed by:** cc (Sprint 3 sprint, batch 2)
**Status:** awaiting Manus pickup

## Why

Sprint 3 opened the reading room at /reads — eight cc-voice editorial cards as of tonight, more landing through the sprint. Each card currently has no header image. The page reads fine without one, but a small consistent header asset across the whole library will help /reads feel like a place rather than a list.

We also have substantial Manus credit headroom (~63k remaining as of 2026-05-09 morning per Mike) that should be drawn down this month. This brief is the first sprint-3 Manus pull.

## Goal

One header image per /reads card, eight cards total, in a consistent visual language that matches PointCast's pixel-art-meets-mid-century aesthetic. Plus a documented runbook for Mike + future agents on how the Midjourney + ChatGPT 5.5 image-gen lane works for PointCast.

## The eight cards

1. **mcluhan** — *Understanding Media* (1964). Visual cue: a 1960s television set, a hand reaching for the dial, soft El Segundo dusk light. McLuhan portrait NOT required (rights). The TV is the thing.
2. **sumo** — the sport. Visual cue: a low-angle dohyō, salt mid-throw, two pixel Nouns in mawashi. Real Nouns from noun.pics if Manus can integrate; otherwise generic pixel sumo silhouettes.
3. **coffee-why** — chemistry/geography/ritual. Visual cue: an exploded-axonometric of a moka pot, with a microclimate hillside in the background. Soft sand + warm.
4. **good-charts** — Berinato 2×2. Visual cue: a hand-drawn 2×2 quadrant on graph paper, marker pen, with tiny chart sketches in each cell. NOT polished.
5. **treasure-island** — Stevenson 1883. Visual cue: a treasure map fragment in age-yellowed paper, X marks the spot, schooner on the horizon.
6. **socal-2026** — status note. Visual cue: a clear-view canyon hillside (post-fire regrowth, native chaparral), the El Segundo refinery towers in the far distance, sunset.
7. **palace** — London skate brand. Visual cue: tri-ferg shape (penrose triangle, NOT the Palace logo — original interpretation), VHS-era jaggedness, a London tower-block silhouette in the background.
8. **pickleball-starter-paddle** — paddle resource. Visual cue: four paddles laid out flat on a court, top-down, El Segundo Recreation Park midmorning light.

## Visual constraints (read all)

- **Aspect ratio:** 3:2 landscape, 1536×1024 PNG. (Optimal for the /reads card layout — generous landscape header that doesn't blow out mobile.)
- **Style anchor:** PointCast aesthetic per Mike's saved memory — *geocities + sim city, not clean AI product*. Pixel-art iso town, late-90s web chrome, saturated colors. Mid-century modern color palette acceptable. Avoid Sparrow-style polished stack.
- **Color palette:** anchor on PointCast warm sand `#f7efd9`, ink `#241f1a`, warm-orange `#993C1D`. Each image can lean one accent color appropriate to topic (sumo = brass/sand, palace = magenta/black, coffee = espresso brown, etc).
- **No text in image.** Captions get rendered in HTML on top — we're not baking text into PNGs because they'll outlive their headlines.
- **No real human faces.** Pixel/illustrated/silhouette/abstracted only. Avoids likeness-rights grief.
- **Real Nouns where applicable.** For sumo card, ideally fetch two random seeds from `https://noun.pics/{seed}.svg` (0–1199) and composite. If that's beyond Manus tooling, generic pixel sumo silhouettes are fine.

## Tooling lane

### Midjourney

Mike has `alpha.midjourney.com/@mhoydich`. Default model for sprint 3: **MJ v8.0** (or whatever's current — check `/settings` in MJ before starting). Style ref: pull from Mike's existing PointCast spotlight if MJ supports it. `--ar 3:2 --stylize 250 --niji 0` for the painterly cards (mcluhan, treasure-island, socal-2026, palace). `--ar 3:2 --stylize 50` for the pixel-art cards (sumo, coffee-why moka pot). The lower stylize on pixel work keeps the pixel grid honest.

### ChatGPT 5.5 (gpt-image-1.5)

Use ChatGPT 5.5's image-gen lane for **character consistency** — the moka pot in coffee-why, the four paddles in pickleball-starter-paddle, anything that needs a specific object form rendered consistently. ChatGPT 5.5 is better than MJ at "draw this exact thing" for product-shaped subjects.

### When to use which

- Atmospheric / painterly / scene-with-mood: **Midjourney**.
- Specific object / character consistency / product-shaped: **ChatGPT 5.5**.
- Pixel-art with Noun composition: try **MJ first with seed reference**; fall back to ChatGPT 5.5 if MJ can't hold the pixel grid.

## What to deliver

For each of the 8 cards:

1. PNG file at 1536×1024, named `reads-{slug}.png` (e.g. `reads-mcluhan.png`).
2. The prompt(s) used (so future agents can iterate).
3. A 1-line note on which lane (MJ vs ChatGPT 5.5) and why.

Save to `public/images/reads/`. cc will wire the `image` prop in each `/reads/{slug}.astro` after files land.

## Acceptance

- 8 PNGs, all 1536×1024, all under 200KB after compression.
- Prompts and lane notes captured at `docs/manus-logs/2026-05-09-reads-image-gen.md`.
- A runbook write-up at `docs/standards/2026-05-09-image-gen-lane.md` covering the MJ-vs-ChatGPT-5.5 decision tree, the PointCast color palette, and the no-text / no-real-faces constraints.

## Mike-side approval needed?

No. Manus runs the image-gen, cc wires the headers when files appear. If Manus needs Mike to approve a specific MJ generation for "is this on-brand?" — drop those into `docs/manus-logs/` for review and ping in the Slack-style brief. Otherwise pull and ship.

## Out of scope

- The /sumo room header (codex's room — separate brief).
- The /gandalf-v10 room header (kept deliberately spare per codex's design).
- /shop/palace product page imagery (separate /shop brief, lands later).

— cc, 2026-05-09 PT, El Segundo

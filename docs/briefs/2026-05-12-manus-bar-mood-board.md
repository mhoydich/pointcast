# Manus brief — Bar mood board image generation

**To**: Manus
**From**: Claude Code
**Date**: 2026-05-12
**Status**: open

## Context

Mike asked us to "explore a bunch of image generation, future states, mood boards, backgrounds, neat features" for the walking bar (FooterBarV6.astro on PointCast, opt-in at /bar-v6). He has a **Midjourney subscription** and credits at "manus and codex" — he wants the full mood board.

Codex's built-in `image_gen` tool worked for 6 images so far (saved at `public/bar/explorations/01..06.png` on this branch). The Codex MCP connection drops on larger batches, so smaller-batch generation works but is slow. Manus can help by generating the remaining ~6 directly via Midjourney or your preferred engine.

The live bar at https://pointcast.xyz/bar-v6 is the target — these images explore what its painted backdrop layer could look like.

## What's done

`public/bar/explorations/`:

| File | Style | Mood |
|---|---|---|
| 01-golden-hour-pixel-art.png | 16-bit pixel art | El Segundo at sunset |
| 02-night-stars.png | 16-bit pixel art | Night with stars + lit windows |
| 03-overcast-fog-morning.png | 16-bit pixel art | Marine layer rolling in |
| 04-storm-pacific.png | 16-bit pixel art | Lightning over the Pacific |
| 05-ghibli-watercolor.png | Studio Ghibli watercolor | Soft brush, warm afternoon |
| 06-moebius-line.png | Moebius ink line | Heavy Metal / French comics |

See `/bar-mood-board` route for the full presentation.

## What we need (6 more)

All images: ~1659×948 PNG, save to `public/bar/explorations/` with sequential numbering, transparent backgrounds NOT required (these are deep-background layers).

### 07 — KETTLE coffee shop hero shot
Pixel-art close-up. Cozy corner coffee shop at angle, warm amber wood facade, striped amber awning over a glass door, hanging brass coffee cup sign out front. Warm steam rising from chimney. Inside visible through window: pendant lights, espresso machine glowing, small pile of mugs on counter. Late afternoon golden light hitting the window. Sidewalk + small bench out front.

**Midjourney prompt**:
> 16-bit pixel art close-up of a cozy corner coffee shop, warm amber wood facade, striped amber awning over glass door, hanging brass coffee cup sign, warm steam rising from chimney, pendant lights and espresso machine glowing through window, mugs on counter, late afternoon golden light, sidewalk and small bench out front, hard pixel edges, dithered gradients, painted backdrop quality --ar 1:1 --v 6.1 --s 250

**File**: `public/bar/explorations/07-kettle-hero.png`

### 08 — STUDIO creative space hero shot
Pixel-art close-up. Two-story modernist building, deep navy facade, big slanted skylight on the angled roof catching evening light, vertical floor-to-ceiling window strip on the side with an easel + half-finished painting visible inside. Pencil-shaped golden sign above the door. Warm orange light spilling from the window onto the dark sidewalk. Twilight setting.

**Midjourney prompt**:
> 16-bit pixel art close-up of a two-story modernist creative studio building, deep navy facade, big slanted skylight catching evening light, vertical floor-to-ceiling window with easel and half-finished painting visible inside, pencil-shaped golden sign above door, warm orange light spilling onto dark sidewalk, twilight, hard pixel edges, dithered gradients --ar 1:1 --v 6.1 --s 250

**File**: `public/bar/explorations/08-studio-hero.png`

### 09 — DRUM music venue hero shot
Pixel-art close-up. Dark red brick facade, golden marquee at the top with vintage theater letter-bulbs, neon-pink trim accents, a soundproof black door with a small lit window. Late night, marquee glowing, three or four small noun-figure silhouettes near the entrance, warm sidewalk lighting.

**Midjourney prompt**:
> 16-bit pixel art close-up of a dark red brick music venue at night, golden marquee with vintage theater letter bulbs glowing, neon pink trim accents, soundproof black door with small lit window, faint music note silhouettes, three small pixel-art figures near the entrance, warm sidewalk lamps, hard pixel edges, painted backdrop quality --ar 1:1 --v 6.1 --s 250

**File**: `public/bar/explorations/09-drum-hero.png`

### 10 — Taller bar variant (200px equivalent)
Same El Segundo town composition but rendered in a taller frame (~1024×768). More vertical scene depth — visible foreground sidewalk in front of buildings, deeper sky with proper cloud layers. Imagine the walking bar grew from 80px tall to 200px tall. 16-bit pixel art aesthetic.

**Midjourney prompt**:
> 16-bit pixel art panorama of El Segundo California town in a taller frame, more vertical depth, foreground sidewalk in front of buildings, deeper sky with cloud layers, Chevron refinery on left, low-rise residential homes with palm trees, mid-rise aerospace offices, beach and Pacific Ocean on right, late afternoon golden light, hard pixel edges, dithered gradients --ar 4:3 --v 6.1 --s 250

**File**: `public/bar/explorations/10-tall-bar.png`

### 11 — KETTLE interior view
What does the inside of the KETTLE coffee shop look like? Pixel art interior — counter with espresso machine, shelves with mugs, a few small tables, a noun-style pixel figure pouring coffee, warm pendant lights. Hand-painted pixel art. Square ~1024×1024.

**Midjourney prompt**:
> 16-bit pixel art interior of a cozy coffee shop, counter with espresso machine, shelves of mugs, a few small wooden tables, a small pixel-art figure pouring coffee, warm pendant lights, sunlight through a window, hand-painted pixel-art aesthetic, hard pixel edges, painted detail --ar 1:1 --v 6.1 --s 250

**File**: `public/bar/explorations/11-kettle-interior.png`

### 12 — Aerial / map view of El Segundo
Top-down or near-top-down pixel-art map of El Segundo as it'd look in the PointCast town. Refinery district to the west of Sepulveda, residential grid in the middle, aerospace campus along the eastern edge, beach + Pacific to the west. Streets visible, palms, parks. Pixel-art.

**Midjourney prompt**:
> 16-bit pixel art aerial map of El Segundo California, top-down view, Chevron refinery district on the west, residential street grid in the middle with small houses and palm trees, aerospace campus on the east edge with rectangular office buildings, sandy beach and Pacific Ocean along the west coast, streets visible, parks, hand-painted pixel-art map aesthetic --ar 1:1 --v 6.1 --s 250

**File**: `public/bar/explorations/12-aerial-map.png`

## Acceptance criteria

- 6 PNG files at the file paths listed
- Roughly the listed dimensions (close enough is fine — Midjourney rounds to its own grid)
- Visual consistency with the 6 already-generated images (same world)
- Note: 07, 08, 09 are close-ups so they DON'T need refinery / ocean in frame
- Save the original Midjourney prompts you used in `docs/manus-logs/2026-05-12-manus-bar-mood-board.md` along with which final image was picked from the 4-grid

## Where to write the result

`docs/manus-logs/2026-05-12-manus-bar-mood-board.md` — log file with:
- Each prompt used
- Which variant from the 4-grid was picked + why
- Direct link to the saved PNG in `public/bar/explorations/`
- Any prompt adjustments worth noting for future generations

## Approval needed?

No — just push the images and the log. Mike will look at `/bar-mood-board` after next deploy.

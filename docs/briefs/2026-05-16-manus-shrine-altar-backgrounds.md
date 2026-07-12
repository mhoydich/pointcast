# Manus brief — shrine + altar background imagery

**Date filed:** 2026-05-16 PT
**Filed by:** drum-claude on Mike's verbal brief: _"think shrines and alters, use midjourney for backgrounds, use chatgpt or manus for backgrounds"_

## Context

New register opening on pointcast.xyz: **shrines + altars**. Image-first contemplative surfaces. Each shrine = one background image + one ambient sound + one minimal interaction (drop a stone, light a candle, ring a bell). Sister to `/drum-pavilion` (audio-first meditative) but image-first.

First reference page is `/shrine-water` (drum-claude shipped 2026-05-16, currently on a CSS-gradient placeholder background pending real imagery).

## What we need

Eight 1920×1080 PNG backgrounds, generated via Midjourney, dropped into `/public/images/shrines/`. Each backs a different shrine surface.

## Direction (applies to every prompt)

- **Style**: painterly, soft-focus, contemplative — not photo-realistic
- **Influence**: Japanese / Shinto / Buddhist sensibility, but **never literal** (no temple gates with visible kanji, no Buddha statues, no shrine maidens — abstract enough to feel universal across cultures)
- **Palette**: deep navy `#0a1530` for shadows, cream `#f4ede0` for highlights, warm gold `#d8c89b` for accents. Should sit naturally with a dark UI overlay.
- **Composition**: leave breathing room in the center — UI cards sit there at ~480px wide, must remain readable
- **No text in image** (no signage, no characters, no watermarks)
- **Tone**: quiet, slow, slightly melancholy, never grand or imposing
- **Aspect**: 1920×1080 (16:9), final upscaled

## Eight prompts

### 1. `shrine-water.png`
A still reflective pool of water at blue hour, soft mist rising from the surface, mossy stones at the edges, single ripple expanding outward at center, low painterly clouds reflected in the water, contemplative.

### 2. `shrine-flame.png`
Three small flickering candles on a smooth dark stone slab at dusk, warm golden firelight, deep blue shadows around the edges, painterly, soft focus, contemplative.

### 3. `shrine-grass.png`
A field of tall summer grass swaying at golden hour, a faint dirt path leading into the distance, low golden light filtering through the blades, painterly, soft focus, contemplative.

### 4. `shrine-stone.png`
A small cairn of mossy stones balanced in a forest clearing at twilight, weathered surfaces, soft blue mist between the trees behind, painterly, contemplative.

### 5. `shrine-wood.png`
A simple wooden gateway in a quiet forest clearing at dawn, soft mist between dark tree trunks, golden light filtering from beyond, painterly, contemplative (no inscriptions, no signage).

### 6. `shrine-bell.png`
A single small bronze bell hanging from a weathered wooden frame in a still landscape at dusk, low warm light, soft shadow, painterly, contemplative.

### 7. `shrine-altar.png`
A dark wooden altar surface viewed from a low angle, soft candlelight from off-frame, small offerings arranged loosely (a smooth stone, a fallen leaf, a folded paper), painterly, contemplative — for the central `/altar` page.

### 8. `shrine-grove.png`
A grove of tall slender trees at twilight, several quiet paths converging at center, soft purple and gold light filtering through, painterly, contemplative — for the `/shrine` directory page (sets the mood for the whole register).

## Acceptance criteria

For each image, before delivering:

- **Readability check**: open the image and imagine a 480px-wide card centered on it with `#f4ede0` cream text. Is the text legible? If the center is too busy or bright, re-prompt for darker / softer center.
- **Cultural check**: confirm no visible kanji, no obvious religious figures, no signage. The mood should be cross-culturally contemplative.
- **Palette check**: dominant tones should sit in the navy → cream range with warm gold accents. Reject anything saturated red, electric blue, neon.
- **Resolution**: deliver at 1920×1080 PNG, not WebP or JPEG (we want sharp gradients and quiet color transitions).

## Delivery

- Place finished images at `/public/images/shrines/shrine-<name>.png`
- Document the final Midjourney prompts used + any iterations in `docs/manus-logs/2026-05-16-shrine-backgrounds.md`
- File one PR per batch (or single PR with all 8) and tag drum-claude or Mike for review

## Acceptance from drum-claude side

Once images land, I'll PR a one-liner CSS swap per shrine page to switch from placeholder gradient to `background-image: url('/images/shrines/shrine-<name>.png')`. No structural changes needed; the framework is already image-ready.

## Approval

Mike approval needed before generating? **No** for batch 1 — generate all 8 with the prompts above. Iterate based on the acceptance criteria. If any single image needs more than 3 re-rolls, flag it back to Mike rather than burning Midjourney credits.

— drum-claude

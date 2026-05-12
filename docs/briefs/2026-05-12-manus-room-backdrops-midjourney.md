# Manus brief — Painted room backdrops via Midjourney

**To**: Manus
**From**: Claude Code
**Date**: 2026-05-12
**Status**: open

## Context

Mike: *"Now that we are rolling how do we get beyond the last 25 years — interactivity, the bar, the nouns, interactions, immersiveness, etc maybe even 3d, thoughts?"*

The walking bar (FooterBarV6) has been pushed hard tonight — real El Segundo skyline, hand-painted building sprites, creature sprites, walker footprints, ambient audio, sunrise/sunset broadcasts, easels accumulating outside STUDIO. The bar is *place-y* now.

The room pages (`/coffee`, `/drum`, `/studio`, `/window`, `/me`) are still **text + chrome on a white page**. They feel like website pages, not rooms. The next step is **painted backdrops** — each room gets a hero image at the top that establishes its mood. The painted layer is what the bar does for the chrome; we want the same for the rooms.

I have **Codex `image_gen`** wired up via MCP and it's working (see `/bar-mood-board` for 11 generated images). Codex is good at pixel-art El Segundo panoramas. But Midjourney handles **interior scenes and Hopper-style oil painting** better — that's what these rooms call for.

**Mike has a Midjourney subscription** and wants Manus to run with it.

## What we need (5 painted room backdrops)

All images: ~1920×1080 (16:9) or 1600×900 OK, PNG, save to `public/rooms/backdrops/{slug}.png`. They'll be used as a deep-background hero image at the top of each room's page, with a subtle dark gradient overlay so text reads on top.

### 1. /coffee — KETTLE interior, oil painting

**File**: `public/rooms/backdrops/coffee.png`

**Mood**: Cozy corner coffee shop at golden hour. The kind of place you go to think. Warm wood, brass espresso machine, pendant lights, a few small tables with chairs, a stack of mugs on the counter. Light pouring through the front window onto the floor. A barista wiping the counter. Quiet — pre-rush.

**Midjourney prompt**:
```
Edward Hopper oil painting interior of a cozy small-town coffee shop at golden hour, warm wood paneling, brass espresso machine on the counter, pendant lights glowing, a stack of ceramic mugs, a few small wooden tables with chairs, late afternoon light pouring through the front window onto the floor planks, a single barista in apron wiping the counter, painterly brushwork, contemplative quiet mood, expensive light, 1950s American small-town aesthetic --ar 16:9 --v 6.1 --s 250 --style raw
```

### 2. /drum — DRUM venue interior, dramatic stage light

**File**: `public/rooms/backdrops/drum.png`

**Mood**: Inside a small music venue, just before a set. Dark wood floor, a drum kit on a small raised stage backlit by warm spotlights, exposed brick walls, vintage band posters on the side walls, scattered chairs. Maybe one person tuning a guitar at the edge of the stage. Intimate, anticipatory.

**Midjourney prompt**:
```
Oil painting interior of a small intimate music venue just before the show, dark wood floor, drum kit on a small raised stage backlit by warm yellow spotlights, exposed brick walls, vintage band posters along the walls, scattered chairs facing the stage, one musician in silhouette tuning a guitar at the edge of the stage, dramatic chiaroscuro lighting, anticipatory mood, late evening, painterly brushwork --ar 16:9 --v 6.1 --s 250 --style raw
```

### 3. /studio — STUDIO interior, an artist at work

**File**: `public/rooms/backdrops/studio.png`

**Mood**: A creative studio mid-process. An easel with a half-finished painting front and center, the slanted skylight overhead pouring in cool north light, a worktable with pencils and brushes, finished canvases leaning against the wall, a few houseplants. A figure (back to camera) standing at the easel, brush in hand, considering.

**Midjourney prompt**:
```
Oil painting interior of an artist's studio mid-process, big easel with a half-finished painting in the center, slanted skylight pouring in cool north light, worktable scattered with pencils and brushes and tubes of paint, finished canvases leaning against the back wall, a few large houseplants, a single figure in casual clothes standing back-to-camera at the easel with a brush, contemplative, dust motes in the light, painterly brushwork, late afternoon --ar 16:9 --v 6.1 --s 250 --style raw
```

### 4. /window — WINDOW observation room, view of El Segundo

**File**: `public/rooms/backdrops/window.png`

**Mood**: Inside a small observation room at WINDOW, looking out a large picture window onto El Segundo at golden hour. The refinery silhouetted in the distance on the left, low-rise homes and palm trees in the middle, Pacific Ocean shimmering on the right. Inside the room: a wooden chair turned to face the window, a small table with a cup of tea, a notebook. A figure sitting in the chair, back to camera, watching.

**Midjourney prompt**:
```
Oil painting interior of a small observation room with a large picture window looking out at El Segundo California at golden hour, view through the window: Chevron refinery silhouettes on the left, low-rise homes with palm trees, Pacific Ocean shimmering with white wave crests on the right, golden hour sky, inside the room: a single wooden chair turned to face the window, a small wooden table with a cup of tea and an open notebook, a figure sitting in the chair seen from behind, contemplative quiet mood, Edward Hopper influence, painterly brushwork --ar 16:9 --v 6.1 --s 250 --style raw
```

### 5. /me — DESK at home, evening

**File**: `public/rooms/backdrops/me.png`

**Mood**: A craftsman home's living room at evening. Warm pendant lights, a desk in the corner with an open laptop showing a glow, bookshelves along the walls, a window showing twilight outside with a porch light glowing, a comfortable chair. The room of someone who lives here and works here. Cozy, lived-in, present.

**Midjourney prompt**:
```
Oil painting interior of a craftsman home's living room at twilight, warm pendant lights glowing, a wooden desk in the corner with an open laptop showing a soft blue glow, floor-to-ceiling bookshelves along the walls full of books, a window showing the twilight street outside with a porch light just turning on, a single comfortable upholstered chair, a houseplant near the window, lived-in, cozy, contemplative present mood, Edward Hopper influence, painterly brushwork --ar 16:9 --v 6.1 --s 250 --style raw
```

## Acceptance criteria

- 5 PNG files at the file paths listed above
- Roughly 16:9 aspect (Midjourney's 16:9 lands at ~1456×816 — that's fine, can upscale via Midjourney if you want bigger)
- **Consistent visual language across the 5** — same painterly style, similar color temperature, similar atmospheric quality. Pick the best from each 4-grid based on which 5 feel like ONE artist made them.
- No text overlays from Midjourney (no signage, no "DRUM" written on walls, etc.)
- Save the prompts used to `docs/manus-logs/2026-05-12-manus-room-backdrops.md` along with which variant was picked

## How they'll be used

A future PR will wire each room's `.astro` page to render the backdrop as a CSS background-image on the page hero, with a `linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.75))` overlay so the H1 + body text reads on top. The backdrop sets the mood; the existing content layout stays intact.

This is the room-pages version of what the bar does as chrome. The room pages will stop reading like website pages and start reading like rooms.

## Optional stretch (if Midjourney credits allow)

A 6th image — a wide painted **lobby interior** — for `/lobby` (we don't have a room there yet but it would establish the place):

```
Oil painting interior of a small-town community lobby at evening, warm pendant lights, dark wooden floor, two upholstered chairs facing each other, a small round table between them with two cups of tea, a brass bell on a stand on the table, a noticeboard on the back wall with handwritten notes pinned to it, a window showing twilight outside, lived-in, intimate, Edward Hopper influence --ar 16:9 --v 6.1 --s 250 --style raw
```

**File**: `public/rooms/backdrops/lobby.png`

## Where to write the result

`docs/manus-logs/2026-05-12-manus-room-backdrops.md` — log file with:
- Each prompt used (verbatim)
- Which variant was picked from the 4-grid + why
- Any prompt adjustments worth noting
- Direct links to the saved PNGs in `public/rooms/backdrops/`

## Approval needed?

No — just push the images and the log. I (Claude Code) will pick up the next PR to wire them into the room pages once they land.

---

**Related**:
- The Codex-generated explorations live at `public/bar/explorations/` and are visible at https://pointcast.xyz/bar-mood-board
- The daily morning paintings live at `public/bar/daily/` and are surfaced on the homepage via Morning Hero
- The walking bar at https://pointcast.xyz/bar-v6 is the canonical example of "painted layer establishing place"

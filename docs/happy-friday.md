# HappyFridayBlock — Integration & Visual Notes

## File Placement

```
src/
  components/
    HappyFridayBlock.astro   ← drop here
  data/
    happy-friday.ts          ← drop here
  pages/
    index.astro              ← one-line insertion below
```

---

## One-Line Insertion in `src/pages/index.astro`

Place the block **immediately after your Spotify launcher / music block** so the Saturday playlist mode feels contextually adjacent:

```astro
---
import HappyFridayBlock from '../components/HappyFridayBlock.astro';
// ... your other imports
---

<!-- ... existing editorial blocks ... -->
<SpotifyBlock />                 {/* or whatever your music block is called */}
<HappyFridayBlock />             {/* ← insert here */}
<BaseballBlock />
<!-- ... rest of page ... -->
```

The component returns `null` outside the Thursday 5pm → Sunday 11am PT window, so it silently disappears on weekdays with zero layout impact.

---

## How the Rotation Works

| ISO Week % 5 | Mode | Content |
|---|---|---|
| 0 | Playlist | *Saturday Morning Coffee* — 7 tracks, slow/warm/coffee-shop |
| 1 | Cocktail | *The Paper Plane* — equal-parts recipe + origin story |
| 2 | Long Read | *The Architecture of Happiness* — de Botton, 2-sentence pitch |
| 3 | City Dispatch | *South Bay Saturday* — 3 LA spots with real notes |
| 4 | Ritual | *Friday's Ritual* — 3 small things, no optimization required |

---

## Visual Description (Screenshot in Words)

The block sits in the editorial column like a warm interruption. Against the site's standard cream (`#f6f2e8`), the `HappyFridayBlock` reads slightly warmer — its background is `#fdf8ee`, a shade closer to old newsprint — and it announces itself with a **2px ink border** with subtly uneven corner radii (3px/7px/5px/4px) that give it a hand-stamped quality.

A **4px gold vertical rule** (`#b8860b`) bleeds off the left edge, acting as the visual differentiator from the hard-news blocks that use the standard terracotta accent. The block casts a warm offset shadow — 5px right, 5px down, in translucent gold — so it appears to sit slightly above the page surface.

The **header row** holds three elements in a flex line: a 22×22px SVG sun icon that rotates slowly (one full revolution every 24 seconds, CSS-only, respects `prefers-reduced-motion`), the logotype *Happy Friday* in italic Lora at 1.55rem in terracotta (`#c94d2c`), and a small mono-spaced mode tag in the far right corner — e.g., `SATURDAY MORNING PLAYLIST` — in a thin border box, like a newspaper section slug.

Below a dashed rule, the content area varies by mode:

- **Playlist mode** renders a numbered track list with zero-padded mono counters (`01`, `02`…) in terracotta, each track in Lora serif, separated by dotted rules.
- **Cocktail mode** shows a two-column ingredient table with mono amounts in terracotta, followed by instructions in roman Lora and a gold-left-bordered italic story paragraph.
- **Long Read mode** is the most typographic: title in Mondwest, author in small-caps mono, then two paragraphs of Lora pitch copy at comfortable 1.7 line-height.
- **City Dispatch mode** uses filled terracotta circle counters (numbered 1–3) with the spot name in bold Mondwest and the note in italic muted Lora below.
- **Ritual mode** uses gold-outlined circle counters, each item in roman Lora, separated by dotted rules.

Every mode ends with a **mono meta footer** — e.g., `38 MIN · 7 TRACKS · BEST WITH A POUR-OVER` — in small uppercase tracking, separated from the content by a hairline rule. The overall effect is warm, editorial, slightly handmade, and unmistakably different from the harder grid blocks around it.

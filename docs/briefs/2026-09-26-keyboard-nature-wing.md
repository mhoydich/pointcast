# The Nature Wing: ten keyboard apps (2026-09-26)

Architect: Claude (Opus). Builders: Codex. Sol (`gpt-5.6-sol`) takes the four hardest apps,
Terra (`gpt-5.6-terra`) three, Luna (`gpt-5.6-luna`) three. Five of the apps carry art made
with Codex's built-in image generator.
Mike's ask: "10 more, use codex sol luna and terra, … use image generator as well, make fun,
special, go with a nature theme."

## Read first
1. `docs/briefs/2026-09-26-keyboard-ten-apps.md`: **the page contract (sections 1–11) applies
   in full.** That covers the platform files, tokens, nav, `is:inline` scripts, signal etiquette,
   privacy, 375px, and the quality bar.
2. One finished app from the first wing as a reference for shape and polish:
   `src/pages/keyboard/loops.astro` or `src/pages/keyboard/ear.astro`.

## What makes the Nature Wing different
- **Fun and special.** Each app has one *wonder moment*: something that makes a kid say "whoa"
  and makes a grown-up stay five more minutes. The spec for each app names it. Deliver it.
- **One true thing.** Each app carries one short, accurate nature fact in a small "field note".
  Only state things you are confident are well established. Hedge ("often", "can") when a claim
  varies. No invented species behavior.
- **Everything is playable.** Keyboard (letters and the home row) and touch both work. Nature is
  the instrument, not a backdrop.
- **Nature palette (on top of the family tokens):** moss `#7fa36b`, fern `#a9c98a`,
  sea `#6fb3b8`, deep `#1d4a55`, bark `#8a6a4a`, petal `#e7a3b3`, sun `#f2c14e`, dusk `#b5a8ee`.
  Keep `--bg:#101813`, the Georgia display type, the mono chrome, and the `✳` mark.
- **Nav:** the exact five family links, with `Shelf` marked current (the same markup as the
  first wing). The architect adds a "Nature Wing" section to `/keyboard/shelf`.
- **Motion:** canvas or SVG animation is welcome. Pause when the tab is hidden, cap it at 60fps,
  and give it a simplified still state under `prefers-reduced-motion`.

## Art (only for the five image apps)
- **Style for the whole wing:** *vintage naturalist gouache field-guide plate, soft hand-painted
  texture, muted moss / sea / bark palette with one warm accent, deep green-black background
  #101813 so it sits on the page, no text, no borders, no watermark.*
- Generate with your built-in image generator. Save the PNGs to
  `public/images/keyboard/<slug>/_src/`, then convert to web JPEGs with
  `sips -s format jpeg -s formatOptions 78 -Z 1200 in.png --out public/images/keyboard/<slug>/<name>.jpg`
  (use -Z 640 for small sprites and cards). Reference only the `.jpg` files from the page. **Delete
  `_src/` when you're done.** Target under ~250 KB per image and at most 6 images per app.
- Every image needs meaningful `alt` text, `loading="lazy"` below the fold, and explicit `width`
  and `height`.
- If image generation fails, finish the app with a CSS/SVG fallback, list what failed in your
  report, and leave a single `ART-TODO` comment at the top of the file.

## Ground rules
- Touch only `src/pages/keyboard/<slug>.astro`, at most one `public/js/keyboard-<slug>.js`, and
  (image apps) `public/images/keyboard/<slug>/`.
- No git (it's read-only in your sandbox anyway), no npm, no builds.
- Before you finish, extract every inline `<script>` body and run `node --check` on it.

## The ten

| # | Slug | Name | Model | Art | Wonder moment |
|---|---|---|---|---|---|
| 1 | `fireflies` | Firefly Choir | Sol | – | Fireflies you light blink out of step, then gradually **synchronize** (Kuramoto coupling) until the whole meadow pulses on one chord. |
| 2 | `mycelium` | Mycelium | Sol | – | Mushrooms you plant grow threads underground; a note travels the network hop by hop, turning one tap into an **echo canon**. |
| 3 | `whales` | Whale Song | Sol | ✓ | Hold keys to sing gliding calls; a far whale **answers your phrase back, transposed and slowed**, and your song becomes a repeating theme. |
| 4 | `tidepool` | Tide Pool | Sol | ✓ | Drop pebbles and the ripples **interfere**; anemones bloom and sing where waves meet, and the tide slowly rises and falls. |
| 5 | `birds` | Backyard Birds | Terra | ✓ | Each key is a synthesized California bird call; the **mockingbird learns** your last calls and sings them back as a medley. |
| 6 | `frogs` | Frog Pond | Terra | ✓ | A night chorus call-and-answer game; nail the rhythm and the **whole pond erupts** in a croaking chord under the moon. |
| 7 | `meadow` | Meadow | Terra | – | Every key plants a seed that **grows into a generative flower** that keeps humming its note; bees visit and replay the meadow. |
| 8 | `rain` | Rain Garden | Luna | ✓ | Keys drop rain on different surfaces (leaf, fern, tin roof, pond, stone); build a storm and a **rainbow chord** arrives after it passes. |
| 9 | `rings` | Tree Rings | Luna | – | Each day's short tune becomes a **tree ring**; the trunk grows through the year and plays outward from the heartwood. |
| 10 | `chimes` | Wind Chime Porch | Luna | – | Your chimes (bamboo, shell, brass) swing in **El Segundo's live wind** (Open-Meteo), and keys strike them too. |

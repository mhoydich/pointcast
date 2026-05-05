# Codex brief — 10 posters for today's shipping (ChatGPT image generation)

**Date filed:** 2026-05-04 PT (Sunday afternoon)
**Filed by:** Claude Code (cc) on behalf of Mike
**Type:** asset-generation sprint, image-gen
**Mike's ask (verbatim):** *"ok create 10 individual posters via codex, chatgpt image generation"*

## tl;dr

Today shipped a lot — Track 05, /special-brew, the UES hub, /sing, /blow, /card, /wrapped, /cheers, /handshakes, /explore. Generate **10 posters**, one per room, **each in a distinct visual style** so the series reads as a *day-of-shipping* compilation rather than a single series. Mirror the variety pattern of the existing `public/images/agent-derby/posters/` set (10 posters, 10 different aesthetic worlds — trapper-keeper, chrome-foil, xerox-punk, blueprint-lab, etc.).

Run via ChatGPT image generation (`gpt-image-1` or DALL-E 3, whichever is available). Save outputs to `public/images/posters/` with the filenames listed below. Open one PR with the 10 PNGs + a Block. **Mike approval required before any poster ships to a public PointCast surface** — landing the files in `public/` is fine; promoting them to home/footer/explore needs Mike eyes.

## Output spec

- **Format:** PNG, 1024 × 1536 (portrait, 2:3 ratio)
- **Path:** `public/images/posters/<NN>-<slug>.png` (matches the agent-derby precedent)
- **Filenames:** see each prompt below
- **Color profile:** sRGB
- **Anti-prompts (apply to all 10):** no AI sparkle, no neon gradients, no chrome, no glossy 3D renders, no photographic realism, no text spelled wrong, no extra fingers / hands artifacts, no watermarks, no signatures
- **Type rule:** if the model wants to render text, keep it minimal — title + subtitle only, no body copy. Most posters work better text-light or text-free; the room name will land as the filename.

## The 10 posters

Each has: filename, room (with link), aesthetic anchor (1-2 reference designers), palette (hex), one-paragraph image-gen prompt.

---

### 01 — UES Track 05 · The Rebuildable Town
**File:** `public/images/posters/01-rebuildable-town.png`
**Room:** [/ues/track-05](https://pointcast.xyz/ues/track-05)
**Aesthetic anchor:** Bauhaus / Swiss academic — Müller-Brockmann, Josef Albers
**Palette:** ink `#1a1208`, brass `#7a5024`, cream `#fcf6e7`, oxblood accent `#5a1818`

> Bauhaus academic poster for a fictitious university course called *The Rebuildable Town*. Strict 12-column Swiss grid. Top third: a single hand-drawn isometric pixel-art building (small mid-century modern house, one story, flat roof, two windows lit warm) in the upper-left at small scale. Center third: large brass-colored geometric shape — interlocking circle and square symbolizing town + curriculum. Bottom third: typographic block, left-aligned, sans-serif (think Akzidenz-Grotesk or Univers), with the course code "UES-05" in small monospace and "THE REBUILDABLE TOWN" set large in two stacked lines. Use cream background (#fcf6e7), ink (#1a1208) for text, brass (#7a5024) for the geometric anchor, single oxblood (#5a1818) accent dot somewhere. Generous negative space. Composition reads as a 1962 university announcement. No drop shadows, no gradients.

---

### 02 — Special Brew · today the kettle pours
**File:** `public/images/posters/02-special-brew.png`
**Room:** [/special-brew](https://pointcast.xyz/special-brew)
**Aesthetic anchor:** Andy Warhol pop-art repetition — *Campbell's Soup Cans* / *Marilyn Diptych*
**Palette:** seven cup tints: matcha `#7ba94e`, oolong amber `#c89358`, pu-erh `#5a3416`, jasmine green `#c8d088`, hibiscus pink `#9b1f3a`, espresso black `#321608`, hojicha `#8a4824`. Background cream `#fcf6e7`.

> Warhol-style pop-art poster: a 5-column × 7-row grid of identical pixel-art teacups, each cup tinted a different brew color from the palette. Cups are small (about 80px square in the source), repeating across the entire canvas with strict regular spacing. Each cup is the same simple silhouette — squat ceramic mug with a curl handle — but the liquid inside each cup is a different color from the palette (matcha green, oolong amber, pu-erh dark brown, jasmine pale green, hibiscus pink, espresso black, hojicha roasted brown, repeating). Cream off-white background. The repetition is the message: many brews, one ritual. No text, no title, no captions. The composition is the entire poster. Square cups, flat colors, no shading, no gradients, hand-drawn line weight (think silkscreen). Anti-realism — graphic, flat, pop.

---

### 03 — UES · University of El Segundo opens
**File:** `public/images/posters/03-ues-opens.png`
**Room:** [/ues](https://pointcast.xyz/ues)
**Aesthetic anchor:** Brutalist civic monument / 1970s Polish poster school
**Palette:** raw concrete `#a8a39a`, deep navy `#0f2240`, mustard `#c4952e`, bone `#efe7d6`

> Brutalist poster for the announcement of a small unaccredited university. A monolithic pixel-art concrete tower (5 stories tall, narrow slot windows, chunky cantilevered top) dominates the central vertical axis. Behind it, a flat navy `#0f2240` sky split horizontally with a mustard `#c4952e` band at the lower third (the El Segundo horizon). The tower is rendered in raw-concrete grey `#a8a39a` with hand-drawn pixel-art shading (no smooth gradients). At the building's base, three tiny silhouetted human figures stand looking up. At the very top of the poster, in cream sans-serif: "UES". At the very bottom, in small mustard mono: "EST. 2026 · EL SEGUNDO · UNACCREDITED". Strong vertical composition, civic and monumental. Polish poster school feel — slightly austere, slightly utopian.

---

### 04 — /sing · happy birthday, polyphonic at scale
**File:** `public/images/posters/04-sing-polyphonic.png`
**Room:** [/sing](https://pointcast.xyz/sing)
**Aesthetic anchor:** Roy Lichtenstein comic-book benday-dot
**Palette:** primary red `#d8232a`, primary yellow `#f5d03c`, primary blue `#1f4e9c`, ink `#0a0a0a`, paper `#fcf6e7`

> Comic-book pop-art poster in Roy Lichtenstein style. Six color-coded square tiles arranged in a 3×2 grid filling the upper two-thirds of the poster. Each tile contains a single bold capital syllable — HAP / PY / BIRTH / DAY / TO / YOU — set in chunky comic-book sans-serif (think classic Marvel cover lettering). Each tile uses a different pop palette color from the list above. Inside each tile, behind the syllable, hand-drawn benday dots (visible halftone) at varying density. Below the grid, a speech-bubble shape (yellow bordered ink) saying "TAP TO SING" in smaller all-caps. At the very bottom, small ink text: "/sing — polyphonic at scale". Heavy black ink outlines around every shape (think 4px stroke). Comic-book paper-cream background. No realism, no shading beyond benday dots.

---

### 05 — /blow · one candle, one wish
**File:** `public/images/posters/05-one-candle.png`
**Room:** [/blow](https://pointcast.xyz/blow)
**Aesthetic anchor:** Minimalist Japanese ukiyo-e poster — Hokusai negative space, Ikko Tanaka modern
**Palette:** indigo `#1f3050`, paper white `#f8f3e3`, ember orange `#e85a1a`, soft grey `#9b9183`

> Japanese minimalist poster, vertical orientation. The composition is 80% empty paper-white space. In the lower-third center, a single tall pixel-art candle stands alone, set on a tiny circular plate. The candle is cream-colored, very thin and tall (occupies about 1/4 of the poster height). At the candle's tip, a single small ember-orange flame, drawn with hand-painted ukiyo-e brush-stroke energy (slightly flickering, asymmetric). Above the flame, three tiny indigo `#1f3050` smoke wisps rising and dissipating into negative space. No other objects. Background is a slightly textured paper-white `#f8f3e3` (think washi paper). At the very bottom-left, in small vertical Japanese-style text but in Latin characters, in indigo: "ONE CANDLE / ONE WISH". Composition reads as quiet, ceremonial, breath-held. No frame, no border, no gradients. The negative space IS the poster.

---

### 06 — /card · a shareable birthday card via URL
**File:** `public/images/posters/06-shareable-card.png`
**Room:** [/card](https://pointcast.xyz/card)
**Aesthetic anchor:** Vintage 1950s American greeting card — chromolithograph, kitschy maximalism
**Palette:** rose pink `#e88aa3`, mint green `#7dc4a3`, sunny yellow `#f5d03c`, cake-frosting white `#fffaef`, brown ink `#3a2818`

> Vintage 1950s American greeting card aesthetic. Maximalist composition: in the center, a large pixel-art birthday cake (three tiers, white frosting, rose-pink piped roses, a single yellow candle on top). Surrounding the cake, scattered across the poster: small confetti shapes, ribbons, paper streamers in mint, rose, yellow. Top of poster, in flowing cursive script (think 1950s Hallmark), in brown ink: "Happy Birthday". Bottom of poster, in small all-caps mono: "/card — share a birthday via URL". Background a pale rose pink `#e88aa3` with subtle hand-drawn polka dots. Color palette saturated and warm, intentionally kitschy and cheerful. Slight letterpress / risograph imperfection. Drawn with thick lines, flat colors, no realism. The kitsch is the point.

---

### 07 — /wrapped · open a wrapped present
**File:** `public/images/posters/07-wrapped-present.png`
**Room:** [/wrapped](https://pointcast.xyz/wrapped)
**Aesthetic anchor:** 1980s Memphis Group / Ettore Sottsass — postmodern pattern explosion
**Palette:** electric pink `#ff4d8a`, lemon `#ffd028`, teal `#22b3a8`, black-white checker, bone `#efe7d6`

> Memphis Group postmodern poster. The center holds a large pixel-art wrapped gift box (about 60% of the canvas), tilted slightly off-axis at maybe 8°. The wrapping paper on the box is a wild Memphis pattern: black-and-white squiggle, electric pink dots, teal triangles, lemon yellow zigzag — three or four patterns coexisting on different faces of the box. Crowning the box, a flamboyant ribbon bow in lemon yellow with electric pink edges. Around the gift box, scattered Memphis decorative elements: a teal squiggle, a black-and-white checkerboard parallelogram, a pink dot cluster. Background is bone `#efe7d6` with a subtle confetti speckle. No text on the poster. Composition reads as 1985 Sottsass laminate, joyful and chaotic. Flat colors, hand-drawn lines, no shading, no realism. Bold and unserious.

---

### 08 — /cheers · clink glasses with a Noun
**File:** `public/images/posters/08-cheers-clink.png`
**Room:** [/cheers](https://pointcast.xyz/cheers)
**Aesthetic anchor:** Art Deco — Cassandre's *Dubonnet* / *Normandie* travel posters
**Palette:** champagne gold `#d4a83c`, deep midnight `#0e1230`, cream `#fcf6e7`, oxblood accent `#5a1818`

> Art Deco poster in the style of A.M. Cassandre's 1930s French aperitif advertisements. Two stylized champagne flutes in the center, tilted toward each other, just touching at the rims (the clink moment). The glasses are rendered in geometric Art Deco style: long stems, perfect triangular bowls, crisp angular highlights. Each glass holds champagne in champagne-gold `#d4a83c` with three small bubbles drawn as perfect circles rising. Background a deep midnight `#0e1230` with a subtle Art Deco radial sunburst pattern emanating from where the glasses meet (gold rays). Behind one of the glasses, a small pixel-art Noun head (square pixel-art character with simple geometric features) peeks in as the second clinker — keep the Noun stylized to fit the Deco geometry, not photorealistic. Top of poster, in Art Deco geometric typeface: "CHEERS". Bottom: small cream mono text "POINTCAST · /cheers". Composition vertical, symmetric, ceremonial.

---

### 09 — /handshakes · bilateral receipts ledger
**File:** `public/images/posters/09-handshakes-ledger.png`
**Room:** [/handshakes](https://pointcast.xyz/handshakes)
**Aesthetic anchor:** Soviet constructivist / El Lissitzky / Rodchenko — propaganda poster geometry
**Palette:** Soviet red `#c91d23`, ink black `#0a0a0a`, paper cream `#f0e6d2`, slate grey `#5e5e5e`

> Soviet constructivist poster, El Lissitzky in spirit. The composition is built on a strong diagonal axis from lower-left to upper-right. Two large geometric hands meet at the center of the poster — one rendered in Soviet red `#c91d23`, the other in ink black `#0a0a0a`. The hands are highly stylized, almost rectangular, with each finger as a parallelogram. The handshake forms a perfect 90° angle at the wrist. Behind the hands, a constructivist composition: bold red diagonal stripes, a black perfect circle in the upper-right, a slate grey rectangle anchoring the lower-left. At the top in chunky sans-serif, in red: "HANDSHAKE". At the bottom, in small black mono: "BILATERAL RECEIPT LEDGER · /handshakes". Background paper cream `#f0e6d2` with subtle vertical halftone texture. Composition is propagandistic, urgent, bilateral. Flat colors, geometric, no shading.

---

### 10 — /explore · the PointCast feature directory
**File:** `public/images/posters/10-explore-directory.png`
**Room:** [/explore](https://pointcast.xyz/explore)
**Aesthetic anchor:** Mid-century travel poster — Cassandre's *SNCF*, *VISIT CALIFORNIA* WPA series
**Palette:** terracotta `#c95c2e`, deep teal `#1f5d6e`, mustard `#c4952e`, sage `#8aa07a`, cream `#fffdf7`

> Mid-century travel poster in the WPA / Cassandre tradition. The poster advertises "POINTCAST" as a destination. Composition: foreground is a pixel-art isometric small town silhouette across the lower third (mid-century houses, palm trees, a small drum-shaped building, a kettle on a roof, a bell tower) rendered in flat terracotta `#c95c2e` with deep teal `#1f5d6e` shadows. Above the town, a graphic mid-century stylized sun setting over the Pacific — perfect circle in mustard `#c4952e` with sage `#8aa07a` rays radiating upward. Sky split horizontally: lower band cream `#fffdf7`, upper band deep teal `#1f5d6e`. At the top, in chunky travel-poster sans-serif, in cream: "VISIT POINTCAST". Subtitle below in smaller mustard text: "EL SEGUNDO, CA · 200+ ROOMS". At the bottom, small mono: "/explore — the door directory". Composition reads as 1958 California State Parks poster. Flat colors, hand-drawn isometric pixel art, no realism, no gradients.

---

## Acceptance criteria

- [ ] 10 PNG files at the listed paths, 1024 × 1536, sRGB
- [ ] Each poster reads as a different visual world (the variety is the point)
- [ ] No spelled-wrong text, no AI artifacts (extra fingers, garbled type)
- [ ] Color palette per-poster matches the listed hex codes within reason
- [ ] One PR with all 10 PNGs + a Block 04XX (next free at write-time) summarizing the series
- [ ] Block links to each poster path AND to the room each one announces
- [ ] PR description includes the model used (gpt-image-1 / DALL-E 3 / etc.) so we can rerun if needed
- [ ] **Mike approval before any poster goes live on a public PointCast surface** (homepage, footer, /explore strip, social syndication). The files in `public/images/posters/` are fine to land — promoting them to user-visible chrome is the gate.

## What NOT to do

- Don't write text descriptions instead of generating images — Mike asked for actual posters
- Don't reuse a single visual style across all 10 — the *variety* is the brief (mirror agent-derby's 10-different-worlds approach)
- Don't put excessive text in the poster — title + subtitle max
- Don't add a watermark, signature, or "AI generated" mark
- Don't promote any of these to homepage/footer without Mike eyes — landing the files in `public/` is approved; promoting them isn't
- Don't auto-merge the PR — let Mike review the actual images

## Why this matters

PointCast doesn't currently have a poster wall — assets live scattered across `public/images/agent-derby/posters/`, `public/collabs/arena/graphics/`, etc. A daily *day-of-shipping* poster series is a clean way to celebrate the work and give the rooms visual anchors that can syndicate (Manus to Bluesky, Farcaster, Nextdoor, possibly objkt as CC0).

Today shipped a lot. Ten posters, ten worlds, one Sunday.

— cc, on behalf of the residents · 2026-05-04 PT · El Segundo

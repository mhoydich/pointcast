# Baby Bonfire: the look

The hub at `public/baby-bonfire/index.html` was redrawn on 2026-11-12 from the two pages
people answered to: the copper hearth film (Prayer Fire) and the tile island (A Higher
Purpose). This note is the kit for giving the 21 scene pages the same look later.

## Palette

| Name | Hex | Use |
| --- | --- | --- |
| night | `#15100c` | page background, warm near-black |
| soot | `#1e1712` | cards, notice box, the cabinet back is `#1b140f` |
| shelf | `#6b4f3a` | cabinet frame and shelf lines |
| paper | `#f1e6d6` | body text |
| dim | `#bcac97` | secondary text (about 8:1 on night) |
| ember | `#ff9a4a` | small labels, the notice border |
| glow | `#ffd27a` | section labels, lit things |
| copper | `#b8673a` / lit `#e0955c` / dark `#8a4a28`, `#7a3f22` | metal |
| stone | `#8f857a` / lit `#b9ae9f` / dark `#5e564e` | stone, ceramic |
| wood | `#6e4a30` / lit `#a9774b` | wood |
| linen | `#d9cbb4` | candles, cloth, pages |
| flame | `#ffb24d` with core `#fff1c9` | flames, only when lit |
| cool | `#6fa89c` / light `#7fc4b3` | the one cool accent: glass, signal, a tag |

No purple, and no gradients on surfaces. The only gradients are light: `#bbGlow` (a
radial ember glow) and `#bbShade` (a soft ground shadow).

## Type

- Titles: one serif italic, `"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif`,
  system fonts only, the same stack Prayer Fire uses. No web fonts.
- Labels: the mono stack, 10 to 11px, uppercase, letter-spacing .1em to .12em.
- Body: the system sans stack, 15 to 16px.
- Text stays at 4.5:1 or better against its background.

## The objects

Each sketch has one object, kept on the hub as `<symbol id="bb-o-<slug>">` (slug as in
`public/baby-bonfire.json`). To use one on a scene page, copy its symbol and the two
gradients (`bbGlow`, `bbShade`) into that page's hidden `<defs>`, then
`<svg viewBox="0 0 120 106"><use href="#bb-o-<slug>"/></svg>`.

Rules they are drawn to, so new ones match:

- Box 120 x 106, the object standing on y = 103, with a `#bbShade` ellipse on the ground
  pushed a little to the right.
- Lit from the left, as if by the fire: the right half of each form carries a
  `#120c09` shade at opacity .22 to .38; small highlights on the left edges.
- Flat fills from the palette, no outlines, no houses.
- Anything that glows when the sketch is lit sits in a group with
  `style="opacity:var(--lit,0)"`. Set `--lit:1` on an ancestor to light it; custom
  properties pass into `<use>`.

| Slug | Object |
| --- | --- |
| light-the-hearth | the stone and copper hearth with a domed lid |
| the-shelf | five stones on a wooden tray |
| pieces-roam | a piece carried between floor tiles |
| the-rounds | a hand lantern with a candle |
| the-helper | a teapot-size helper on wheels, holding a snuffer |
| any-object | a cup with a tag dot on it |
| home-press | a bench of small machines: press, kiln, felt roll |
| paired-hearths | two oil lamps linked by a dotted arc |
| mesh-street | a signal mast |
| house-power | an ember bank jar with a hand crank |
| stations | a hand drum and mallet |
| the-table | a table with a covered flame and one far seat |
| weather-in-the-house | a weather glass |
| creatures | a bird at a hanging feeder |
| four-seasons | a year wheel on a stand |
| five-levels | five rising steps, a flame on the top one |
| seven-homes | a niche built into a wall, with a candle |
| cabinet-of-no-bounds | a cabinet with one door open on stars |
| ritual-atlas | an open atlas on a stand |
| anchors-and-open-time | three rings with three fixed pins |
| precedents | three frames leaning on the shelf |

## Lit

A visited sketch is stored in `localStorage['bb-street-v1']` by the scene page itself.
The hub marks those objects `.lit`: the object brightens, a halo rises behind it, its own
flame parts show, and a small ember sits beside it on the shelf. When all 21 are lit, the
brazier on top of the cabinet catches.

## Unfurl cards

The link-preview cards still wear the old dusk street. Its drawings were frozen into
`scripts/unfurl-cards/bb-street.html` so the hub could change without redrawing every card.
Redraw the cards from these objects in the same sprint as the scenes.

# Codex brief — Kennel Club · The December Sitting (31 daily dog portraits for Tezos)

**Date filed:** 2026-09-02 PT
**Filed by:** Claude Code (cc) on behalf of Mike
**Type:** asset-generation sprint, image-gen, daily-mint series
**Mike's ask (verbatim):** *"ok use codex to create a visual series with image generator for a character to mint every day in december on say tezos. make them very almost regal ralph lauren, dogs, one assigned to every day in september"*
**Series data (source of truth):** `src/data/kennel-club-december-sitting.json`

## tl;dr

Generate **31 original painted dog portraits**, one per calendar day of December 2026, through the local **poster-image-engine** workflow. Each portrait is a "sitting": a named dog of a distinct breed, dressed in heritage equestrian and Ivy menswear (tweed, tartan, cable knit, camel, navy, oxblood, brass), posed in a country-estate December setting, painted in a bright flat acrylic-and-screenprint register. Regal, warm, slightly amused. The series mints one token per day on Tezos; cc wires the contract and the page once the plates land.

**Calendar note.** December 2026 is confirmed as the mint calendar. Tezos minting is confirmed: 31 tokens, with token id = day − 1. Contract implementation is cc's follow-up.

**Do not use any brand name in prompts or outputs.** The look is described by materials, cut, and setting. No logos, monograms, crests, or trademarked patterns. No humans. Same boundary the Mascot Atlas and 2029 identity plates followed.

## Output spec

- **Engine:** poster-image-engine, `gpt-image-1` or the newest available image model, same flow as the Wednesday covers and Mascot Atlas plates
- **Size:** 1024 × 1280 PNG (portrait, 4:5), sRGB
- **Stable project dir:** `poster-image-engine/projects/kennel-club-december-sitting-2026/`
- **Public path:** `public/images/kennel-club/december-sitting/<NN>-<name>.png` plus a compressed `.webp` twin at the same basename
- **Filenames:** the `slug` field in the JSON (`01-winslow` … `31-maximilian`)
- **Verification:** open every plate, check for the standard failure set (extra legs, floating clothing, rendered text, human hands, brand-looking marks, dead-center framing). Regenerate any failures. Log the verified set in `docs/codex-logs/2026-09-02-kennel-club-december-sitting.md`
- **Data update:** flip each sitting's `image.status` from `pending` to `verified` in the JSON as plates pass
- **PR:** one PR with the 62 image files, the JSON status flips, and the Codex log. Landing files in `public/` is fine. Promoting them to any public PointCast surface needs Mike eyes.

## Style bible

Every prompt in the JSON is already composed as `styleBase + subject + scene + composition + antiPrompt`. Use them as written; tune only if the engine drifts.

**Style base**
> Painted portrait of a single dog in the manner of David Hockney's flat acrylic California clarity crossed with Andy Warhol's pop silkscreen: flat saturated color fields, crisp hard-edged shapes, bold simplified outlines, visible acrylic brush texture, off-register color blocks and a single high-key screenprint accent. Sun-washed poolside or drawing-room interiors are reduced to planes; no varnish gloom. The dog wears heritage equestrian and Ivy menswear: tweed, tartan, cable knit, camel hair, navy wool, oxblood leather, brass hardware. Dignified posture, slightly amused expression, eyes on the viewer. Anatomically correct dog with a natural coat; clothing sits plausibly on the body. Bright palette: swimming-pool blue, marigold, coral, lilac, spring green, with camel, navy, and oxblood wardrobe accents.

**Composition rule (ikebana balance)**
> Ikebana balance: asymmetrical, subject on one two-thirds side alternating by day parity, negative space on the other third, one focal point. Never dead-center.

**Anti-prompt (all 31)**
> No text, no lettering, no logos, no monograms, no brand marks, no humans, no hands, no cartoon styling, no neon, no glossy plastic 3D render, no AI sparkle, no watermark, no frame border.

**Palette**

| name | hex |
|---|---|
| swimmingPoolBlue | `#42bfea` |
| oxblood | `#5a1818` |
| camel | `#b98a4e` |
| navy | `#1c2a44` |
| marigold | `#f4b11a` |
| coral | `#f36d5d` |
| lilac | `#b7a0d2` |
| springGreen | `#8bcb78` |

## The 31 sittings

Full prompt text per sitting lives in the JSON under `sittings[].prompt`. This table is the human index.

| # | Mint date | Name | Breed | Title | Wardrobe | Scene | Subject side |
|---|---|---|---|---|---|---|---|
| 01 | 2026-12-01 | **Winslow** | Golden Retriever | The First Frost | a camel-hair overcoat with a cream cable-knit scarf | seated on wide stone estate steps at first frost, pale morning light, bare oaks behind | left |
| 02 | 2026-12-02 | **Hartley** | Black Labrador Retriever | The Library Hour | a navy wool blazer with brass buttons over a cream shirt collar | standing beside a rolling library ladder in front of floor-to-ceiling mahogany shelves, a green-shaded brass lamp lit | right |
| 03 | 2026-12-03 | **Marguerite** | Afghan Hound | The Estate Wagon | a camel coat with a silk headscarf tied under the chin and tortoiseshell sunglasses pushed up | seated in the back of a vintage wood-paneled estate wagon, door open, gravel drive and clipped hedges beyond | left |
| 04 | 2026-12-04 | **Barnaby** | Basset Hound | The Long Walk | a waxed cotton field jacket with a corduroy collar and a wool tattersall scarf | leaning against a dry-stone wall with a blackthorn walking stick propped beside him, low winter sun across a frosted field | right |
| 05 | 2026-12-05 | **Clementine** | Cavalier King Charles Spaniel | The Velvet Chair | a burgundy velvet ribbon collar with a single strand of pearls | perched on a tufted oxblood leather club chair beside a brass floor lamp, a folded tartan throw on the arm | left |
| 06 | 2026-12-06 | **Augustus** | Great Dane | The Tall Windows | a black-and-cream houndstooth blazer with an oxblood silk pocket square | standing before tall mullioned estate windows, snow falling on a formal garden outside, parquet floor | right |
| 07 | 2026-12-07 | **Fitzgerald** | Irish Setter | The Stable Aisle | a hunter-green quilted vest over a tattersall shirt with a knotted wool tie | in a stable aisle with a saddle on a wooden rack, brass nameplates on the stall doors, straw and lantern light | left |
| 08 | 2026-12-08 | **Penelope** | Standard Poodle | The Fireside | a cream fisherman knit sweater with a red-and-green tartan blanket draped over one shoulder | seated on a worn Persian rug before a stone fireplace, fire lit, framed hunting prints above the mantel | right |
| 09 | 2026-12-09 | **Alistair** | Scottish Terrier | The Highland Cap | a tweed flat cap and a long green tartan scarf wound twice | standing on a plaid-covered bench in a paneled gun room, antique barometer on the wall, misty hills through a small window | left |
| 10 | 2026-12-10 | **Beatrix** | Whippet | The Boot Room | a camel cashmere turtleneck | standing in a mirrored boot room, a row of polished tall riding boots lined up along the wall, wool coats on brass hooks | right |
| 11 | 2026-12-11 | **Theodore** | Bernese Mountain Dog | The Sleigh | a navy wool coat with a shearling collar | seated on the bench of a wooden sleigh piled with wool blankets, evergreen boughs and a brass lantern, snow-covered lane | left |
| 12 | 2026-12-12 | **Josephine** | Weimaraner | The Grey Morning | a double-breasted charcoal overcoat with a pale grey cashmere scarf | standing beside a stone fountain dusted with snow on a foggy morning, clipped yew hedges fading into mist | right |
| 13 | 2026-12-13 | **Montgomery** | English Bulldog | The Study | a black-watch tartan blazer with a wide oxblood bow tie | seated behind a leather-topped partners desk with a crystal decanter, green banker lamp, and a stack of leather-bound ledgers | left |
| 14 | 2026-12-14 | **Ophelia** | Borzoi | The Allée | an ivory cable-knit sweater under a long navy wool coat | walking a gravel allée between bare pleached trees, low sun, long shadows, an iron gate at the far end | right |
| 15 | 2026-12-15 | **Rutherford** | Airedale Terrier | The Wrapping Table | a brown Norfolk jacket with leather buttons and a knit tie | standing at a long oak table stacked with rolls of kraft and tartan wrapping paper, twine, brass scissors, and sprigs of holly | left |
| 16 | 2026-12-16 | **Genevieve** | Rough Collie | The Lantern Walk | a camel cape coat over a cream cable cardigan | on a snowy stone terrace at blue dusk, a lit brass lantern set on the balustrade, house windows glowing behind | right |
| 17 | 2026-12-17 | **Sebastian** | Dalmatian | The Piano | a cream shawl-collar cardigan with a red tartan scarf | seated at a grand piano in a drawing room, sheet music open, candles in silver holders on the lid, garland on the mantel | left |
| 18 | 2026-12-18 | **Wilhelmina** | Pembroke Welsh Corgi | The Wreath | a burgundy quilted jacket and small green wellington boots | sitting on the back steps of a brick house beside a fresh evergreen wreath with a tartan bow, snow on the railings | right |
| 19 | 2026-12-19 | **Bartholomew** | Bloodhound | The Horn Wall | a chestnut leather car coat with a heavy cream wool scarf | standing in a boot room where a row of brass hunting horns and coiled leather leads hang on a paneled wall | left |
| 20 | 2026-12-20 | **Cordelia** | Yellow Labrador Retriever | The Skates | a cream aran sweater with a green tartan blanket over the shoulders and a pair of leather ice skates hung around the neck | on the snowy bank of a frozen estate pond, bare willows, a wooden bench half-buried in snow | right |
| 21 | 2026-12-21 | **Ignatius** | Newfoundland | The Longest Night | a heavy navy double-breasted peacoat with the collar turned up | on a dark timber pier in a winter storm, oil lanterns swinging, spray and low cloud, the solstice night | left |
| 22 | 2026-12-22 | **Rosalind** | Vizsla | The Conservatory | a rust suede jacket with a cream silk scarf | standing in a glass conservatory among potted citrus trees, frost on the panes, iron plant stands and terracotta | right |
| 23 | 2026-12-23 | **Percival** | Wire Fox Terrier | The Staircase | a navy chalk-stripe suit with a red silk pocket square | standing on the landing of a grand curved staircase draped in evergreen garland and red velvet ribbon, chandelier above | left |
| 24 | 2026-12-24 | **Evangeline** | Samoyed | Christmas Eve | an ivory shearling coat fastened with a single gold pin | seated by a tall candlelit window, snow falling outside, a small brass candle-lit tree reflected in the glass | right |
| 25 | 2026-12-25 | **Reginald** | Saint Bernard | Christmas Morning | a red tartan dressing gown with velvet lapels and a cream silk cravat | seated in a wingback chair before a grand stone fireplace hung with stockings, a silver tray of cocoa and a leather-bound book | left |
| 26 | 2026-12-26 | **Harriet** | Beagle | Boxing Day | a brown tweed hacking jacket with a white stock tie and a gold pin | at a snowy hunt meet on a gravel forecourt, a steaming silver punch bowl on a trestle table, horses blurred in the background | right |
| 27 | 2026-12-27 | **Lancelot** | Irish Wolfhound | The Great Hall | a grey herringbone greatcoat with a wide wool collar | standing in a vaulted great hall beneath a faded tapestry and mounted antlers, a long oak table and iron candelabra | left |
| 28 | 2026-12-28 | **Isadora** | Greyhound | The Station Platform | a navy cashmere coat over a camel turtleneck | on a country station platform beside a brass-trimmed vintage railway carriage, steam drifting, leather luggage stacked on a trolley | right |
| 29 | 2026-12-29 | **Ambrose** | German Shorthaired Pointer | The Hedgerow | a green loden coat with horn buttons and a leather-wrapped flask in the pocket | standing at a snow-lined hedgerow at dusk, a stile and a distant lit farmhouse, pink winter sky | left |
| 30 | 2026-12-30 | **Florence** | English Springer Spaniel | The Letters | a cream cable-knit sweater with a tortoiseshell hair clip on one ear | seated at a small writing desk by a window, a stack of letters, a fountain pen, sealing wax and a brass letter opener | right |
| 31 | 2026-12-31 | **Maximilian** | Doberman Pinscher | The Midnight Toast | a black dinner jacket with satin lapels and a white silk pocket square | standing beside a silver tray with a single champagne coupe, a tall case clock reading midnight, black-and-gold ballroom shadows | left |

Arc: early December is frost, library, and stable. Mid-month turns to wrapping, wreaths, lanterns, and garland. The 21st is the solstice storm. The 24th and 25th are the two grandest interiors. The 26th is the Boxing Day meet. The 31st is black tie at midnight.

## What Codex returns

- Files changed: 31 PNG + 31 WebP under `public/images/kennel-club/december-sitting/`, JSON status flips, Codex log
- Build/test result: `npm run build:bare` and `npm test` green (the series has a test at `tests/kennel-club-series.test.mjs`)
- Any sitting that would not verify after three attempts, with the failure named, so cc can rewrite the scene
- Remaining risk: any plate that reads as a brand reference rather than a material description

## What happens after the plates land

- **cc:** `contracts/v2/kennel_club_fa2.py` (dedicated FA2, 31 token ids, TZIP-21 via `/api/tezos-metadata`, 7.5% royalty to Mike's main wallet, one token id opens per day in America/Los_Angeles), a `/kennel-club` page with a JSON twin, a Block, and discovery surfaces
- **Manus:** objkt collection setup and real-user mint QA per `docs/briefs/2026-09-02-manus-kennel-club-objkt.md`
- **Mike decides (waiting-on-mh):** edition model (24-hour open edition per sitting vs a fixed cap per sitting, proposed 31), price in tez, origination signer, and whether December or September is the mint month

# Codex brief — Kennel Club · The September Sitting (30 daily dog portraits for Tezos)

**Date filed:** 2026-09-02 PT
**Filed by:** Claude Code (cc) on behalf of Mike
**Type:** asset-generation sprint, image-gen, daily-mint series
**Mike's ask (verbatim):** *"ok use codex to create a visual series with image generator for a character to mint every day in december on say tezos. make them very almost regal ralph lauren, dogs, one assigned to every day in september"*
**Calendar correction:** Mike confirmed that December was a typo. The series is September 2026: 30 calendar-true sittings, with Sitting 31 dropped. Today is 2026-09-02, so Sittings 01 and 02 mint late.
**Series data (source of truth):** `src/data/kennel-club-september-sitting.json`

## tl;dr

Generate **30 original painted dog portraits**, one per calendar day of September 2026, through the local **poster-image-engine** workflow. Each portrait is a named dog of a distinct breed, dressed in heritage equestrian and Ivy menswear, posed in a late-summer / early-autumn El Segundo setting, painted in a bright flat acrylic-and-screenprint register. Regal, warm, slightly amused. The series mints one token per day on Tezos; cc wires the contract and page once the plates land.

**Calendar note.** September 2026 and Tezos minting are confirmed: 30 tokens, token id = day − 1 (0–29). The calendar remains calendar-true despite the first two late mints.

**Do not use any brand name in prompts or outputs.** Describe the look by materials, cut, and setting. No logos, monograms, crests, trademarked patterns, humans, or hands.

## Output spec

- **Engine:** poster-image-engine, `gpt-image-1` or newest available image model
- **Size:** 1024 × 1280 PNG (portrait, 4:5), sRGB
- **Stable project dir:** `poster-image-engine/projects/kennel-club-september-sitting-2026/`
- **Public path:** `public/images/kennel-club/september-sitting/<NN>-<name>.png` plus a compressed `.webp` twin
- **Filenames:** the JSON `slug` field (`01-winslow` … `30-florence`)
- **Verification:** open every plate; reject extra legs, floating clothing, rendered text, human hands, brand-looking marks, or dead-center framing. Regenerate failures.
- **Data update:** flip `image.status` from `pending` to `verified` only after the plate passes review.
- **Log:** write engine/model, regenerations, cost, time, and verified set to `docs/codex-logs/2026-09-02-kennel-club-september-sitting.md`.

## Style bible

Every JSON prompt is already composed as `styleBase + subject + scene + composition + antiPrompt`. Use it as written; tune only if the engine drifts. The September adaptation is specifically marine-layer mornings, sun-washed afternoons, first cool evenings, poolside, and beach-town interiors.

**Composition rule:** asymmetrical ikebana balance; subject on one two-thirds side alternating by day parity, quiet negative space on the other third, one focal point; never dead-center.

**Anti-prompt:** No text, no lettering, no logos, no monograms, no brand marks, no humans, no hands, no cartoon styling, no neon, no glossy plastic 3D render, no AI sparkle, no watermark, no frame border.

## The 30 sittings

Full prompt text lives in the JSON under `sittings[].prompt`. This table is the human index.

| # | Mint date | Name | Breed | Title | Wardrobe | Scene | Subject side |
|---|---|---|---|---|---|---|---|
| 01 | 2026-09-01 | **Winslow** | Golden Retriever | The Marine Layer | a camel cotton overshirt with a cream lightweight knit | seated on wide stone El Segundo steps in a soft marine-layer morning, eucalyptus and pale sky behind | left |
| 02 | 2026-09-02 | **Hartley** | Black Labrador Retriever | The Library Hour | a navy wool blazer with brass buttons over a cream shirt collar | standing beside a rolling library ladder in front of floor-to-ceiling mahogany shelves, a green-shaded brass lamp lit | right |
| 03 | 2026-09-03 | **Marguerite** | Afghan Hound | The Estate Wagon | a camel coat with a silk headscarf tied under the chin and tortoiseshell sunglasses pushed up | seated in the back of a vintage wood-paneled estate wagon, door open, gravel drive and clipped hedges beyond | left |
| 04 | 2026-09-04 | **Barnaby** | Basset Hound | The Long Walk | a waxed cotton field jacket with a corduroy collar and a lightweight tattersall scarf | leaning against a low stucco garden wall with a blackthorn walking stick propped beside him, sun-washed late-summer grasses beyond | right |
| 05 | 2026-09-05 | **Clementine** | Cavalier King Charles Spaniel | The Velvet Chair | a burgundy velvet ribbon collar with a single strand of pearls | perched on a tufted oxblood leather club chair beside a brass floor lamp, a folded tartan throw on the arm | left |
| 06 | 2026-09-06 | **Augustus** | Great Dane | The Tall Windows | a black-and-cream houndstooth cotton blazer with an oxblood silk pocket square | standing before tall mullioned beach-town windows, a bright formal garden and pool-blue sky outside, parquet floor | right |
| 07 | 2026-09-07 | **Fitzgerald** | Irish Setter | The Stable Aisle | a hunter-green quilted vest over a tattersall shirt with a knotted wool tie | in a stable aisle with a saddle on a wooden rack, brass nameplates on the stall doors, straw and lantern light | left |
| 08 | 2026-09-08 | **Penelope** | Standard Poodle | The Afternoon Room | a cream fisherman-knit cotton sweater with a red-and-green tartan throw draped over one shoulder | seated on a worn Persian rug in a breezy beach-town sitting room, sunlit mantel and framed sailing prints above | right |
| 09 | 2026-09-09 | **Alistair** | Scottish Terrier | The Highland Cap | a tweed flat cap and a long green tartan scarf wound twice | standing on a plaid-covered bench in a paneled gun room, antique barometer on the wall, misty hills through a small window | left |
| 10 | 2026-09-10 | **Beatrix** | Whippet | The Boot Room | a camel cashmere turtleneck | standing in a mirrored boot room, a row of polished tall riding boots lined up along the wall, wool coats on brass hooks | right |
| 11 | 2026-09-11 | **Theodore** | Bernese Mountain Dog | The Beach Wagon | a navy cotton chore coat with a cream canvas collar | seated in the open back of a vintage beach wagon with striped towels, a brass lantern, and a sunlit dune lane beyond | left |
| 12 | 2026-09-12 | **Josephine** | Weimaraner | The Grey Morning | a double-breasted charcoal linen jacket with a pale grey cotton scarf | standing beside a stone fountain in a marine-layer morning, clipped yew hedges softening into coastal mist | right |
| 13 | 2026-09-13 | **Montgomery** | English Bulldog | The Study | a black-watch tartan blazer with a wide oxblood bow tie | seated behind a leather-topped partners desk with a crystal decanter, green banker lamp, and a stack of leather-bound ledgers | left |
| 14 | 2026-09-14 | **Ophelia** | Borzoi | The Allée | an ivory cotton cable-knit sweater under a light navy cotton coat | walking a gravel allée between green pleached trees in clear September light, long shadows and an iron gate at the far end | right |
| 15 | 2026-09-15 | **Rutherford** | Airedale Terrier | The Parcel Table | a brown Norfolk jacket with leather buttons and a knit tie | standing at a long oak table stacked with rolls of kraft and striped wrapping paper, twine, brass scissors, and fresh citrus leaves | left |
| 16 | 2026-09-16 | **Genevieve** | Rough Collie | The First Cool Evening | a camel cape coat over a cream cotton cardigan | on a stone terrace at the first cool evening, a lit brass lantern set on the balustrade, beach-town windows glowing behind | right |
| 17 | 2026-09-17 | **Sebastian** | Dalmatian | The Piano | a cream shawl-collar cotton cardigan with a red tartan scarf | seated at a grand piano in a drawing room, sheet music open, low candles in silver holders on the lid, a sun-faded beach photograph on the mantel | left |
| 18 | 2026-09-18 | **Wilhelmina** | Pembroke Welsh Corgi | The Back Steps | a burgundy quilted jacket and small green wellington boots | sitting on the back steps of a brick beach house beside a fresh citrus-and-bougainvillea arrangement, striped towel on the railing | right |
| 19 | 2026-09-19 | **Bartholomew** | Bloodhound | The Horn Wall | a chestnut leather car coat with a heavy cream wool scarf | standing in a boot room where a row of brass hunting horns and coiled leather leads hang on a paneled wall | left |
| 20 | 2026-09-20 | **Cordelia** | Yellow Labrador Retriever | The Poolside Bench | a cream cotton aran sweater with a green tartan blanket over the shoulders and a pair of leather deck shoes set beside her | beside a clear blue pool at a beach-town estate, pale willows and a wooden bench in late-afternoon sun | right |
| 21 | 2026-09-21 | **Ignatius** | Newfoundland | The Evening Pier | a navy double-breasted cotton peacoat with the collar turned up | on a dark timber pier in a first-cool-evening sea breeze, oil lanterns glowing, low marine cloud over the water | left |
| 22 | 2026-09-22 | **Rosalind** | Vizsla | The Conservatory | a rust suede jacket with a cream silk scarf | standing in a glass conservatory among potted citrus trees, marine layer softening the panes, iron plant stands and terracotta | right |
| 23 | 2026-09-23 | **Percival** | Wire Fox Terrier | The Staircase | a navy chalk-stripe suit with a red silk pocket square | standing on the landing of a grand curved staircase dressed with citrus branches and red velvet ribbon, chandelier above | left |
| 24 | 2026-09-24 | **Evangeline** | Samoyed | The Window at Dusk | an ivory cotton coat fastened with a single gold pin | seated by a tall candlelit window at September dusk, a small brass citrus tree reflected in the glass | right |
| 25 | 2026-09-25 | **Reginald** | Saint Bernard | The Sunroom Morning | a red tartan dressing gown with velvet lapels and a cream silk cravat | seated in a wingback chair in a bright sunroom, a silver tray of iced cocoa and a leather-bound book beside a potted palm | left |
| 26 | 2026-09-26 | **Harriet** | Beagle | The Club Meet | a brown tweed hacking jacket with a white stock tie and a gold pin | at a late-summer riding-club meet on a gravel forecourt, a silver punch bowl on a trestle table, horses blurred in the sunlit background | right |
| 27 | 2026-09-27 | **Lancelot** | Irish Wolfhound | The Great Hall | a grey herringbone blazer with a light wool collar | standing in a vaulted great hall beneath a faded tapestry and mounted antlers, a long oak table and iron candelabra | left |
| 28 | 2026-09-28 | **Isadora** | Greyhound | The Station Platform | a navy cotton coat over a camel lightweight turtleneck | on a coastal station platform beside a brass-trimmed vintage railway carriage, ocean haze drifting, leather luggage stacked on a trolley | right |
| 29 | 2026-09-29 | **Ambrose** | German Shorthaired Pointer | The Hedgerow | a green loden coat with horn buttons and a leather-wrapped flask in the pocket | standing at a dry golden hedgerow at dusk, a stile and a distant lit beach farmhouse, coral September sky | left |
| 30 | 2026-09-30 | **Florence** | English Springer Spaniel | The Letters | a cream cable-knit sweater with a tortoiseshell hair clip on one ear | seated at a small writing desk by a window, a stack of letters, a fountain pen, sealing wax and a brass letter opener | right |

## What Codex returns

- 30 PNG + 30 WebP files under `public/images/kennel-club/september-sitting/`, JSON status flips, and the Codex log
- `node --test tests/kennel-club-series.test.mjs` green
- Any sitting that fails three attempts, with the failure named for cc to rewrite
- Remaining risk: a plate that reads as a brand reference rather than a material description

## What happens after the plates land

- **cc:** dedicated 30-token FA2, TZIP-21 metadata, and the `/kennel-club` page plus discovery surfaces
- **Manus:** objkt collection setup and real-user mint QA per `docs/briefs/2026-09-02-manus-kennel-club-september-sitting-objkt.md`
- **Mike decides:** edition model (24-hour open edition or fixed cap, proposed 30), price in tez, and origination signer

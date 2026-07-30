# Beer-adjacent desk objects — Midjourney worksheet

Filed: 2026-07-30

Companion to `2026-07-27-beer-desk-objects-sourcing.md` and
`2026-07-27-beer-desk-objects-prompts.json`. Those cover cost and the OpenAI
image engine. This covers Midjourney, which has no API — nothing can drive it
but a person, so this sheet is built to be pasted.

The lever is permutation syntax: one prompt containing `{a, b, c}` queues a
separate job per option. Six pastes queue 22 jobs; Midjourney returns a
four-frame grid per job, so roughly 88 frames to choose from.

The permutations deliberately mix new concepts with products from batches 1 and
2. That is the point — reshooting the existing items inside the same prompt
family under one `--sref` is what makes the whole line read as one catalogue
rather than three separate photoshoots.

## Lock the look first

A twenty-four image product set falls apart if every shot reads like a
different studio. Midjourney's style reference fixes that, but it needs a seed.

1. Run the hero prompt alone.
2. Upscale the best frame, copy its image URL.
3. Append `--sref YOUR_URL --sw 90` to every other prompt here.

`--sw` is style weight. 90 holds the look without overriding each object's
shape; drop toward 50 if forms start dissolving.

### Hero

```
product photograph of a small glossy ceramic pedestal shaped like a cresting ocean wave, deep ocean-blue glaze breaking into foam white, holding a plain unbranded aluminium can in a flat recessed shelf, condensation beading on the metal, warm walnut desk at night in a small studio, magenta-purple LED bar glowing behind at left, one soft warm key light raking from the right, subject right of frame with bare wood at left, editorial product photography, shallow depth of field, subtle film grain --ar 4:5 --stylize 250 --chaos 8 --no logos, text, lettering, brand names --v 7
```

## The four permutation prompts

Each fans out across a material family, so the batch stays coherent while the
objects vary.

### A · Ceramics — 5 products, portrait

```
product photograph of a small {ceramic wave-crest pedestal cradling a plain unbranded can, ceramic snack dish sculpted like rolling sand dunes with a tiny turned-wood scoop resting in a valley, ceramic dish shaped like a branching coral reef crusted with plain metal bottle caps like barnacles, tall narrow ceramic foam gauge incised with fine measure lines like a rain gauge, stepped three-terrace stoneware mesa dish holding salted nuts} on a warm walnut desk at night, deep ocean-blue and foam-white glaze with visible crazing, magenta-purple LED bar glowing behind, one warm key light from the right, subject right of frame with empty wood at left, editorial product photography, shallow depth of field, film grain --ar 4:5 --stylize 250 --chaos 8 --no logos, text, lettering, brand names --v 7
```

### B · Brass and metal — 5 products, portrait

```
macro product photograph of a small solid brass {bottle opener cast as a cresting ocean wave mounted on an oiled wood plaque, working tide clock with an engraved dial reading LOW and HIGH, fog bell suspended on a coiled spring, sundial using a bottle cap as its gnomon, hourglass frame filled with fine ocean-blue sand mid-pour} on a warm walnut desk at night, genuine patina pooling in the recesses and bright polished highlights along the edges, magenta-purple LED glow in the dark background, one warm key light raking across the metal, empty shadowed wood at right, shallow depth of field, film grain --ar 4:5 --stylize 300 --chaos 10 --no logos, brand names --v 7
```

### C · Soft goods and printed — 5 products, landscape

```
overhead flat lay on a warm walnut desk at night of {a neoprene can koozie textured like a weathered barnacled pier piling, a stack of cork coasters screen-printed with fine ocean depth-contour rings, a long ocean-blue felt shuffleboard mat with foam-white tide-line scoring bands and plain metal bottle caps as pucks, plain metal bottle caps printed as maritime signal flags laid in a row, a letterpress pocket logbook open to a ruled page like a ship's log}, a plain unbranded can entering at the frame edge for scale, magenta-purple LED raking from above, warm key light from the left, real material texture and paper fibre, editorial merch photography, film grain --ar 3:2 --stylize 200 --chaos 6 --no logos, brand names, readable text --v 7
```

### D · Acrylic, light and novelty — 5 products, portrait

```
cinematic product photograph of {a palm-sized clear acrylic block with a miniature breaking wave suspended inside throwing blue caustics onto the wood, a small glowing lightbox tile showing a backlit ocean wave spilling blue light across the grain, a sealed liquid wave-motion desk toy rocking in ocean blues, a miniature striped navigation buoy working as a warm desk lamp, a shallow bowl of tumbled sea glass swallowing plain metal bottle caps} on a warm walnut desk at night, magenta-purple LED burning in the dark background, one soft warm key light, asymmetric composition with one empty third, shallow depth of field, film grain --ar 4:5 --stylize 250 --chaos 12 --no logos, text --v 7
```

### Wildcard

High `--weird` stops Midjourney making catalogue photography and starts it
inventing objects. Most frames are unusable; the point is the one that isn't.

```
an impossible desk object for drinking beer by the ocean, invented marine instrument crossed with a snack vessel, brass and ceramic and blue glass, barnacles and tide marks and a hidden mechanism, warm walnut desk at night with magenta-purple light, museum specimen photography --ar 1:1 --stylize 600 --chaos 35 --weird 900 --no logos, text --v 7
```

## Why the parameters are what they are

| Parameter | Setting | Reasoning |
|---|---|---|
| `--stylize` | 200–300 | Enough for the night look; past ~400 Midjourney overrides the product's shape with its own taste. |
| `--chaos` | 6–12 | Low, deliberately. Chaos varies the four frames in a grid — useful for exploring, harmful when you want four usable takes of one object. |
| `--no` | logos, text | Cans must read as generic. Midjourney invents plausible brand marks unless told not to, and a fake brand on a product shot is a real problem. |
| `--ar` | 4:5 / 3:2 | Portrait for tall single objects, landscape for flat lays and rows. Wrong ratio means a cropped subject or invented background padding. |
| `--sref` / `--sw` | hero, 90 | The consistency mechanism. Without it, twenty-four shots from four prompts will not read as one catalogue. |

## Fifteen additions

Batches 1 and 2 covered plinths, coasters, trays, tiles, pins and koozies.
Thirteen of the fifteen below are genuinely new forms; two are deliberate
variants and are marked as such, because pretending otherwise would inflate the
count. "Cheap" means the route reuses artwork or stock forms.

| Product | What it is | Route |
|---|---|---|
| Foam Gauge | Narrow ceramic column incised like a rain gauge, for head height. A joke told in a real instrument. | ceramics |
| Tide Clock | Working brass tide clock dialled to El Segundo. The only item with genuine utility. | stock movement + custom dial — cheap |
| Fog Bell | Brass bell on a coiled spring. Ring it when the session ends. | metal fab |
| Cap Sundial | Brass dial using a bottle cap as the gnomon. | metal fab |
| Depth Contour Coasters | Cork coasters printed with bathymetric rings; condensation lands on the contours. *Variant of batch 2's Tide Chart Coasters — same substrate, different artwork.* | cork POD — cheap |
| Signal Flag Caps | Bottle caps printed as maritime flags; a set spells something in a row. | cap printing — cheap |
| Ship's Logbook | Letterpress pocket book for logging what you drank, ruled like a marine log. | print — cheap |
| Sea Glass Cap Catcher | Shallow bowl of tumbled glass that swallows caps. | ceramics + sourced glass |
| Barnacle Grip | Koozie with sculpted nubs that actually improve grip on a wet can. *Variant of batch 2's Pier Piling Koozie — same product, function-first rather than texture-first.* | neoprene fab |
| Piling Pen Cup | Pier-piling texture as a pen cup. The crossover item that sells to non-drinkers. | resin cast |
| Buoy Bank | Coin bank shaped like a channel buoy. For the beer fund. | resin cast |
| Wave Motion Toy | Sealed liquid desk toy rocking in ocean blues. | stock form + custom fill — cheap |
| Kelp Lanyard | Opener on a cast rubber lanyard textured like kelp. | rubber cast |
| Terrarium Coaster | Coaster with a sealed micro-terrarium under glass. | assembly — expensive, hero piece |
| Harbour Chime | Three brass tubes tuned to a foghorn interval, struck by a cap. | metal fab |

## Two warnings

**Midjourney will not respect the MOQ maths.** It renders whatever looks good,
including glaze effects, brass castings and multi-part assemblies a 25-unit run
cannot produce. Every frame is a mood reference, not a spec. When an image
lands, the next question is what it costs to make — that is what the sourcing
model is for.

**Permutation prompts spend fast.** Prompt A alone queues five jobs, each
returning a four-frame grid; all six pastes come to 22 jobs, which moves
visibly against a Basic plan's fast hours. Run the hero and Prompt C first —
those products are the cheapest to actually manufacture, so they are the most
useful images to own.

## Provenance

No images were generated for this sheet. Midjourney has no public API, and the
one image service connected to the cloud session (Higgsfield) is on a free plan
with zero credits. `api.openai.com` is also outside this environment's egress
allowlist. So this is a worksheet by necessity as well as by design — but for
Midjourney specifically, a worksheet is the only possible deliverable from any
agent, credentialed or not.

# Beer-Adjacent Desk Objects — Low-MOQ Sourcing Model

Filed: 2026-07-27 by cc. Companion to
`2026-07-27-beer-desk-objects-sourcing-model.xlsx`.

**Status:** planning estimates, not vendor quotes. Every cost in the workbook is
a Claude estimate of typical 2026 small-batch vendor pricing. Nothing here came
from a real quote yet, and nothing should be ordered off these numbers.

## What this is

Twenty product concepts came out of the desk-objects brainstorm — ten in batch
one, ten in batch two (Codex is generating images and per-item production specs
under issue #883). This model answers the only question that matters before any
of them get made: **what does it cost to find out if one sells?**

## The low-MOQ thesis

The lineup is deliberately sorted so that the cheapest tests are also the ones
closest to what already exists. The Network El Segundo wave plaques are printed;
the pin set, the tile game, and the swell calendar are all reuses of that same
artwork in a different substrate. Those should go first.

Four sourcing routes, in order of how little cash they need:

1. **Print-on-demand** (cork coasters, printed felt) — no MOQ in practice, no
   tooling, worst unit economics. Use to validate demand, never to scale.
2. **Local laser/print shops** (acrylic blocks, wood easels, laminated tiles) —
   MOQ 25, tooling under $100, one-week turns, and you can drive there.
3. **Small-batch fabs** (enamel pins, neoprene koozies, resin casts) — MOQ
   50–100, tooling $100–400, three-to-five week turns.
4. **Overseas metal/glass/ceramics** (brass opener, hourglass, ceramics) — MOQ
   100+, real tooling cost, six-to-ten week turns. Only after something proves
   itself in routes 1–3.

## How the workbook computes

`Assumptions` holds six global levers (freight %, duty %, defect allowance,
fulfillment per order, and assumed monthly sell rate). `Sourcing Model` holds one
row per product with its route, MOQ, tooling, unit cost, and retail price, then
derives:

- **Landed unit cost** = unit cost grossed up by freight + duty + defect allowance
- **Gross margin** = (retail − landed − fulfillment) ÷ retail
- **MOQ cash outlay** = tooling + (MOQ × unit cost) — the real number to look at
- **Break-even units** and **months to break even** at the assumed sell rate

Yellow cells are inputs; replace them with real quotes as they arrive and every
downstream number updates.

## Model output at current assumptions

Snapshot of what the workbook computes with the default levers (18% freight, 7%
duty, 5% defect, $5.50 fulfillment, 12 units/month). Change any yellow input in
the workbook and these move.

| Product | Route | MOQ | Tooling | Unit | Landed | Retail | GM | MOQ cash | BE units | Months |
|---|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Wave Plinth (can pedestal) | Small-batch ceramics studio | 50 | $250 | $6.50 | $8.45 | $34 | 59% | $575 | 29 | 2.4 |
| Tidepool Coaster | In-house resin casting | 25 | $180 | $4.20 | $5.46 | $24 | 54% | $285 | 22 | 1.8 |
| Snack Butte (terraced dish) | Small-batch ceramics studio | 50 | $300 | $8.00 | $10.40 | $42 | 62% | $700 | 27 | 2.2 |
| Cap Dominoes (tile game set) | Local print + laminate | 25 | $60 | $5.50 | $7.15 | $28 | 55% | $198 | 13 | 1.1 |
| Weighted Wave Block | Acrylic embedment fab | 50 | $200 | $9.00 | $11.70 | $48 | 64% | $650 | 21 | 1.8 |
| Cap Crane (desk gadget) | 3D print + hardware kit | 25 | $120 | $11.00 | $14.30 | $55 | 64% | $395 | 11 | 0.9 |
| Beer Archive Blocks | Laser-cut acrylic shop | 25 | $90 | $6.00 | $7.80 | $30 | 56% | $240 | 14 | 1.2 |
| Featured-Exhibit Easel | Laser-cut wood shop | 25 | $70 | $3.50 | $4.55 | $18 | 44% | $158 | 20 | 1.7 |
| Backlit Wave Tile | Print + LED puck assembly | 25 | $80 | $7.50 | $9.75 | $38 | 60% | $268 | 12 | 1.0 |
| Tide Line Tray (can rack) | Small-batch ceramics studio | 50 | $350 | $12.00 | $15.60 | $58 | 64% | $950 | 26 | 2.1 |
| Tide Chart Coasters (cork) | Cork print-on-demand | 50 | $40 | $2.80 | $3.64 | $16 | 43% | $180 | 26 | 2.2 |
| Crest Opener (brass, plaque) | Overseas metal fab | 100 | $400 | $7.00 | $9.10 | $36 | 59% | $1,100 | 51 | 4.3 |
| Session Hourglass | Overseas glass fab (stock + brand) | 100 | $150 | $5.00 | $6.50 | $26 | 54% | $650 | 46 | 3.9 |
| Dune Scoop Tray | Small-batch ceramics studio | 50 | $300 | $9.50 | $12.35 | $46 | 61% | $775 | 28 | 2.3 |
| Magnetic Cap Reef | Resin cast + magnets | 25 | $200 | $6.80 | $8.84 | $32 | 55% | $370 | 21 | 1.7 |
| Swell Calendar (acrylic + cards) | Laser-cut acrylic + card print | 25 | $100 | $5.20 | $6.76 | $30 | 59% | $230 | 13 | 1.1 |
| Buoy Lamp | 3D print + LED kit | 25 | $160 | $13.00 | $16.90 | $62 | 64% | $485 | 12 | 1.0 |
| NES Enamel Pin Set | Enamel pin fab | 100 | $120 | $3.20 | $4.16 | $18 | 46% | $440 | 53 | 4.4 |
| Cap Shuffle Runway (felt mat) | Printed felt/neoprene fab | 100 | $90 | $4.50 | $5.85 | $26 | 56% | $540 | 37 | 3.1 |
| Pier Piling Koozie | Custom neoprene fab | 100 | $110 | $2.60 | $3.38 | $14 | 37% | $370 | 72 | 6.0 |
| **TOTAL** | | | | | | | | **$9,558** | **554** | |

*Landed = unit cost + freight + duty + defect allowance. GM is net of
fulfillment. MOQ cash = tooling + (MOQ x unit cost).*

## Recommended first order

The intuitive first pick was the enamel pin set — it is the closest thing to the
plaques that already exist. The model disagrees, and the model is right: pins
carry a 100-unit MOQ against an $18 retail, which is $440 of cash and 53 units
to break even, one of the slowest items in the lineup. Low unit cost is not the
same as a cheap test.

The three cheapest real tests are all MOQ 25, all from local laser/print shops,
and all reuse the existing wave artwork:

| Item | MOQ cash | Break-even | Months |
|---|--:|--:|--:|
| Cap Dominoes | $198 | 13 units | 1.1 |
| Swell Calendar | $230 | 13 units | 1.1 |
| Backlit Wave Tile | $268 | 12 units | 1.0 |

Roughly $700 total, each paying itself back inside a month at the assumed sell
rate, and every one of them is the printed plaque in a different substrate.
Order the pin set second, once one of these three proves the demand and the
100-unit commitment stops being a guess.

Hold every ceramic piece (Wave Plinth, Snack Butte, Tide Line Tray, Dune Scoop)
until then. Ceramics carry the highest MOQ cash in the lineup, the longest lead
time, and the breakage allowance. The Pier Piling Koozie is the worst first buy
on paper — 72 units to break even, six months at the assumed rate — because a
100-unit MOQ against a $14 retail leaves almost no margin per unit to work with.

## Open items

- Real quotes for Cap Dominoes, Swell Calendar, and Backlit Wave Tile — Manus or
  Mike, whoever gets to a local laser/print shop first
- Codex's per-item production specs (issue #883) will replace the route guesses
  in column C with actual process decisions
- Sell-rate assumption of 12 units/product/month is a guess with no data behind
  it; the first order replaces it with a measurement

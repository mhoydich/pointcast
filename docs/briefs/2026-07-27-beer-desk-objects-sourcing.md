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

## Recommended first order

Three items, all reusing existing wave artwork, all MOQ 25–100, total cash outlay
well under a single ceramics run:

- **NES Enamel Pin Set** — the format that already landed; pins gift and ship flat
- **Cap Dominoes** — the printed plaque plus a rule card
- **Tide Chart Coasters** — POD, so effectively a free test

Hold every ceramic piece (Wave Plinth, Snack Butte, Tide Line Tray, Dune Scoop)
until one of the three above sells through. Ceramics carry the highest MOQ cash,
the longest lead time, and the breakage allowance.

## Open items

- Real quotes for the three first-order items — Manus or Mike, whoever gets to a
  vendor first
- Codex's per-item production specs (issue #883) will replace the route guesses
  in column C with actual process decisions
- Sell-rate assumption of 12 units/product/month is a guess with no data behind
  it; the first order replaces it with a measurement

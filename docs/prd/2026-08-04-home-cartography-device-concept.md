# Home Cartography — Concept

**Status:** v0 concept, pre-PRD
**Date:** 2026-08-04
**Owner:** Mike Hoydich (a Mike Hoydich production)
**Naming note:** PointCast already ships "Digital Identity Cartography" (`docs/prd/pointcast-cartography-2026-business.md`), which maps people and communities. Home Cartography is a sibling concept that maps **physical space and stuff**. Same brand family, different territory: identity maps who you are, home maps what you have.

## One-liner

Buy a device, walk your home, and it indexes everything you own — barcodes, QR codes, visual recognition — into a private, structured inventory that becomes your personal data API/MCP. Your house gets a map, your stuff gets a ledger, and AI gets permissioned access to both.

## The Product

### 1. The Device

A purpose-built home scanner (or phone-first app with an optional dedicated device):

- **Barcode / QR scanning** for packaged goods, electronics, books, media.
- **Computer vision** for everything without a code: furniture, art, tools, clothing, plants.
- **Spatial awareness**: room-by-room mapping so every item has a location, not just an identity. "The drill" becomes "the drill, garage, second shelf."
- **Receipt/email ingestion** as a passive companion: purchase history fills in what the camera can't (price paid, purchase date, warranty start).

The device is the wedge; the index is the product.

### 2. The Home Index

Everything lands in a structured, user-owned inventory:

- Item identity (product, model, serial where scannable)
- Location (room, container, shelf)
- Provenance (purchase date, price, retailer, receipt link)
- Condition and photos over time
- Documents (manuals, warranties, insurance riders)

### 3. Upload to AI — the Personal Data API / MCP

The index is exposed as **your own API and MCP server**. You grant access per-agent, per-scope. This is the unlock: once your home is machine-readable, any AI you trust can act on it.

## What It Enables

### Utility

- **Valuation**: live estimated value of everything you own — per item, per room, whole home. Insurance-ready export after a fire, flood, or theft claim.
- **Warranty & lifecycle**: automatic warranty tracking, recall alerts, "your water heater is 11 years old" nudges, manual lookup on demand.
- **Insurance**: a verified inventory is the best contents-coverage documentation that has ever existed. Carriers should discount for it.
- **Find my anything**: "where are the passports" is a query, not a scavenger hunt.

### New interaction models

- **Things are easier to sell.** Every item already has photos, model number, condition history, and market comps. "Sell the Peloton" is a one-line instruction — the listing writes itself, cross-posted to the right marketplaces.
- **"I'll go see if the XYZ is available."** Agents can check your inventory before you buy ("you already own a 10mm socket — it's in the garage bin 3"), lend against it ("neighbor's agent asks: does Mike have a tile saw?" — permissioned, of course), or shop for what's genuinely missing.
- **Household handoffs**: moving, estate planning, and divorce/separation splits become data operations instead of archaeology.

### Scoring & recommendations

- **Stuff-per-square-foot score**: an honest density metric. Too much stuff for your footage? The system says so, kindly, and suggests the 40 items you haven't touched in two years.
- **Duplication detection**: you own four phone chargers and three tape measures. Sell, donate, or stop buying.
- **Replacement intelligence**: "this is the item most likely to fail next year" and "the newer model uses 60% less energy."
- **Room grades**: utilization, value concentration, clutter trend over time.

### Games & entertainment

- **Home scavenger hunts** generated from your actual inventory — for kids, parties, or agents playing against each other.
- **Collection meta-games**: completion tracking for books, vinyl, LEGO, board games; trade matching with friends' (permissioned) indexes.
- **"Antiques Roadshow mode"**: point at the weird thing from grandma; get provenance research and a valuation narrative.
- **Time capsule**: your home index as a longitudinal artifact — what did the living room look like in 2026?

## Why Now

1. Vision models can finally identify arbitrary household objects without a barcode.
2. MCP makes "your data as a server" a real, standard interface instead of a CSV export.
3. Agents are becoming the buyer/seller/scheduler of record — they need a ground-truth model of your household to act well.
4. Insurance, resale, and estate workflows are still built on shoeboxes of receipts.

## Business Sketch

- **Device sale** (or app + optional hardware): one-time revenue, the acquisition wedge.
- **Index subscription**: storage, valuation refreshes, warranty/recall monitoring, MCP hosting.
- **Transaction take**: resale listings, insurance referrals, buy-back and trade-in flows.
- **Partner API**: insurers, movers, estate services pay for permissioned, user-approved access.

## Guardrails (day one, non-negotiable)

- The index is **user-owned**. Export everything, delete everything, always.
- No selling inventory data to third parties. Partner access is per-request, user-approved, scoped, and logged.
- No public inventory by default; sharing is opt-in per item/collection (e.g., a lendable-tools list).
- Valuations are informational, not financial advice; no investment framing.
- Kids' rooms and other sensitive zones can be excluded from scanning entirely.

## Open Questions

- Dedicated hardware vs. phone-first with a hardware upsell?
- Does the MCP server run locally (privacy-max) or hosted (convenience-max), or both?
- How does Home Cartography surface on PointCast — `/cartography/home` under the existing line, or its own route?
- Cold-start effort: what's the minimum viable scan (one room? 50 items?) that delivers a "wow" before fatigue sets in?

## Next Steps

1. Decide naming/route relationship to the existing Cartography line.
2. ~~Prototype the index schema (`item`, `location`, `provenance`, `document`, `valuation`) and a demo MCP server over a fictional household.~~ **Done (2026-08-14, PR #961):**
   - Concept board: `/cartography/home` (+ `.json`)
   - Demo household ("The Dune Street House," 20 items): `/cartography/home/demo` (+ `.json`)
   - Demo MCP server, six tools on `https://pointcast.xyz/api/mcp-v2` (and `/api/mcp`): `home_index_summary`, `home_index_find({query})`, `home_index_room({room})`, `home_index_valuation`, `home_index_lendable`, `home_index_sell_draft({itemId})`
   - Session log: `docs/claude-code-logs/2026-08-14-home-cartography.md`
3. Test the wedge: scan one real room, generate a valuation + sell-one-item flow, and see if it feels like magic. Field kit published at `/cartography/home/field-kit` — awaiting a real-room scan by Mike.
4. Receipt ingestion spec — done (`docs/prd/2026-09-02-home-cartography-receipt-ingestion-spec.md`).

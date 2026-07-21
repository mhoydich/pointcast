# PointCast Today's Art v2

## North star

Turn Today's Art from one excellent hanging into a durable daily publishing system: each edit is date-addressable, source-honest, visually distinct, and available as both a human gallery and a machine-readable manifest.

## Product shape

1. **Edition spine** — `/gallery/editions` and `/gallery/editions.json` list every dated edit. `/gallery/today` remains the front door; dated routes become permanent citations.
2. **Curator file** — one small typed data file per edition holds title, thesis, room order, works, source IDs, captions, and mint status. Layout code stays reusable.
3. **Source desks** — Midjourney archive IDs, Ideogram profile IDs, and ImageApp export IDs enter through explicit adapters. Missing or maintenance-blocked originals remain visibly unavailable instead of being silently substituted.
4. **Room grammar** — an edition can choose four to six named rooms and a palette, but every room keeps the same accessible figure, caption, provenance, and responsive contracts.
5. **Daily handoff** — a preflight reports new candidates, duplicates, missing originals, oversized sources, and broken public URLs before an edition can publish.
6. **Open-ad relationship** — art editions expose only clearly labeled contextual placements. V2 can accept paid reservations after inventory, expiry, creative review, and public receipts exist; no behavioral profiles.

## Delivery sequence

### Slice A — edition spine

- Ship the human and JSON edition indexes.
- Give the July 20 edit a stable edition record and permanent canonical date.
- Link the edition index from Today's Art.

Acceptance: the current edit is discoverable from HTML, JSON, sitemap, and llms surfaces without scraping the homepage.

### Slice B — data-driven renderer

- Move room copy and work metadata out of `today.astro` into a typed edition module.
- Render both `/gallery/today` and `/gallery/{date}` from the same edition object.
- Add duplicate-ID, missing-file, total-count, and provenance tests.

Acceptance: a second edition requires data and assets, not a copied page.

### Slice C — source preflight

- Add a local command that inventories Midjourney, Ideogram, and ImageApp candidates.
- Report cloud placeholders, source availability, dimensions, hashes, and duplicate images.
- Produce a review-only contact sheet manifest; never publish or mint automatically.

Acceptance: a curator can select a new room from one bounded candidate report.

### Slice D — ad server handoff

- Separate placements, creatives, campaigns, and receipts.
- Add start/end dates, contextual allowlists, creative approval, and deterministic rotation.
- Keep impression reporting aggregate and privacy-preserving.
- Gate Tez reservation and wallet settlement behind a separately reviewed live contract.

Acceptance: every served creative maps to a public receipt, and expired or unapproved campaigns cannot render.

## Guardrails

- Curated and published does not mean minted.
- Preserve source/profile attribution even when an asset is copied locally for reliability.
- Never claim a live ImageApp review while the service is in maintenance mode.
- No private wallet material, behavioral profiles, silent sponsored content, or automatic minting.
- Production is done only after exact-commit deploy and live browser verification.

## Started now

Slice A begins in the follow-up commit: edition index HTML + JSON, discovery links, and a stable July 20 record.

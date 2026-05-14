# Live Feed NFTs four-sprint ladder

**Date filed:** 2026-05-14 PT
**Filed by:** Codex on Mike's brief: _"publish begin a 4 feature sprint, followed by three others"_
**Board source:** Whimsical to-do list: LIVE FEED NFTs, Dynamic Competition, Dynamic Backgrounds, Additional Iterations: Sports/Sea/Weather Data Single and Multi Data NFTs

## Sprint 1 begins now: four-feature mint-prep surface

Ship the first public working surface at `/live-feed-nfts` with a JSON companion at `/live-feed-nfts.json`.

1. Dynamic backgrounds
   - Lane-aware card treatments for weather, sea state, competition, and multi-feed editions.
   - Visual pressure changes when rarity pressure is adjusted.

2. Dynamic competition
   - Competition lane ranks live wire events against weather and sea context.
   - Preview copy and attributes expose the scoring inputs so the mechanic is legible before contract work begins.

3. Weather and sea live adapters
   - Weather pulls from the local PointCast weather API, with Open-Meteo fallback.
   - Sea state pulls from Open-Meteo Marine for wave height, swell, period, and direction.

4. Single and multi metadata export
   - Each lane produces mint-prep metadata.
   - Edition mode toggles between single-source and multi-source cards.
   - Snapshot saving keeps local preview history without touching chain state.

## Sprint 2: sports and bracket adapters

- Add sports fixtures, scores, and standings as a first-class feed source.
- Normalize teams, opponents, venue, status, and score states into the shared card attribute model.
- Add bracket-style dynamic competition views for sports, weather, sea, and composite cards.
- Extend `/live-feed-nfts.json` with adapter health and source freshness.

## Sprint 3: contract and mint path

- Choose the Tezos FA2 shape for dynamic-preview-to-static-metadata editions.
- Define freeze rules: what stays live in preview, what becomes immutable at mint time, and what can be refreshed after mint.
- Add Beacon wallet mint buttons gated behind explicit user confirmation.
- Keep signing local to the connected wallet; no agent custody or background signing.

## Sprint 4: gallery and market rails

- Add a collection/gallery lane for saved and minted editions.
- Show edition detail pages with metadata, feed snapshot, rarity inputs, and source receipts.
- Add outbound links for objkt and TzKT once contracts are originated.
- Prepare the first public collection drop checklist and post-mint support loop.

## Guardrails

- Sprint 1 is a preview and metadata-prep launch, not an on-chain mint.
- Live data sources need visible fallbacks and timestamps.
- Every follow-on sprint should keep the feed snapshot inspectable before any wallet action.

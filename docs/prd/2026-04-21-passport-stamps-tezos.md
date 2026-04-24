# PRD: PointCast Passport Stamps on Tezos

Date: 2026-04-21
Owner: PointCast
Status: PRD-ready, contract source written, compile/origination pending

## One-line pitch

Turn the PointCast 100-mile local lens into a stampable passport: visitors collect 24 station and field-expansion stamps in the browser, mint a Tezos companion proof today, and later mint the actual generated stamp art through a dedicated Passport Stamps FA2.

## Why this exists

PointCast already has a strong local map, TV stations, Visit Nouns, wallet flows, and machine-readable manifests. The missing product loop is a playful reason to move through those surfaces. Stamps give people a small, satisfying action that can start local, become social, and then become on-chain without requiring a heavy marketplace posture on day one.

## Users

- Local explorer: wants a lightweight route around El Segundo, South Bay, Los Angeles, and the edges of the 100-mile idea.
- Collector: wants something mintable, cheap, and legible on Tezos.
- Agent/crawler: wants stable metadata and endpoints without scraping.
- Builder/operator: wants a clear path from static site to wallet, contract, and future rewards.

## Core loop

1. Open `/passport`.
2. Collect a browser-local stamp for a station.
3. View the stamp art and metadata.
4. Connect Kukai/Beacon.
5. Mint the live Tezos companion proof: Visit Noun #900-#923.
6. Export or revisit the passport state.
7. Later, mint the same stamp as a native Passport Stamps FA2 token.

## Current implementation

- `/passport` renders all 24 stamps, progress, daily route, wallet chip, metadata links, and mint buttons.
- `/passport/book` renders the same collection as a tactile passport booklet with cover, identity spread, stamp spreads, print mode, and shared localStorage state.
- `/passport/book.json` publishes the booklet spreads, cover art, stamp objects, and mint truth label.
- `/passport/collection` renders a cabinet view for the stamp sheet, poster set, book, metadata links, and mint status.
- `/passport/collection.json` mirrors the cabinet objects for agents and collectors.
- `/passport/routes` renders route achievements/visas inferred from collected stamp groups.
- `/passport/routes.json` publishes the route achievement list, stamp requirements, and completion rule.
- `/passport/receipts` renders client-side receipt cards for wallet-signed proof mints saved in browser storage.
- `/passport/receipts.json` publishes receipt templates, localStorage mint shape, and current/future mint plans.
- `/passport/art/{slug}.svg` returns deterministic 1024x1024 stamp art for each station.
- `/passport/stamps/{slug}.json` returns TZIP-style metadata for each station stamp.
- `/passport/posters` publishes a ten-piece gpt-image-2 campaign poster set for launch/social/mint receipts.
- `/passport/posters.json` mirrors the poster images, source art, prompts, stamp codes, and station slugs for agents.
- `/passport.json` publishes stamp prompts, art, metadata URLs, and mint plans.
- `/agents.json` and `/editions(.json)` advertise the collection path.
- The live mint button uses the existing Visit Nouns FA2 mainnet contract and calls `mint_noun(nounId)`.
- `contracts/v2/passport_stamps_fa2.py` defines the native FA2 contract for true station stamp art mints.
- `scripts/check-passport-stamps-native-readiness.mjs` verifies source, metadata, and native KT1 readiness once configured.
- `/passport` automatically prefers native `mint_stamp` once `passport_stamps.mainnet` is populated in `src/data/contracts.json`; until then it uses Visit Nouns companion proofs.

## Important truth in labeling

The live contract mints a Visit Noun companion proof. It does not yet mint the generated passport stamp art. The stamp art, metadata, and native Passport Stamps FA2 source are ready; that contract still needs SmartPy compile, shadownet testing, origination, and configuration.

## Token model

### V0 companion proof

- Contract: Visit Nouns FA2 on Tezos mainnet.
- Entrypoint: `mint_noun(noun_id)`.
- Price: gas only unless contract config changes.
- Mapping: P00-P23 maps to token IDs #900-#923.
- Purpose: prove the visitor performed a stamp action and exercise the live wallet mint path.

### V1 native stamp contract

- Contract: `PointCast Passport Stamps` FA2.
- Entrypoint: `mint_stamp(stamp_code)` or `mint_stamp(stamp_id)`.
- Token IDs: one token ID per station stamp.
- Supply: open edition by default, optional caps for route challenges.
- Metadata base: `https://pointcast.xyz/passport/stamps/{slug}.json`.
- Artifact/display: `https://pointcast.xyz/passport/art/{slug}.svg` at launch; generated `gpt-image-2` raster upgrades can be pinned later.

## Requirements

- Collecting a stamp must work without a wallet.
- Minting must never imply the stamp art itself is on-chain until the native FA2 exists.
- Every stamp must have a stable slug, code, art URL, metadata URL, and current/future mint plan.
- The stamp board, book, and collection cabinet must read and write the same browser-local passport state.
- Route achievements and receipt cards must infer state from the same browser-local passport shape.
- Agents must be able to discover all stamp endpoints from `/passport.json` and `/agents.json`.
- Mint UI must gracefully handle wallet cancellation, low balance, and missing contract config.
- No free-text public submissions are introduced by this feature.

## Acceptance criteria

- `/passport` shows wallet connect and a Tezos proof mint action for every stamp.
- `/passport/art/el-segundo.svg` renders a nonblank stamp with “MINT READY” and the companion noun ID.
- `/passport/stamps/el-segundo.json` returns valid JSON with symbol `PCPASS`, art URIs, attributes, and minting fields.
- `/passport.json` includes storage schema, current companion minting, and future Passport Stamps contract intent.
- `/passport/book` displays the booklet, updates collected stamps from the shared localStorage key, and exposes `/passport/book.json`.
- `/passport/collection` displays stamps, posters, book CTA, mint status, metadata links, and exposes `/passport/collection.json`.
- `/passport/routes` displays route achievements, lets visitors collect route stamp groups, and exposes `/passport/routes.json`.
- `/passport/receipts` displays one receipt template per station and marks receipts confirmed when a wallet-signed mint is saved locally.
- `/passport/posters` displays ten generated launch posters, and `/passport/posters.json` exposes their generator prompts.
- Read-only TzKT readiness check confirms the live companion contract exists and exposes `mint_noun`.
- A real mint is only called after the user approves a wallet signature.

## Success metrics

- Stamps collected per visitor.
- Wallet connect starts from passport.
- Broadcast mint transactions from passport.
- Confirmed companion mints by token ID #900-#923.
- Return visits to `/passport` and `/tv/{station}`.
- Book opens and collection-cabinet opens from `/passport`.
- Route-achievement opens and receipt-drawer opens from `/passport`.
- Agent fetches of `/passport.json` and per-stamp metadata.

## Next build steps

1. Compile `contracts/v2/passport_stamps_fa2.py` with SmartPy v0.24.1.
2. Originate on shadownet, smoke mint stamp `0`, then add the shadownet KT1 to `src/data/contracts.json`.
3. Originate on mainnet with Mike-approved admin custody, then add the mainnet KT1 to `src/data/contracts.json`.
4. Replace companion proof button with a two-option mint panel: “Mint stamp” and “Mint companion.”
5. Turn receipt cards into shareable permalink images once wallet-confirmed mints exist.
6. Generate and pin final raster art variants with `gpt-image-2` if SVG is not the permanent artifact.
7. Add shareable route visa images for origin, beach loop, field expansion, and full passport.
8. Add wallet-address-aware cabinet filtering after native Passport Stamps FA2 is live.

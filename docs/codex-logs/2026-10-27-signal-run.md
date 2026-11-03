# Signal Run — 2026-10-27

Added `/chain/play/`, a daily three-stage route puzzle with deterministic maps,
solvability checks, move budgets, optional hints, and a replay-validated browser
passport of the most recent 14 completed daily events. Players can download
illustrated local stamps as SVG images.

An optional integrated play-key flow prepares a `publish_block` participation
post on the protocol-valid `SIGNALRUN` channel. Preparation performs reads only.
The page shows the public body, sender, network, exact transaction fields and
signing digest. The second explicit Sign action uploads the reviewed body and
signs. Identity is pinned through the shared SDK, chain ID and genesis. Navigation
or a changed/forgotten key during upload prevents signing. The signed transaction
hash is saved before submission; an ambiguous response never triggers a resend.

Receipt checking reconstructs the block transaction commitment, checks sender
and transaction signature, checks the sequencer seal with the pinned genesis key,
and reads the exact public event body. This checks the post, not gameplay truth.
The UI calls scores player-reported, distinguishes local stamps from chain
receipts, and makes no token, NFT, ownership, prize or financial-value claim.
The existing chain is a resettable, single-sequencer devnet without anchoring.

Validation:

- `node --test tests/chain-app-signal-run.test.mjs`: 11 passing tests, including
  1,098 daily maps, full three-stage DOM play, review/cancel/key changes,
  no-write preparation, ambiguous-send hash retention, and cryptographic receipt
  inclusion plus tamper negatives.
- Local Astro HTTP smoke: `/chain/play/` returned 200, with the pinned genesis,
  shared KeyPanel and review markup present.
- `npm run build:bare`: Vite server/static and client compilation passed. Static
  route generation stopped on an unrelated external fetch with
  `ECONNREFUSED 176.9.105.239:443`. Root will run the combined proxy-aware build.
- No browser visual or mobile interaction verification was available. No live
  transaction was signed or submitted by tools. No push or deployment performed.

The game adds only its own route/modules/tests/log. Existing `/games` and chain
apps are untouched; root owns discovery links and release integration.

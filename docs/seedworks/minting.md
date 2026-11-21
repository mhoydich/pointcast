# Seedworks: how a piece would mint on Tezos

Status: plan only. Nothing is deployed, minted, signed or paid for. Any mint needs Mike's approval, and a new contract also needs Codex review (see the approvals table in `AGENTS.md`).

Seedworks pieces live at `public/art/seedworks/<slug>/index.html`. Each file is self-contained and starts with the same `seedworks-runtime v1` block, which reads the seed in this order:

1. `$fx.hash` when fxhash's snippet is on the page
2. `?seed=` in the URL (PointCast's own pages use this)
3. a fresh random seed

All randomness goes through `$sw.rand`, which is `$fx.rand` under fxhash and an `sfc32` generator seeded from the string otherwise. `$sw.done(features)` calls `$fx.features(features)` and then `$fx.preview()` when fxhash is present, and posts `{ type: 'seedworks:done', seed, features }` to the parent page.

## Path A: fxhash

fxhash is the existing home for generative art on Tezos. A piece can go up without a rewrite.

1. `cd public/art/seedworks/<slug> && zip upload.zip index.html` (index.html must be at the root of the zip).
2. Add fxhash's snippet. The current fxhash tooling (`npx fxhash create`, `npx fxhash dev`, `npx fxhash build`) injects `fxhash.min.js` from `@fxhash/project-sdk`; put the piece's script after it. Our runtime picks up `$fx` automatically.
3. Test in the fxhash sandbox with many random hashes. Check that features read well and that the piece draws offline.
4. Mike decides edition size, price in tez and royalties, and publishes from his own wallet. Each collector's mint hash becomes that token's seed.

Open questions before going this way:

- fxhash's docs site did not load in full when this was written (Nov 9, 2026), and the boilerplate README that lists the `$fx` globals is archived. Re-read the current spec before uploading.
- Which chain to publish on, if fxhash offers more than Tezos by then. PointCast's home chain is Tezos.
- fxhash's platform fee, and whether the PointCast page should link to the fxhash project.

## Path B: a PointCast FA2

Mint iterations from PointCast's own contract. `contracts/visit_nouns_fa2.py` and the FA2 contracts in `contracts/v2/` are the pattern to follow.

1. Pin each piece's `index.html` to IPFS once. The CID freezes the code.
2. Add a `mint_iteration(piece_id)` entrypoint. It checks payment and supply, derives a seed from the operation (for example a hash of the block level, sender and token id), stores the seed in `token_seeds`, and mints the token.
3. Token metadata (TZIP-21) sets `artifactUri` and `displayUri` to `ipfs://<cid>/?seed=<seed>`, `formats` to `text/html`, and `attributes` to the piece's features. Features can be computed off chain by loading the piece with the seed and reading the `seedworks:done` message.
4. The gallery reads minted seeds back from the contract and shows them beside the free iterations.

Why choose it: collectors and the gallery stay on pointcast.xyz and there is no platform fee. Why wait: it is a new contract to write, test on Ghostnet and audit.

## What has to be true before any mint

- Mike picks the path, the pieces, edition sizes and prices.
- A Ghostnet run of the whole flow, with screenshots, before mainnet.
- Codex review of any contract change. Mike approves the deploy and signs it himself.
- The piece is frozen: once a token exists, its `index.html` never changes. Fixes become a new piece.

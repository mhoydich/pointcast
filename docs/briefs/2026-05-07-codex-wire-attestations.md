# Codex review brief — Wire Attestations contract

**For:** Codex
**From:** cc
**Date:** 2026-05-07
**Branch:** `feat/mist-room-cc-2026-05-08`
**Files for review:**
- `contracts/eth/wire_attestations.sol` (~180 lines)
- `contracts/eth/README.md` (deployment doc)
- `src/lib/eth/config.ts` (already on branch — see `WIRE_ATTESTATIONS_BASE`)

## Why you're on this

Per `CLAUDE.md`: *"Ask Codex for review when a change touches publishing,
agent-readable endpoints, **wallet/contract code**, or a large cross-route
refactor."* This is the contract piece of the `/mist` room build. Mike
originates only after Codex gives a thumbs up.

## Context

PointCast's editorial output is the wire — numbered blocks, monotonically
increasing, currently at id 0460+. The Mist room (decision doc:
`docs/decisions/2026-05-07-mist-room-decision.md`) introduced an Ethereum
surface to PointCast. **Wire Attestations** is the publish primitive of
that surface: each PointCast block can be recorded on Base as a tuple
`(block_id, content_hash, signer, signed_at)`. The block stays canonical
in the repo; the chain just logs that a wallet signed off.

The contract is deliberately thin — no fees, no royalties, no admin.
Any wallet can call `attest()` for any block. One attestation per
`(block_id, signer)` pair (so the same wallet can't double-attest the
same block, but multiple wallets can co-attest).

## What I'd like you to look at

### A. ERC-721 baseline correctness

The contract inherits `ERC721 + ERC721Enumerable` from OpenZeppelin v5.
The two required overrides (`_update`, `_increaseBalance`,
`supportsInterface`) are forwarded to `super`. Worth verifying I have
the OZ v5 override surface right — v5 introduced changes to
`ERC721Enumerable` that broke v4 patterns.

### B. Reentrancy posture

`attest()` writes state then calls `_safeMint`, which can call into
the recipient's `onERC721Received`. Recipient is `msg.sender`, so
re-entering would just re-enter as the same caller, but I'd still like
your read on whether CEI is fully respected and whether the
`byBlockSignerPlusOne` write-then-mint ordering can race in any way.

### C. The `+1` encoding

`byBlockSignerPlusOne` stores `tokenId + 1` so the default zero is
unambiguous "not attested." Token ids start at 1, so `tokenIdFor()`
subtracts 1 on the way out. Is this preferable to making token ids
1-indexed and storing the raw id? I lean toward the +1 convention but
willing to flip if you have a strong opinion.

### D. `tokenURI` gas

The URI is built fully on-chain via `string.concat` + `Base64.encode`.
Reads are free off-chain, but if a marketplace ever calls tokenURI in a
contract context (unusual), gas could matter. Worth a sanity-check on
worst-case bytes. The JSON body is small (~400 bytes), and Base64
inflates by ~33%, so we're talking ~1KB — nothing pathological.

### E. blockId validation

I require `bytes(blockId).length == 4` but don't enforce numeric chars.
That's deliberate so future block-id schemes (e.g. `"v002"`) don't
require a contract upgrade. Reasonable, or should I tighten to digits
only?

### F. No admin / no upgrade path

Intentional. The contract is permanent and parameterless — no fees, no
owner. If we want to evolve, we deploy a v2 and let v1 keep running.
Worth confirming this is the right call vs. e.g. adding an `Ownable`
hatch for emergency pause. I lean against — the contract has no
custodial assets and no logic that benefits from being pausable.

### G. Compile against OZ v5

`pragma solidity ^0.8.24;` + OZ v5 imports. If you spot any v5/v4 drift
(e.g. `_requireOwned` vs `_exists`), flag it. v5 prefers `_requireOwned`
for the "must exist" check.

## What I don't want you to look at

- **Gas-golfing**. v0 is correctness-first. Optimization can come later.
- **Marketplace metadata richness**. v0 metadata is the bare ERC-721
  attributes spec. We can layer on a richer format (Zora's, Manifold's)
  later if needed.
- **Foundry/Hardhat test scaffold**. Not yet — Mike will scaffold
  whichever toolchain he prefers when he originates.

## Process

Drop your review into a PR comment on the eventual GitHub PR (Mike
opens that on `feat/mist-room-cc-2026-05-08` → `main` once you green-
light). If you want to leave a written log on this branch, put it at
`docs/codex-logs/2026-05-08-wire-attestations-review.md` — I'll wait
for it before pushing the contract address into config.

If you want to run the contract through a static analyzer (Slither,
Mythril) and paste the report, that'd be welcome but not required.

— cc

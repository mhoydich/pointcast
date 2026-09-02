# Kennel Club FA2: per-day mint windows

**Date:** 2026-09-02  
**Status:** compile-only; not originated  
**Source:** `contracts/v2/kennel_club_fa2.py`  
**Series source:** `src/data/kennel-club-september-sitting.json`

## Design

The September Sitting is one FA2 multi-asset contract with 30 registered token IDs. Token ID is always calendar day minus one: token `0` is September 1 and token `29` is September 30.

The contract uses SmartPy's pinned `fa2_lib.Fungible` implementation. That base supplies the canonical TZIP-12 `transfer`, `balance_of`, and `update_operators` entrypoints. Each mint adds one unit to the sender's `(address, token_id)` ledger balance and increments that token's supply.

Each token ID has an origination-seeded `windows` big map containing `{ open_at, close_at }`. The window is inclusive at `open_at` and exclusive at `close_at`. September 2026 is daylight time in America/Los_Angeles, so local midnight is stored as `07:00:00Z`; the final window closes at `2026-10-01T07:00:00Z`. Admin may call `set_window` to repair the late starts for September 1 and 2 without changing the calendar identity of those tokens.

`edition_mode` is immutable after origination:

- `open`: no on-chain edition cap during the window.
- `capped`: supply must stay below `edition_cap`; the proposed/default compile value is 30.

Minting requires the exact stored `price_mutez`, and the full payment is immediately forwarded to `treasury`. The contract does not retain sale proceeds. Admin may update price, treasury, admin, pause state, and individual windows. It cannot change the edition mode or cap after origination.

The standard contract `metadata` big map carries the TZIP-16 URI. All 30 `token_metadata` records are seeded at origination from the series JSON with TZIP-21 name, description, artifact/display/thumbnail URI, and attributes. Image URIs and the TZIP-16 URI are explicit `ipfs://PLACEHOLDER_...` values and must be replaced by pinned CIDs before any origination. No artist or third-party brand fields are present.

Views are `get_window(token_id)`, `minted(token_id)`, and `price()`.

## Compile snapshot

Compiled locally with `smartpy-tezos==0.24.1`; both scenarios passed. Artifacts are in `contracts/build/kennel_club/`.

The checked-in storage is deliberately safe and non-final:

- administrator: Mike's `tz2Fj...` address
- treasury: same address until a project-owned multisig is ready
- edition mode: `capped`
- edition cap: `30`
- price: `0` mutez, pending Mike's decision
- paused: `true`
- metadata: IPFS placeholders

This storage must not be originated as-is.

## Open decisions for Mike

1. **Edition model:** 24-hour open edition, or capped at 30 per sitting.
2. **Price:** exact tez price per mint; record and compile it as mutez.
3. **Signer and treasury:** originate from Mike's current signer with treasury initially equal to that address, or establish the planned TzSafe/project multisig first. Name the intended admin successor before mainnet.
4. **Late windows:** choose the extended closing timestamps for Sittings 01 and 02, if either remains mintable after its calendar day.

## Origination checklist for cc's signing afternoon

- [ ] Resolve the four decisions above and record the exact values.
- [ ] Pin the 30 final plates and contract metadata to IPFS. Replace every placeholder in source, then recompile; do not hand-edit nested Micheline.
- [ ] Confirm `smartpy-tezos==0.24.1`; rerun both scenarios from the installed package's `site-packages` working directory.
- [ ] Review the regenerated storage: 30 token IDs, 30 windows, correct `07:00:00Z` boundaries, chosen edition mode/cap, exact mutez price, intended admin/treasury, and `paused=true`.
- [ ] Add the planned origination to Mike's Tezos contract registry before signing, per the Tezos skill.
- [ ] Use **Shadownet** for the first origination and mint smoke test. Ghostnet is dead. Compare the RPC head with Shadownet TzKT before debugging any stuck operation; use `https://rpc.tzkt.io/shadownet` if the teztnets RPC is stale.
- [ ] Use a Shadownet-capable test key/wallet for that test. Kukai is mainnet-only.
- [ ] On Shadownet, verify: pre-open failure, exact-open success, exact-close failure, wrong-price failure, capped sellout or open overflow as selected, treasury receipt, FA2 transfer, `balance_of`, operator update, and all three views.
- [ ] Recheck the final source/artifact hashes after the Shadownet test. No contract source or storage drift between test review and mainnet review.
- [ ] Mike reviews and signs the **mainnet** origination in Kukai. No agent signs or originates.
- [ ] Record the resulting KT1 in the registry and PointCast contract data, verify it on TzKT, set any approved late windows, and only then unpause.

No deployment or origination is part of this decision or PR.

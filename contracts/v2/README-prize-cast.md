# Prize Cast v0

This document is the implementation companion to [the PM brief](../../docs/pm-briefs/2026-04-17-prize-cast-on-tezos.md). It explains the contract decisions in `contracts/v2/prize_cast.py` without restating the whole product brief.

## What v0 implements

`PrizeCast` is a single-contract vault that:

- accepts tez deposits above a configurable minimum
- tracks principal per depositor
- accrues ticket weight lazily as `principal_in_mutez * elapsed_seconds`
- lets depositors withdraw principal at any time without forfeiting already-earned weight for the active round
- delegates the vault to one baker at a time
- lets anyone call `draw()` after the cadence deadline to distribute current yield

The storage fields requested in the PM brief are present, plus one extra internal index:

- `participant_ids`
- `participant_addresses`
- `participant_count`

That index exists because Michelson `big_map`s are not iterable. Without it, `draw()` cannot settle all lazy weights, scan cumulative weights, or reset the round on-chain.

## Randomness tradeoffs

v0 uses:

`blake2b(pack({ level, timestamp, contract_address }))`

and then converts the first 8 bytes of that hash into a `nat`, modulo `total_weight`.

Why this is acceptable for v0:

- it is deterministic and self-contained
- it avoids any oracle or off-chain dependency
- it is enough for low-value smoke tests and small live pools

Why it is not enough for serious TVL:

- bakers and timing can influence the draw block context
- callers can choose *when* to trigger `draw()` once the cadence threshold is open
- there is no delayed entropy source or reveal penalty

Recommended upgrade path:

1. v1: commit-reveal with a fixed reveal window and explicit penalties for withheld reveals
2. v2: protocol-native randomness/VDF if Tezos exposes a stable contract-facing primitive for it

The PM brief already points to commit-reveal as the intended next step. This contract keeps that path open.

## Draw cadence math

The contract uses block cadence, not wall-clock scheduling:

`drawable when current_level >= last_draw_level + draw_cadence_blocks`

That is deliberate:

- the contract can enforce it entirely on-chain
- it avoids storing cron-like calendar logic
- it maps cleanly to Tezos’s deterministic block production model

The tradeoff is that “weekly” means “approximately weekly” unless operations are called on schedule. If you want a Sunday 18:00 UTC ritual, the frontend/operator layer should:

- pick a cadence in blocks that approximates one week for the active network
- show the earliest eligible block/time
- nudge an operator or public keeper to call `draw()` once the window opens

`starting_draw_level` is a constructor parameter so origination can anchor the first round cleanly instead of making the first draw immediately callable from level 0.

## Delegation rotation

`set_delegate(option<key_hash>)` is admin-only and calls `SET_DELEGATE`.

Important details:

- storage keeps the delegate as `option<address>` because that is friendlier for off-chain display/indexing
- the entrypoint accepts `option<key_hash>` because Tezos delegation operates on baker key hashes
- rotating delegates does not move principal or touch ticket accounting
- clearing the delegate is supported by passing `None`

Operationally, rotation should be rare. Delegate churn changes yield behavior and complicates user expectations. Treat it like infrastructure maintenance, not a frequent tuning knob.

## PoolTogether v4 parallels

This contract deliberately follows the same high-level shape as PoolTogether v4:

- principal remains withdrawable
- yield is socialized into discrete prize periods
- odds are proportional to time-weighted balance
- anyone can trigger the prize award, with a caller incentive

The differences are Tezos-native:

- the asset is tez, not ERC-20 deposits
- delegation/yield assumptions are Tezos-specific
- there is no separate TWAB controller or ticket token in v0
- the cadence is block-gated rather than chain-agnostic keeper logic

The practical consequence is that Prize Cast v0 is much simpler than PoolTogether’s production architecture. That is a feature for the MVP, not an audit claim. PoolTogether’s deeper separation of accounting, prize strategy, and draw machinery is still the right reference for future hardening.

## Known constraints in v0

- `draw()` is O(n) over all known participants because it must settle and reset every account each round
- the caller incentive is funded out of current yield, so `past_winners[n].prize` stores the winner’s net payout, not the gross yield
- zero-yield rounds revert with `NO_YIELD` instead of clearing the round
- users who fully withdraw still keep already-earned weight for the active round until the next draw, which matches the PM brief’s “prorate / earned-so-far still counts” rule

## Compile / deploy flow

1. Compile `contracts/v2/prize_cast.py` with SmartPy v0.24.x and export `contract.json` + `storage.json`.
2. Copy those artifacts to:
   - `/tmp/prize-cast-contract.json`
   - `/tmp/prize-cast-storage.json`
3. Run:

```bash
node scripts/deploy-prize-cast-ghostnet.mjs
```

4. The script will:
   - create or reuse a throwaway signer at `/tmp/prize-cast-ghostnet-signer.json`
   - patch the compiled storage admin to that signer
   - originate on Ghostnet
   - write the resulting KT1 to `/tmp/prize-cast-ghostnet-kt1.txt`

As of April 17, 2026, Teztnets lists Ghostnet as deprecated, but it still publishes RPC endpoints and remains usable for a smoke-test deployment. That is why the deploy script sticks to Ghostnet while avoiding any mainnet origination flow.

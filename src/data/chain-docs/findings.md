# pc-sim findings

> **Scenario output, not a forecast.** The town's populations, behaviours and ring sizes are
> written into the scenario files. The chain side is real: every tx is signed, verified and
> applied by the unmodified `chain_core::State::apply_tx`, with `Params::new` defaults (3 s
> blocks) unless a row says otherwise. Change the populations and the shares change. The per-key
> numbers don't depend on populations; they are the caps, and they matched the analytic bounds
> exactly in every run.

Measured 2026-10-02. Binary built from `7329565` (rustc 1.99.0, macOS, 10 cores).
**No protocol bug fired** across 38 runs and sweep cells (123.1M applied txs). Every sim-day
checked: Σ balances = total supply ≤ max supply; no account issued past its epoch cap; no
mandate overspent; no sybil key above its per-epoch or per-window bound.

## How far to trust the engine

The simulator only visits heights that have txs. Two tests prove that shortcut changes nothing:

- `tests/sparse_equals_node.rs` feeds the run's signed txs to the **real
  `pointcast_node::Node`** (its mempool, ordering, 20-block patience, `build_block` and sqlite
  store) and seals a block at every one of 17,279 heights, 16,056 of them empty. Every receipt,
  every landing height (45 block-cap deferrals, 6,353 txs past `max_txs_per_block`) and the final
  state root are identical.
- `tests/sparse_equals_dense.rs` does the same against bare `build_block` and `apply_block` replay
  for the `attacker_first` ordering.

Throughput: 17,094 tx/s and 17,376 signatures/s on the 365-day run (12.3M txs in 12 min).

## 1. Every sybil key earns exactly the epoch cap

With default params a sybil key earned **500 ATTN per day, every day, under every strategy that
tried**: `tap_max`, `cosign_ring`, `epoch_straddle`, `block_flood`. The epoch cap is the only
thing that binds, and the raw ceilings sit far above it (7,200/day from taps, 18,104/day from
drums).

| Run (seed 1) | Days | Honest share | Sybil share | Per sybil key/day | Final root |
|---|---|---|---|---|---|
| town-baseline (no sybils) | 90 | 97.1% | 0% | n/a | `af59737ff877376d…` |
| sybil-taps (50 × `tap_max`) | 30 | 46.8% | 51.4% | 500 | `d711510d3e3e49d0…` |
| cosign-ring (50 × `cosign_ring`) | 30 | 47.7% | 50.7% | 500 | `86b3b31e4d9f2354…` |
| year-one (50 × `cosign_ring` + 50 × `tap_max`) | 365 | 33.1% | 65.7% | 500 | `9b3a92dacf07990a…` |

year-one minted 27.8M ATTN over the year, 18.25M of it to 100 sybil keys. At that rate max supply
is about 31 years away (11,452 days, trailing 30-day rate).

## 2. The epoch cap scales sybil income, not honest income

120-day year-one sweep, `cosign`, as-written attacker:

| `account_epoch_cap` | Honest ATTN | Sybil ATTN | Sybil share |
|---|---|---|---|
| 250 | 2.45M (−19%) | 3.00M | 54.0% |
| 500 (default) | 3.02M | 6.00M | 65.8% |
| 1000 | 3.02M (+0.3%) | 12.00M | 79.3% |

Raising the cap to 1000 doubles sybil income and gives honest users almost nothing. Lowering it to
250 halves sybil income but costs honest users a fifth, because active regulars hit it.

## 3. `room_only` alone does not stop an attacker who adapts

Same sweep, cap 500. `adaptive` is a ring that co-signs its own drum sessions **and** taps at the
rate limit, until the cap:

| Policy | Attacker | Honest share | Sybil share | Per sybil key/day |
|---|---|---|---|---|
| `cosign` | as written | 33.1% | 65.8% | 500 |
| `room_only` | as written | 48.9% | 49.3% | 250 |
| `room_only` | adaptive | 32.8% | 66.1% | 500 |

`room_only` zeroes co-signed ring income, which looks like a win against the as-written rings.
But taps alone reach the 500 cap, so an adaptive ring simply taps, and `room_only` changes
nothing. (Under `room_only` the scenarios assume the room server attests honest sessions at the
same 90% rate co-signing reached under `cosign`, so honest drum income is held equal across
policies.)

## 4. What actually works: `room_only` plus tap gating, together

120-day year-one sweep, adaptive attacker, cap 500:

| Policy | Taps allowed | Honest ATTN | Sybil share | Per sybil key/day | Final root |
|---|---|---|---|---|---|
| `room_only` | 5 per minute (default) | 2.97M | 66.1% | 500 | `64071adb670f8c52…` |
| `room_only` | 5 per hour | 2.86M (−4%) | 32.7% | 119 | `44fa2cbe150eb6f6…` |
| `room_only` | 1 per hour | 2.53M (−15%) | 10.1% | 24 | `381772e96b32ba90…` |
| `cosign` | 1 per hour | 2.57M | 69.6% | 500 | `a5b12dcacdf13ae4…` |

Tap gating (`tap_window_blocks` = 1200, `taps_per_window` = 1, about one tap an hour) cuts a
sybil key from 500 to 24 ATTN a day under `room_only`. The honest cost is 15% of honest income,
all of it from taps: honest drum income doesn't move. Under `cosign` the same gating does nothing: the adaptive ring
moves its income into co-signed drum sessions and still earns 500 a day (69.6% of issuance).

## 5. The epoch-straddle double dip

A key can collect **1,000 ATTN, twice the cap**, inside one epoch-long window by maxing out just
before and just after an epoch boundary (measured exactly in `epoch-straddle`, root
`dc0c14e776c78e02…`). By tapping alone that takes 4,000 blocks (3 h 20 min). With backdated drum
sessions a fresh key can do it in about 201 blocks (10 min; `pc-sim bounds`). It is bounded and
predictable: the long-run rate is still 500/day.

## 6. Backdated drum sessions let one key fill a block

`drum_attest_max_age_ms` (1 h) lets a session claim a slot that ended up to an hour ago. A fresh
key can therefore claim an hour's worth of non-overlapping sessions at once and earn its whole
500 cap **in a single block** (test `one_key_can_reach_its_epoch_cap_in_a_single_block`), so
**4 keys fill a block**. With a 5-minute window the per-key per-block bound drops from 500 to 171
(`pc-sim bounds`).

In these scenarios shortening the window changed nothing (identical roots in the launch sweep),
because no actor relied on backdating. Its value is that it caps how fast a ring can fill a block,
not its daily income.

## 7. Block flooding: harmless under the node's ordering

`block-flood` (200 sybil keys filling the block issuance cap wherever an honest drum session is
pending), 14 days:

| Sequencer ordering | Block cap | Honest sessions deferred | Worst wait | Evicted | Honest drum ATTN |
|---|---|---|---|---|---|
| node (first-come) | 1000 | 2 of 767 | 1 block | 0 | 271,706 |
| node (first-come) | 2000 | 0 of 767 | 0 | 0 | 271,706 |
| node (first-come) | 4000 | 0 of 767 | 0 | 0 | 271,706 |
| attacker first | 1000 | 97 of 702 | 4 blocks | 65 | 253,356 (−6.8%) |
| attacker first | 2000 | 269 of 767 | 14 blocks | 0 | 271,714 |
| attacker first | 4000 | 269 of 767 | 9 blocks | 0 | 271,706 |

The node orders senders first-come, so a flood that reacts to a pending honest session lands
behind it, and honest drum income is identical at every cap. Only a sequencer that deliberately
puts the attacker first can delay honest sessions. Even then they pay in full, unless a low block
cap lets the 20-block patience evict them (65 sessions at cap 1000). The single sequencer is
already trusted not to censor, so this is a censorship risk, not a new economic one.

## Recommended launch params (scenario-based reasoning)

Assumptions: sybil keys are free; the room server attests honest sessions about as often as
players co-sign today; honest regulars tap 5–25 times a day and some drum daily. Under those
assumptions:

1. **`drum_attest_policy = room_only` together with tap gating** (about one tap per hour per key).
   Neither works alone (sections 3 and 4). Together they cut farming from 66% to 10% of issuance,
   for 15% of honest income.
2. **Keep `account_epoch_cap` at 500.** Raising it mostly pays sybils; lowering it hurts active
   regulars (section 2).
3. **Shorten `drum_attest_max_age_ms` to about 5 minutes** to cap per-block claims at 171 instead
   of 500 (section 6). Measured cost: none in these scenarios.
4. **Keep `block_issuance_cap` at 2000 or higher.** At 1000, an attacker-favouring sequencer can
   make honest sessions wait past the node's 20-block patience (section 7).
5. The remaining farming is tap income: the cost of one tap per hour per sybil key, without a
   real identity or stake requirement behind taps. That is the open problem, and
   DESIGN.md "Known gaps" says so.

## Reproducing

```bash
cargo build --release -p chain-sim
B=target/release/pc-sim; S=crates/chain-sim/scenarios; O=/tmp/pc-sim
for s in town-baseline sybil-taps cosign-ring epoch-straddle block-flood year-one; do $B run $S/$s.json --out $O/$s; done
$B sweep $S/block-flood.json --grid ordering=node,attacker_first --grid block_issuance_cap=1000,2000,4000 --out $O/sweep-flood
$B sweep $S/sybil-taps.json --grid tap_window_blocks=20,1200 --grid taps_per_window=1,5 --out $O/sweep-taps
$B sweep $S/year-one.json --days 120 --grid drum_attest_policy=cosign,room_only --grid attacker=as_written,adaptive --grid account_epoch_cap=250,500,1000 --out $O/sweep-policy
$B sweep $S/year-one.json --days 120 --grid drum_attest_policy=room_only --grid attacker=adaptive --grid tap_window_blocks=20,1200 --grid taps_per_window=5,1 --grid drum_attest_max_age_ms=3600000,300000 --out $O/sweep-launch
$B sweep $S/year-one.json --days 120 --grid drum_attest_policy=cosign,room_only --grid attacker=adaptive --grid tap_window_blocks=1200 --grid taps_per_window=1 --out $O/sweep-both
$B bounds
```

Each run prints `seed → root` and writes `summary.json`, `days.csv` and a self-contained
`report.html`. The output directory and thread count never change a result. The same cell run in
two different sweeps reproduces the same root (`381772e96b32ba90…`).

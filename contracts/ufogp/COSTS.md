# UFOGP simulation cost table

2026-11-13 PT — Ada. **No real transaction, origination, mint or spending occurred.**

These figures replace the round-one serialization proxy. They are public-fixture
simulations, not a quote or an approval. `originate.sh` was not run.

## Method and assumptions

- Protocol: `PsUshuai9QapM5TGj1JpuVGkdxz5GykdnEvS6Rh8SUVrARvZLCY`; block `BKtPumbrqDaS4oWJGnR3ZxWvm8YtUi65dpLzt8mjrtuProtuoVZ`.
- RPC: `https://rpc.tzkt.io/mainnet`. Evidence: [costs-simulation.json](costs-simulation.json).
- `run_operation` previews initial and before/after storage snapshots with a fixed zero dummy signature. This RPC skips signature checks and does not inject an operation. No signing key, wallet or funding was used.
- The preview uses a revealed, funded **public context address** so the node can validate hypothetical fees. Control of that address is not claimed. Negative balance changes in previews are hypothetical, not actual debits.
- Current constants read from that pinned block: 250 mutez per storage byte, 257 bytes origination allocation, 1,040,000 gas units per operation.
- Call storage burn is `max(after size − before size, 0) × 0.00025 tez`, measured by separate origination previews of the complete SmartPy before/after states. This is a **storage-growth proxy**, not an exact per-call paid-storage receipt: high-water accounting and update history can differ.
- Trace gas is the sum of protocol trace milligas divided by 1,000. It excludes some final serialization, manager-operation and receiver work. It must not be presented as full transaction gas.
- Origination fee estimates assume 100 mutez base + 0.1 mutez/gas + 1 mutez/forged byte (including a 64-byte dummy signature). Fee values themselves use zero in previews. Actual node/producer policy and final payloads can differ.
- Calls use a deliberately loose **0.15 tez fee allowance** plus measured storage growth. This is a planning allowance, not a measured fee or guaranteed maximum. It leaves substantial room for gas and operation overhead; a signing desk must replace it with an exact-payload estimate.
- All token/contract metadata is fixture data. A final URI, custom metadata map, larger nat values or longer history can change costs. No finite lifetime total is promised.

## Origination

Empty Seat, zero-supply Doubloon and empty DAO. Each starts with zero tez.

| Contract | Paid storage bytes | Gas units (operation preview) | Storage burn, tez | Assumed fee, tez | Sum, tez |
|---|---:|---:|---:|---:|---:|
| Seat | 3892 | 2522.289 | 1.037250 | 0.004179 | 1.041429 |
| Doubloon | 4537 | 3347.400 | 1.198500 | 0.004755 | 1.203255 |
| DAO | 2787 | 1853.420 | 0.761000 | 0.003082 | 0.764082 |

Combined fixture estimate: **2.996750 tez storage burn + 0.012016 tez assumed fees = 3.008766 tez**. Retain the 3–5 tez planning range until final metadata and exact payloads are reviewed.

## Calls

Each line is one call. “Not measured” is intentional: `propose` and `vote`
need Seat on-chain views, and the script runner cannot inject the full
unoriginated Seat view context. Their logic and state transitions were tested
in SmartPy. We did not substitute a mock VIEW and claim real measured gas.

| Call fixture | Storage growth bytes | Storage proxy, tez | Script gas units | Fee allowance, tez | Planning total, tez |
|---|---:|---:|---:|---:|---:|
| `seat_mint_uri` | 294 | 0.073500 | 985.150 | 0.150000 | 0.223500 |
| `seat_mint_metadata_limit` | 4341 | 1.085250 | 995.717 | 0.150000 | 1.235250 |
| `doubloon_award` | 184 | 0.046000 | 1231.827 | 0.150000 | 0.196000 |
| `doubloon_award_reference_limits` | 723 | 0.180750 | 1251.434 | 0.150000 | 0.330750 |
| `dao_propose_two` | 143 | 0.035750 | Not measured | 0.150000 | 0.185750 |
| `dao_vote_first` | 73 | 0.018250 | Not measured | 0.150000 | 0.168250 |
| `dao_vote_second` | 73 | 0.018250 | Not measured | 0.150000 | 0.168250 |
| `dao_close_tie` | 4 | 0.001000 | 548.766 | 0.150000 | 0.151000 |
| `dao_break_tie` | 2 | 0.000500 | 547.192 | 0.150000 | 0.150500 |
| `dao_propose_limits` | 4230 | 1.057500 | Not measured | 0.150000 | 1.207500 |
| `dao_close_empty_sixteen` | 0 | 0.000000 | 603.839 | 0.150000 | 0.150000 |
| `dao_propose_plurality` | 129 | 0.032250 | Not measured | 0.150000 | 0.182250 |
| `dao_vote_plurality` | 73 | 0.018250 | Not measured | 0.150000 | 0.168250 |
| `dao_close_winner` | 2 | 0.000500 | 600.305 | 0.150000 | 0.150500 |
| `seat_balance_of_two` | 0 | 0.000000 | 1468.626 | 0.150000 | 0.150000 |
| `doubloon_balance_of_two` | 0 | 0.000000 | 1716.244 | 0.150000 | 0.150000 |

Fixture meanings: URI seat metadata is a short IPFS fixture URI plus decimals; the maximum
metadata case is 4,096 bytes. The ordinary award is 1 unit with short references;
reference limits use job=128 bytes, evidence=512 bytes and amount=2^256−1
(a stress fixture, not a recommended reward). The maximum proposal has 2,000
bytes of text and 16 distinct 128-byte labels. Vote rows insert a fresh seat vote.
Close covers a tie, zero votes with 16 options, and a unique winner. No row is
a claimed worst case for arbitrary historic state or arbitrarily large nat values.

`balance_of` figures cover two requests and only the emitting token contract.
The recipient may consume gas and grow storage; its costs must be added.
Request lists are deliberately not capped (standard FA2 batching); the caller
pays for its batch. The 0.15 allowance alone cannot cover arbitrary receiver storage.

### Other callable surfaces

| Surface | Tez treatment |
|---|---|
| Seat/Doubloon `transfer` and `update_operators` | Always fail by policy. Zero state growth; no successful call price. A submitted failing transaction can still pay a fee: allow 0.15 tez, but do not submit it. Local rejected simulation costs 0. |
| Rejected mint, award, propose, vote, close or tie-break | Atomic rejection; no state-growth burn. A real included failure may still pay a fee. Preview first; no real failure was submitted here. |
| Seat `owner` / `seat_count`, FA2 off-chain metadata/balance/supply views | 0 tez when evaluated as read-only RPC/off-chain queries. When invoked by another contract, execution gas belongs to that caller; it is not free on-chain. |
| Origination-script invocation | Not executed. The table previews protocol operations directly; no signer client was invoked. |

## Reproduce without a wallet

1. Install `requirements.txt` and optional `pytezos==3.16.1` in an isolated venv.
2. Run `cost_scenarios.py` from a separate output directory; it writes `ufogp_costs/`.
3. Run `python measure_costs.py /path/to/ufogp_costs /path/to/result.json --rpc https://rpc.tzkt.io/mainnet --source-public-address PUBLIC_REVEALED_ADDRESS`.
4. Add `--block BKtPumbrqDaS4oWJGnR3ZxWvm8YtUi65dpLzt8mjrtuProtuoVZ` to replay this exact context (requires an RPC retaining it). Inspect the protocol, fixture sizes and assumptions. This tool has no signer or injection path; its POST allowlist is only `run_operation` and `trace_code`.
5. CI runs only local behavior/cost scenarios and shell syntax, not node requests or origination.

Later Signing desk work still needs Mike’s amount-specific yes in that desk’s
own chat. A board vote or this document never supplies it.

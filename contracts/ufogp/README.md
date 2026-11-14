# UFOGP contracts — OFF-53 A

2026-11-13 PT. Ada (Astra, Mike's agent). **Draft, simulation only.**
Work order: https://pointcast.xyz/loom?to=loom%3A0c4fe73d9b7a2a11f5f75e2b%23m_4c62372u2k

SmartPy 0.24.1, matching `contracts/v2/seal_soulbound_fa2.py`.
Uses the pinned SmartPy FA2 library for TZIP-12 interfaces and errors.
Nothing here is an approval to originate, mint, spend, merge or deploy.

## Contracts and choices

- **Seat**: admin mints consecutive NFT IDs starting at 0, one unit per ID,
  one distinct holder address per seat. No transfers, operators, burns,
  revocations or reassignments. `token_info` accepts Sid's TZIP-12 metadata
  map (including an empty-string URI). `owner(seat)` and `seat_count()` are
  on-chain views used by DAO. Do not substitute an untrusted Seat contract.
- **Doubloon**: fungible FA2 token ID 0, decimals 0. Admin attests that a job
  is DONE through `mint_done(job, holder, amount, evidence)`. Unique job ID,
  positive award, nonempty evidence, one recipient/award per job ID. The
  contract cannot authenticate Loom posts or independently prove work is done.
  Admin must check the job and evidence first. No sale, price or redemption.
  This draft keeps ledger units nontransferable so the earned record stays
  with its recipient. That policy is a review choice, not a charter rule.
- **DAO**: a seat holder proposes 2–16 distinct options. Eligibility snapshots
  the Seat count at proposal creation; later seats wait for the next poll.
  Each eligible seat votes once, with no edits. Voting is open for exactly
  86,400 seconds: `< closes` accepts votes; `>= closes` allows anyone to close.
  Highest count wins, no quorum. A zero-vote poll closes with no result.
  A tie remains pending until the founder selects one of the tied leaders.
  The result cannot be overwritten. DAO has no execution, transfer, treasury,
  lambda or arbitrary-call path; it only reads Seat views and writes records.

Admin, founder and Seat addresses are immutable. Lost access cannot be
recovered in v1. Distinct holder addresses are required even when one human
operates several agents; no wallet is created here. Admin can add seats but
cannot add them to an already-open electorate. Membership approval remains
an off-chain responsibility. A single holder address is not proof of a
unique human, agent, or authorized admission.

All callable token paths reject attached tez (transfers/operators are
unconditionally denied); `balance_of` sends only the standard zero-tez
callback. DAO rejects attached tez everywhere. No withdraw path exists.
Metadata is fixed at issuance; bounded proposal strings and award references
limit storage per record. State grows over time; no pruning is provided.

## Local simulation

From the repo root, with Python 3.12:

```sh
python3 -m venv /tmp/ufogp-venv
/tmp/ufogp-venv/bin/pip install -r contracts/ufogp/requirements.txt
mkdir -p /tmp/ufogp-simulation
(cd /tmp/ufogp-simulation && /tmp/ufogp-venv/bin/python "$OLDPWD/contracts/ufogp/test_contracts.py")
bash -n contracts/ufogp/originate.sh
```

The two scenarios compile all three contracts to Michelson and exercise
admin-only issuance, duplicate seats/jobs, zero/bad awards, FA2 callbacks
and undefined IDs, transfer/operator denial, unauthorized and repeated
votes, vote-choice bounds, duplicate labels, snapshot eligibility, exact deadline,
zero turnout, plurality, majority, founder-only tie resolution, nonleader
rejection, finality, and attached-tez rejection. Fixed public test addresses
are fixtures, not wallets controlled by this environment. No test account,
key or seed is generated. Output stays outside the repo. CI runs simulation
and shell syntax checks only; it never invokes `originate.sh`.

## Signing desk handoff — not run

`compile.py` compiles one contract locally with explicit public config:

```sh
export UFOGP_CONTRACT=seat # or doubloon, then dao
export UFOGP_ADMIN='PUBLIC_ADMIN_ADDRESS'
export UFOGP_METADATA_URI='REVIEWED_CONTRACT_METADATA_URI'
# DAO only: UFOGP_SEAT is the actual originated Seat KT1, UFOGP_FOUNDER is public.
# Run from a separate output directory:
python /path/to/pointcast/contracts/ufogp/compile.py
```

For each target SmartPy writes `ufogp_TARGET/*_contract.tz` and
`*_storage.tz`. Inspect both. Compile DAO after Seat's actual address is
known; never originate the DAO using the simulation address. Record artifact
hashes and verify admin/founder/Seat addresses and metadata before signing.
No pre-mint occurs in initial storage: Seat is empty; Doubloon supply is zero.

`originate.sh ALIAS CODE.tz STORAGE.tz --dry-run|--execute` is the written
origination handoff. It requires an explicit RPC, existing signer alias and
burn cap; the execute mode additionally requires the Signing desk's approval
marker. That marker is only a guard against accidents, not authentication
or proof of Mike's consent. The Signing desk must obtain Mike's yes with an
amount in its own chat, review a node estimate and operation fees, and supply
its own existing signer. A Loom message never substitutes for that yes.
**Neither mode of the script was run. No RPC simulation or signing was done.**

## Review status

Local SmartPy simulation passes. Independent Codex review found a payable
FA2 callback inherited from the library; both overrides now reject tez and
have regression tests. Lou's separate part-D review remains outstanding.
Real-node protocol acceptance, origination cost, wallet/indexer presentation,
Sid's final metadata and recovery policy still need Signing desk/reviewer
attention. A passing local simulation is not deployment approval.

## Cost estimate (tez, not a quote)

2026-11-13 PT, local compiled fixtures only. Forged Micheline byte lengths
using PyTezos 3.16.1's `forge_micheline` (no client/RPC/signing):

| Contract | Code bytes | Initial storage bytes | Storage burn proxy |
|---|---:|---:|---:|
| Seat | 3,436 | 92 | 0.94625 tez |
| Doubloon | 4,042 | 139 | 1.10950 tez |
| DAO | 2,537 | 121 | 0.72875 tez |
| Total | 10,015 | 352 | 2.78450 tez |

Proxy formula: `(code bytes + initial storage bytes + 257) × 0.00025 tez`
per origination. The 257-byte allocation overhead and 250 mutez/byte are
assumptions, not constants verified against a current node. Lazy storage
accounting, final metadata, script normalization and protocol changes can
change the result. Fixture metadata is deliberately small. Operation/gas
fees are additional; no reveal, mint, proposal, vote or tie-break is included.

**Planning estimate: 3–5 tez for the three originations**, assuming small URI
metadata. Reserve a separate **1–2 tez provisional allowance** for six seat
records and early DAO/job records. No price or market value is assigned to
Doubloons. These are sizing estimates, not permission or spending limits;
the Signing desk must obtain current node estimates and Mike's exact budget
before any real operation. Actual spent here: **0 tez**.

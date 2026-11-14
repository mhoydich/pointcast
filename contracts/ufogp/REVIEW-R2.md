# Round-two checklist response

2026-11-13 PT — Ada. Checklist source: draft PR #1685,
`docs/ufogp/tezos-fa2-dao-review.md` at `dea4ee21f31043fce2c73e1f6322800e0dbead3d`.
This is Ada's response to Lou's checklist, not a claim that Lou approved it.

| Checklist area | Disposition and evidence |
|---|---|
| Privileged roles and recovery | Seat/Doubloon admin can issue only; DAO founder can resolve a pending tie only. All role addresses are immutable. No role change, upgrade, pause, burn or recovery entrypoint exists. Lost access remains a known v1 limitation. |
| Issuance and supply | Seat IDs are sequential, supply one each, distinct holder per seat. Doubloon positive awards require a new job ID and evidence. No lifetime supply cap; Michelson `nat` does not wrap. New tests cover a 2^256 award and unchanged supply/recipient state after a duplicate. |
| Transfers and operators | Both FA2 policies deny transfers and operator changes unconditionally, including zero/empty batches. No unlock path. This is intentional soulbound behavior. |
| Metadata and unknown IDs | Metadata and ledger entries are written together. **Fixed R2:** Seat token_info is capped at 16 fields and 4,096 aggregate UTF-8 key/value bytes. Tests accept 4,096 and reject 4,097; 17 fields reject. Unknown balance token IDs fail. Typed Michelson addresses reject malformed data before entrypoint logic. |
| Atomic failures and callbacks | Failed mint leaves next_token_id and holders unchanged; duplicate award leaves supply/ledger unchanged. Both balance_of implementations reject attached tez, preserve callback order and emit zero tez. Callback failure is subject to protocol operation rollback; no custom reentrancy lock is needed for a read-only balance request. |
| Proposal eligibility and snapshot | Proposer must own the specified Seat. Monotonic IDs; snapshot excludes later seats. No delegation/weight multiplier; no quorum. |
| Deadlines | 86,400 seconds from chain `NOW`, not local timezone/levels. Votes before close only; close at/after boundary. No deadline editing. Boundary regressions pass. |
| Vote replay and arithmetic | One `(proposal, seat)` big-map key; duplicate rejected. Another proposal intentionally permits a fresh vote. No custom signed-vote/nonce format exists: Tezos validates operation signatures, counter and chain context. No unchecked fixed-width arithmetic. |
| Outcomes and execution | Plurality, zero turnout, tie and finality tested. Founder cannot select a nonleader or change a finalized winner. No execution/treasury/upgrade path; execution delays, treasury integration, migration and rollback tests are inapplicable to this record-only draft. |
| Growth and costs | Proposal strings/options and DONE references bounded; Seat metadata now bounded. Big maps grow with history; no loop over all historic seats, proposals or votes. Close scans at most 16 options. FA2 query batches remain caller-sized and gas-limited. No history deletion. COSTS.md gives measured fixtures and limitations. |
| Signing checks | Existing README and originate.sh keep source, RPC, burn cap and amount-specific approval explicit. The script was never run. No keys, wallets, real originations or mints were created. Node helpers in R2 are unsigned, non-injecting previews only. |

The tests do not claim real-wallet/indexer interoperability or production
approval. Independent model review confirmed the bounded-map design and
identified the metadata cap opportunity. Lou's separate review should be
checked on the board before treating round-two review work as settled.

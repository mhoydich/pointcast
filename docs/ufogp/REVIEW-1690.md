# Review of draft PR #1690 — OFF-53 part D
Date: 2026-11-14
Reviewer: Lou (Luna, gpt-6-luna; ChatGPT through Codex)
Scope: static review against `docs/ufogp/tezos-fa2-dao-review.md` on `ufogp/d-review`. No contracts were originated and no tests were run by this reviewer.

## Findings, worst first

### High — Seat issuance has no hard maximum
**File:** `contracts/ufogp/contracts.py:35-49`, with electorate snapshot at `:120-123`.

The admin-only `mint` entrypoint assigns the next sequential seat ID and increments `next_token_id`, but never enforces the federation's six-seat limit (or any other cap). `DAO.propose` snapshots that count, so additional admin-minted seats become eligible voters in later polls. The unique-holder check prevents a duplicate address, but not additional controlled or colluding addresses. A compromised or mistaken immutable admin can therefore expand the electorate and alter future vote outcomes.

**Suggested fix before any origination:** enforce a configured maximum seat count (six if the charter's current six seats are the intended cap) and test that minting seat seven fails without changing ledger, metadata, or count. If membership must grow, make the limit and admission rule explicit before deployment; there is no upgrade path in this draft.

### High — Doubloon awards have no amount or supply ceiling
**File:** `contracts/ufogp/contracts.py:79-89`.

The entrypoint rejects zero and duplicate job IDs, but accepts any positive `nat` amount and adds it to supply. An admin can award an arbitrarily large amount for one DONE job. The token is nontransferable and has no sale path, which limits immediate financial impact, but this does not enforce the stated one-unit-per-finished-job idea and can make the ledger misleading.

**Suggested fix:** if the intended rule is one unit per finished job, hard-code the award to one; otherwise set and document per-job and total-supply caps. Add rejection and atomicity tests at each boundary.

### Medium — Immutable privileged addresses have no recovery or rotation
**File:** `contracts/ufogp/contracts.py:15-19, 61-66, 97-101`.

Seat/Doubloon admin and DAO founder are fixed at construction. There is no rotation or recovery entrypoint. Losing the admin permanently prevents future seat/reward issuance; losing the founder prevents resolving every future tied poll. This is disclosed in the PR, but is an irreversible deployment choice.

**Before origination:** confirm the addresses and recovery policy with the Signing desk. Consider a reviewed multisig or delayed role transfer. If immutability is retained, test and document the loss-of-key consequence; no later patch can repair an originated contract without a migration.

### Medium — Lifetime storage is unbounded; vote/proposal gas is not measured
**Files:** `contracts/ufogp/contracts.py:87-89, 103-104, 121-139`; `contracts/ufogp/COSTS.md`.

Job evidence, proposals, and vote records accumulate in big maps without pruning or a total-history cap. Per-record text/options and metadata are bounded, and `close` scans at most 16 options, but membership is uncapped, so electorate and aggregate vote storage have no stated upper bound. The cost table gives fixture storage-growth proxies; it explicitly leaves `propose` and `vote` script gas unmeasured because the external Seat views cannot be simulated by that runner. This is a disclosed measurement gap, not evidence of an immediate per-call exploit.

**Before origination:** keep the published limitations, obtain representative proposal/vote gas measurements in a setup that includes the Seat view, and decide whether history retention is intentional. The Signing desk must estimate the exact payload and current storage burn; fixture costs are not a lifetime bound.

## Checklist disposition

- **Admin control:** issuance and tie-break roles are explicit and restricted to fixed addresses; no general execution or withdrawal entrypoint was found. The uncapped seat issuance and unrecoverable roles above remain the primary control risks.
- **Mint limits:** duplicate job IDs and positive amounts are checked; the amount and total supply are not capped (finding 2). Seat count is not capped (finding 1).
- **Transfer locks:** both FA2 contracts inherit `NoTransfer`; tests exercise transfer/operator denial. This is a deliberate permanent lock with no unlock/recovery path.
- **Vote windows:** `propose` fixes close at `NOW + 86,400 seconds`; vote requires `NOW < closes`, and close requires `NOW >= closes`. No post-creation window edit was found.
- **Ties:** plurality is recorded; a tied leader set stays pending and only the founder can select a tied leader. A zero-vote poll closes without a result. Tests cover ties and rejection of nonleaders.
- **Replay:** votes are keyed by `(proposal, seat)` and duplicate keys reject. The draft has no signed-vote format or custom nonce to replay; ordinary Tezos operation authentication/counters provide the transaction domain. No cross-proposal signed-vote mechanism was found.
- **Upgrade paths:** no upgrade, migration, pause, or arbitrary-call path was found. That reduces live code-replacement risk but makes constructor choices and lost immutable roles permanent.
- **Storage costs:** per-record bounds and the 16-option close loop are helpful. Big-map history grows over time; cost fixtures are bounded samples, and proposal/vote script gas remains unmeasured as noted above.
- **Atomicity:** duplicate-job and failed mint checks occur before state writes; the simulation tests include failed-issuance state checks. I did not independently execute the test suite.

Static review only. This review is not approval to merge, originate, mint, spend, or deploy.

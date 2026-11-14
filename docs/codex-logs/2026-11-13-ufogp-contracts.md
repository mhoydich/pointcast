# Ada — UFOGP part A — 2026-11-13 PT

Mike directly authorized a contract implementation and draft PR on
`ufogp/a-contracts` from main. This overrides AGENTS.md's older review-only
Codex role for this task. Read AGENTS.md, CLAUDE.md and OPERATIONS.md; used a
fresh cloud clone. Scope is `contracts/ufogp` plus focused simulation CI.

Seat and Doubloon use the repo's SmartPy 0.24.1 FA2 library. DAO snapshots
seats, uses a 24-hour plurality vote and restricts founder tie-breaks to tied
leaders. All three are simulation-only drafts. See the contract README for
review choices, tests, origination handoff and cost assumptions.

No connected wallet tool, Tezos client, standard wallet config directory or
wallet-related environment variable was found. No public address controlled
by this environment is available. Public addresses in tests are fixtures;
addresses in existing repo documents are not evidence of wallet access.
No keys or seeds were read or generated. No merge, deployment, chain call,
origination, real mint, spending, X post or outside contact occurred.

## Round two

Read Lou's part-D checklist in PR #1685. Added a checklist disposition matrix,
metadata count/aggregate-byte bounds and tests for boundaries, failed-state
atomicity, large natural-number supply, and proposal option limits. Added
local cost fixtures and a reproducible, non-injecting node measurement tool.

R2 uses public-node `run_operation` and `trace_code` helpers only. The former
previews origination snapshots with a fixed all-zero dummy signature; it
skips signature verification, does not inject, and changes no chain state.
The existing public source address is only context for hypothetical fee
validation; no wallet control is asserted. Never called a signer or injection
endpoint. The written origination script remains unexecuted.

COSTS.md and costs-simulation.json distinguish measured storage from growth
proxies, trace gas from full operation gas, and fee allowances from fees paid.
DAO propose/vote gas is explicitly unmeasured because the script runner cannot
supply the unoriginated Seat view context. Actual spending remains 0 tez.

At the last pre-push check, Lou had not posted a separate review under OFF-53
or on PR #1690, and PR #1685 still held only the checklist. No such review is
claimed as read or cleared. The interview was already submitted once in R1;
no duplicate was posted in R2.

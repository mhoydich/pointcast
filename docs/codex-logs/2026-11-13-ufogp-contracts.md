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

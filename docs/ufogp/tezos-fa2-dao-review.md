# Tezos FA2 and DAO vote contract review — part D
Date: 2026-11-14

## Review checklist

### FA2 administration and token behavior
- [ ] Identify every privileged role and entrypoint; verify role changes are authorized, observable, and cannot strand control.
- [ ] Check mint/burn authority, per-call and lifetime limits, supply accounting, token ID handling, and zero/overflow boundaries.
- [ ] Verify transfer and operator authorization follows FA2 semantics; check pause/lock controls, who can set/clear them, scope, and exit/recovery behavior.
- [ ] Check metadata and ledger consistency, duplicate/bad addresses, and behavior for unknown token IDs.
- [ ] Confirm failure paths are atomic and do not partially update balances or supply.

### DAO vote behavior
- [ ] Verify proposal creation eligibility, unique IDs, snapshot/quorum rules, and proposal ownership.
- [ ] Check start/end boundaries, timezone/level assumptions, late/early votes, and whether a vote window can be changed after voting starts.
- [ ] Define tie and no-quorum outcomes explicitly; ensure neither silently authorizes execution.
- [ ] Prevent duplicate votes and replay across proposals, chains, contracts, and entrypoints; bind signed votes to voter, proposal, choice, nonce, and domain.
- [ ] Confirm vote tally arithmetic and delegation/weight rules, including zero weight and overflow.
- [ ] Trace execution authorization separately from tallying; enforce delay/expiry and one-time execution.
- [ ] Review upgrade/migration paths: who can upgrade, timelocks, storage compatibility, data preservation, and emergency powers.
- [ ] Estimate storage and execution costs for worst-case proposal, voter, operator, and metadata growth; check bounded iteration and cleanup.

## Test plan

1. Unit tests: authorized/unauthorized admin calls; mint bounds and supply totals; transfer/operator allow and deny cases; locked/unlocked transfers; unknown IDs; malformed addresses; zero amounts; arithmetic boundaries.
2. Vote lifecycle: proposal creation, exact start/end levels, before/during/after votes, quorum, ties, no quorum, duplicate vote, invalid choice, and repeated execution.
3. Replay/security: reuse signed vote/nonce on same and different proposals/contracts/domains; altered voter/choice/chain; stale signatures; reentrancy/callback and failed-operation atomicity where applicable.
4. Upgrade tests: unauthorized upgrade, timelock enforcement, storage migration with populated ledgers/votes, rollback or recovery path, and preservation of invariants.
5. Property/invariant tests: balances sum to supply; no voter counted twice; tallies equal accepted votes; executed proposals cannot execute again; locked transfers obey policy.
6. Integration on testnet/local sandbox: FA2 wallet/operator interoperability, DAO-to-treasury execution authorization, and failure handling.
7. Cost tests: measure gas/storage at expected and worst-case sizes; reject unbounded loops and document cost ceilings. No mainnet origination or real minting during review.

## Signing desk mint checklist

- [ ] Confirm approved proposal, token ID, exact amount, recipient address, and network.
- [ ] Verify signer/contract authority and remaining mint allowance; confirm no transfer lock or pause conflict.
- [ ] Simulate the exact operation and inspect parameters, fees, and resulting balance/supply.
- [ ] Obtain required human approvals; independently verify the recipient and payload.
- [ ] Sign and submit only through the authorized desk process; record operation hash and reconcile ledger after finality.
- [ ] Stop on mismatch, unexpected fee, unknown network, or changed payload. Never share keys or seeds.

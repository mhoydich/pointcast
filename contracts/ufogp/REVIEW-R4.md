# Lou review findings — round-four fixes

2026-11-13 PT — Ada. Read Lou’s `docs/ufogp/REVIEW-1690.md` in draft #1685
and findings under OFF-53. This is the implementation response; Lou’s recheck
must independently say closed or still open.

| Requested fix | Change | Regression evidence |
|---|---|---|
| Fixed seat cap | `Seat(admin, metadata, seat_cap)` stores the cap at origination. `mint` checks count < cap before writes. No setter or handover bypass. Production compiler requires explicit positive `UFOGP_SEAT_CAP`; current charter uses 6. | `cap_and_role_handover` mints six fixtures, rejects seventh, checks unchanged count/cap and absent holder/ledger/metadata; rejects again after admin rotation. Existing snapshot test still excludes seats added after proposal creation. |
| One Doubloon per job | Removed caller-supplied amount from `mint_done`; every accepted job writes amount=1, adds one balance unit and one supply unit. Exact unique job ID is permanently recorded, with no delete/reset path. | Duplicate ID fails before and after admin rotation; second distinct job makes balance/supply exactly two. Invalid job/evidence and unauthorized issuance still reject. |
| Two-step admin/founder | Current role nominates; only pending nominee accepts. Current role may replace/cancel a nomination. Acceptance clears pending and removes old authority. Seat and Doubloon each have their own admin; DAO has founder. | Tests reject unauthorized nomination/cancellation/acceptance, self-nomination, replaced/cancelled nominee, repeated acceptance and attached tez. They prove old admin cannot issue after handover and old founder cannot resolve a pending tie; new roles can. |

The cap does not authenticate membership. Admin must still map one real job
to one canonical case-sensitive job ID; alternate strings for the same real
job cannot be detected on-chain. No lifetime job/proposal cap or history
pruning was added. Big-map history continues to grow, with per-record bounds
and close scanning at most 16 options. The cost table retains its explicit
proposal/vote gas gap and paid-storage proxy limitations.

Handover is planned succession, not a backdoor: if current role and any
pending successor are inaccessible, this contract cannot recover itself.
Seat ownership and the immutable cap do not change with admin succession.
No proposal execution, treasury, upgrade, transfer or withdrawal path was added.

All tests are simulation. Updated COSTS.md includes new code/storage sizes,
fixed-one reward fixtures and nomination/cancellation/acceptance costs.
Nothing was originated or minted on-chain, signed, spent, merged or deployed.

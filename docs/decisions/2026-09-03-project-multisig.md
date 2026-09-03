# Project multisig for the PointCast treasury

**Date:** 2026-09-03

**Status:** approved implementation; not originated; no treasury cutover sent

**Source safe:** Standard Time TzSafe v0.3.4, `KT1UCkcX1kXDiM4ML22Ck2LJdGeo3sT1F4eD`

**Target registry:** `src/data/contracts.json` → `project_multisig.mainnet`

## Decision

PointCast will use a project-owned TzSafe instead of a personal wallet for project revenue. The immediate cutover is the Kennel Club September Sitting FA2, whose `set_treasury(address)` entrypoint controls where future 1 ꜩ mint receipts are forwarded.

The economic reason is the 50/50 house/network split. Revenue belongs to the shared project accounting layer before either side allocates it; routing receipts directly to Mike's personal Kukai wallet makes project funds and personal custody indistinguishable. A dedicated safe gives the split a stable on-chain address, an auditable balance, and an owner set that represents both sides of the operating relationship.

The TzSafe is custody and governance infrastructure, not an automatic payment splitter. It does not calculate or enforce the 50/50 allocation; distributions still need an agreed proposal, accounting record, and verification.

## Reviewed contract and storage

The origination script fetches Michelson from the Standard Time safe through a synchronized mainnet RPC. It refuses code that does not match all three reviewed fingerprints:

- TzKT type hash `1138255963`
- TzKT code hash `-521664810`
- canonical Michelson code SHA-256 `4a1a44f1d0e215efbb28a5a460ade1283d5acc2d0f4fa546bcb9a9d4e951ea3a`

The fetched TzSafe v0.3.4 storage is a seven-field comb:

1. `%proposal_counter: nat`
2. `%proposals: big_map nat proposal`
3. `%archives: big_map nat proposal_state`
4. `%owners: set address`
5. `%threshold: nat`
6. `%effective_period: int`
7. `%metadata: big_map string bytes`

Fresh storage starts with proposal counter zero and empty proposal/archive big maps. It copies the source safe's canonical metadata and seven-day (`604800` second) effective period, then sets only the new owner set and selected threshold.

## Owners and threshold

The owners are fixed at origination:

- Mike Kukai: `tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`
- cc project wallet: `tz1PTUzbDzkddTh2uXMuxrGtRL6ty8aoeysY`

The script defaults to **1-of-2**. This gives operational continuity if one signer or wallet interface is unavailable, and either owner can recover or route funds. Its cost is real: either owner can act alone, so it is shared custody but not enforced joint consent.

Choosing **2-of-2** makes the 50/50 relationship an execution rule: every proposal needs both owners. It also creates a liveness risk—loss, unavailability, or disagreement by either signer can freeze the safe. TzSafe thresholds can later be changed through the safe's proposal process, but changing from 1-of-2 initially can itself be approved by either owner. The selected origination threshold must therefore be recorded as a governance choice, not treated as a technical default.

## Cutover runbook

No command in this document is approval to sign. Mainnet actions remain separate, explicit sessions.

1. Merge the reviewed implementation PR. Leave `project_multisig.mainnet` empty until a real mainnet origination is confirmed.
2. Preparation only: run `node scripts/project-multisig-originate.mjs --threshold 1`. Review RPC health, all code fingerprints, the seven-field storage shape, both owners, threshold, and code/storage SHA-256 values.
3. In an approved mainnet session, load the cc wallet key only through `PROJECT_MULTISIG_SECRET_KEY` and add `--execute --confirm-mainnet I_UNDERSTAND_MAINNET`. The script refuses any key that is not the registered cc wallet. Record the operation hash and resulting KT1. Do not originate from this PR or CI.
4. Verify on TzKT that the KT1 has the reviewed type/code hashes, owners exactly Mike + cc, the selected threshold, zero proposals, and the seven-day effective period. Open the printed `https://tzsafe.org/import-wallet?address=<KT1>` URL, which prefills the TzSafe import screen for the new address.
5. Put the verified KT1 in `project_multisig.mainnet` in a follow-up PR. Preparation only: run `node scripts/kennel-club-set-treasury.mjs` (or pass `--multisig <KT1>` before the registry update). The script verifies the destination fingerprint and owners, the Kennel Club admin, and `set_treasury(address)`.
6. In a separately approved Kukai session, rerun with `--execute --confirm-mainnet I_UNDERSTAND_MAINNET`. Mike signs the single `set_treasury(<KT1>)` operation through Beacon.
7. Verify the applied operation and Kennel Club storage on TzKT. Only future mints are redirected; reconcile the safe's received mutez against post-cutover mint operations before calling the migration complete.

## Rollback

Mike remains the Kennel Club administrator. If the project safe is wrong, inaccessible, or operationally unsuitable, Mike can call `set_treasury(tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw)` to route **future** mint receipts back to Kukai. Verify the applied operation and storage before reopening mint activity.

Rollback does not withdraw funds already held by the TzSafe and does not reverse prior mint payments. Existing safe funds still require the safe's proposal/approval/resolve flow at its active threshold. If the safe itself is defective, pause Kennel Club first, redirect the treasury, preserve the old KT1 and operation history for accounting, and originate a replacement only after a new review and approval.

# Decision: attest Kennel Club attendance after each sitting

**Date:** 2026-09-03

**Status:** implementation ready for review; not migrated, configured, deployed, or executed on-chain

**Contract:** Soulbound Seals `KT19DHCY5S9x48npRyAhUCM2SyLWZMNh3yQ1` on Tezos mainnet

## Decision

`pointcast-kennel-seals` is a separate scheduled Worker. At `15 7 * * *` UTC it reads the authoritative D1 `claims` ledger through yesterday's Los Angeles sitting. Every `held` or `delivered` claim gets one deterministic `showed-up` receipt with public evidence shaped `sitting:NN claim:<id>`.

- A claim whose PointCast user has a linked Tezos identity is queued for attestation to that address.
- A walletless claim is recorded as `pending_wallet` (shown to the member as “seal pending wallet”). A later cron sees the newly linked identity and submits the seal. This uses the accepted next-cron delivery path; the Pages Function never receives the seal issuer secret.
- One run builds one Taquito manager batch, with one `contract.methodsObject.attest({ evidence, kind, to_ })` call per queued receipt. Both byte fields use UTF-8 to hexadecimal encoding.
- A D1 compare-and-set moves each unique `(claim_id, kind)` receipt through `pending_wallet` / `pending` → `submitting` → `submitted` → `attested`. The injected operation hash is stored before confirmation. A receipt in `submitted` or `attested` is never automatically submitted again.
- A failure before injection becomes `failed` and is retryable. A failure after injection stays `submitted` with its operation hash for reconciliation, preventing an automatic duplicate attestation.

The Worker exposes `GET /status` with binding booleans, migration state, configured/dry-run state, the cron, contract, supported/deferred kinds, and receipt counts. It never returns or logs `SEAL_ISSUER_SECRET_KEY`.

After a successful confirmed batch, the Worker posts one service-bound presence burst with kind `seal`. The public `/api/burst` gateway rejects client-authored `seal` bursts, so only the issuer Worker can originate this signal.

## Streak and collection surfaces

The private `/api/collect/me`, `/api/me/holdings`, and `/me.json` responses expose:

- `streak`: the current consecutive claim run through the latest claimed sitting;
- `nextSealAt`: `7`, `30`, or `null` when all 30 are complete.

Held D1 claims count immediately, so a walletless member does not lose visible progress. On-chain Kennel Club balances remain a fallback for claims already delivered to linked wallets. `/collect` shows the streak, attested seal count, and next threshold. `/me` shows the same progress and the receipt state beside each dog.

## Why only `showed-up` can ship on this KT1

The deployed storage does contain a `kinds` big map, seeded with `showed-up`, `kennel-club-holder`, `resident`, and `founding-100`. But the deployed parameter type has no `set_kind` or equivalent entrypoint. The administrator can change issuers and pause state; it cannot mutate `kinds`. Tezos contract code and entrypoints are immutable, so changing the checked-in SmartPy source would not extend `KT19DHCY5S9x48npRyAhUCM2SyLWZMNh3yQ1`.

Therefore this release computes the 7-day and 30-day thresholds but does **not** send `streak-7` or `complete-30` to the existing contract: either call would fail the whole batch with `UNKNOWN_SEAL_KIND`. Those two kinds remain deferred until Mike separately approves a replacement/migration contract (or another explicit on-chain design). No replacement is originated by this PR.

## Migration 0005

`migrations/auth/0005_seal_receipts.sql` creates `seal_receipts` with:

- deterministic receipt identity plus unique `(claim_id, kind)` idempotency;
- claim/user/token references;
- evidence, holder, operation hash, run id, safe error code, and timestamps;
- explicit pending, injection, confirmation, and failure states.

Migration 0005 must land before the Pages API changes or the Worker. A dry run reads the eligible claims and reports counts without writing receipts, using the signer, sending a batch, or posting a burst.

## Cutover — requires Mike and cc

Recommended issuer: reuse the existing Kennel Club claim wallet, `tz1UvNjifVKhP6Hm3ytVfWtmTiCxKozcYsSG`. It already participates in the same bounded claim operation and avoids provisioning another hot key.

1. **Mike signs one administrator operation:**

   `set_issuer({ issuer: "tz1UvNjifVKhP6Hm3ytVfWtmTiCxKozcYsSG", allowed: true })`

   Destination: `KT19DHCY5S9x48npRyAhUCM2SyLWZMNh3yQ1`. Confirm the applied operation and the issuer big-map row on TzKT before continuing.

   Alternative: cc provisions a dedicated issuer key and gives Mike its public tz address for the same `set_issuer(address, true)` call. Reusing the claim wallet is recommended.

2. **cc sets the Worker secret interactively** from the protected key source, never in shell history, source, config, D1, logs, or screenshots:

   `cd workers/kennel-seals && npx wrangler secret put SEAL_ISSUER_SECRET_KEY`

3. **cc applies migration 0005** to `pointcast-auth` using the root Pages config:

   `npx wrangler d1 migrations apply pointcast-auth --remote --config wrangler.toml`

4. **cc deploys dependencies in order:** `workers/presence` (adds the `seal` burst kind), `workers/kennel-seals`, then the PointCast Pages build (adds receipt-aware APIs/UI).

5. **cc verifies before enabling live writes:** `/status` shows configured + migration applied, run once with `SEAL_DRY_RUN="true"`, inspect the candidate count and zero chain writes, restore false, then observe one scheduled batch. Prove the operation applied, every D1 receipt reached `attested`, the contract `seals` rows match holder/kind/evidence, and exactly one `seal` burst appeared. Re-run the same sitting and prove zero additional calls.

## Non-actions in this PR

No migration was applied. No Worker or Pages build was deployed. No secret was set or read. No wallet was provisioned or funded. No `set_issuer`, `attest`, or other on-chain operation was signed or submitted. The PR is the complete staged handoff for Mike's approval and cc's cutover.

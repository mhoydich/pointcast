# Kennel Club free claim: PointCast pays, held until wallet

**Date:** 2026-09-02

**Status:** implementation ready for review; not deployed or configured

**Supersession note (2026-09-04):** The retry model below is superseded by
`migrations/auth/0010_kennel_operation_safety.sql`. Claim and delivery signers
now use D1 compare-and-set locks; delivery rows are reserved before transfer;
every injected operation hash is recorded before confirmation and retained on
later failure; retries reconcile that hash through TzKT before any new spend.
This note describes reviewed source only, not an applied migration or deploy.

**Contract:** `KT1JWNAKyiWVsbfNrHBQuuBDaGRBYqfehwdq` on Tezos mainnet

## Decision

PointCast offers one free Kennel Club claim per signed-in PointCast user for each daily sitting. A Google account is enough to claim. A Tezos wallet is optional at claim time:

- If the user already linked a Tezos identity, one manager operation batches the paid `mint(token_id)` call and the FA2 transfer to that address.
- Otherwise the claim wallet mints the dog and holds it. The D1 claim row remains `held` until the user links a Tezos wallet.
- Linking a Kukai-backed Tezos identity schedules delivery automatically. An authenticated `POST /api/kennel-club/deliver` also transfers all held dogs for the user.

The contract keeps its existing open-edition and per-day-window rules. Token ID remains day minus one.

## Economics and limits

Each claim sends exactly 1 ꜩ from the dedicated PointCast claim wallet to the contract. The contract forwards that 1 ꜩ to Mike's configured treasury immediately, so the 1 ꜩ principal stays within PointCast/Mike-controlled wallets; the economic cost is Tezos operation fees and storage burn.

The claim Function refuses work when the claim-wallet balance is below 3 ꜩ. It also enforces a per-sitting global cap from `KENNEL_CLUB_CLAIM_DAILY_CAP`, defaulting to 50, plus IP and user rate limits in `PC_RATES_KV`. A D1 reservation is inserted before the chain call. Failed reservations count against the daily cap to keep maximum hot-wallet exposure bounded; the same user may retry the same failed reservation.

## Required production configuration

Claude Code must provision a small, dedicated claim wallet and set its secret key as a Cloudflare Pages secret. Never put the key in source, a checked-in environment file, logs, or a public build:

```sh
wrangler pages secret put KENNEL_CLUB_CLAIM_SECRET_KEY
```

Set `KENNEL_CLUB_CLAIM_DAILY_CAP` as a Pages environment variable if a value other than 50 is wanted. Apply the new `AUTH_DB` migration before opening claims:

```sh
npx wrangler d1 migrations apply AUTH_DB --remote
```

The UI treats a missing claim-wallet secret as a deliberate closed state and says that claims open soon. This PR does not set either value, fund a wallet, apply the remote migration, deploy, or originate a contract.

## Held-dog delivery

The `claims` table stores `user_id`, `token_id`, `status`, `op_hash`, `delivered_to`, and `created_at`. A walletless claim is minted to the claim-wallet address and saved as `held`. When a Tezos identity is linked, the auth Function first atomically assigns every held token to one opaque reservation, then submits one FA2 `transfer`. The injected hash and destination are persisted before confirmation. Only after confirmation, or a later TzKT reconciliation that proves `applied`, does D1 mark those rows `delivered`.

If submission fails before injection, the reservation can be retried. If an operation was injected, its hash remains append-only in `kennel_chain_operations`; a timeout is `submitted`/unknown, not retryable. Only a definitive on-chain failure permits another submission.

## Risks and controls

- The claim signer is a hot key inside a Pages Function. Keep the wallet deliberately small, retain the balance floor, cap daily claims, and monitor its balance and operations.
- Concurrent Functions serialize use of the Tezos manager through a D1 lock. A D1 reservation is still not proof of mint; only an applied operation and the resulting chain state are proof.
- A held dog is custodial until delivery. `/me` labels that state explicitly: “held for you — link a wallet to take it home.”
- D1 is the claim and delivery source of truth. The public ticker shows only a sanitized first name, never an email or full Tezos address.
- TzKT verification and a matching D1 claim row are required before a public `claim` burst is broadcast.

## Release verification

Before enabling claims in production: apply the migration, set the secret, fund only the dedicated wallet, confirm its derived address, run one walletless claim, link Kukai, observe automatic delivery, run one already-linked claim, and verify both operation groups and FA2 balances on TzKT. Keep the secret out of every screenshot and log.

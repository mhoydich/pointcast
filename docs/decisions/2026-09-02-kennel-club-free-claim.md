# Kennel Club free claim: PointCast pays, held until wallet

**Date:** 2026-09-02

**Status:** implementation ready for review; not deployed or configured

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

The `claims` table stores `user_id`, `token_id`, `status`, `op_hash`, `delivered_to`, and `created_at`. A walletless claim is minted to the claim-wallet address and saved as `held`. When a Tezos identity is linked, the auth Function submits one FA2 `transfer` containing every held token for that user. Only after the operation confirms does D1 mark those rows `delivered` and record the delivery operation hash and destination.

If delivery fails, the rows stay `held` and can be retried. If the mint operation fails, the reserved row is marked `failed` without an operation hash.

## Risks and controls

- The claim signer is a hot key inside a Pages Function. Keep the wallet deliberately small, retain the balance floor, cap daily claims, and monitor its balance and operations.
- Concurrent Functions can contend for the same Tezos manager counter. Failed claims remain visibly failed and retryable; do not treat a D1 reservation as proof of an on-chain mint.
- A held dog is custodial until delivery. `/me` labels that state explicitly: “held for you — link a wallet to take it home.”
- D1 is the claim and delivery source of truth. The public ticker shows only a sanitized first name, never an email or full Tezos address.
- TzKT verification and a matching D1 claim row are required before a public `claim` burst is broadcast.

## Release verification

Before enabling claims in production: apply the migration, set the secret, fund only the dedicated wallet, confirm its derived address, run one walletless claim, link Kukai, observe automatic delivery, run one already-linked claim, and verify both operation groups and FA2 balances on TzKT. Keep the secret out of every screenshot and log.

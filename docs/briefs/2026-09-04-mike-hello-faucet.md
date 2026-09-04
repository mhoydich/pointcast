# Mike brief — turning on the HELLO spigot

**Date filed:** 2026-09-04 PT
**Filed by:** Claude Code (cc)
**Page:** `/faucet/hello`
**Status after this PR merges:** the desk is live and people can sign in and **claim** (ledger only). **Sending** stays closed until you do the four steps below. Nothing here needs Codex to have finished the plate; it does need Codex's go on the code first (see `2026-09-04-codex-hello-faucet.md`).

## What you are turning on

A hot wallet, called the spigot, that holds a slice of HELLO and a little ETH for gas, and sends HELLO to whatever address a signed-in person pastes. It is the only key the faucet ever uses. It is **not** the 2019 deployer key and must never be.

## The four steps (about fifteen minutes)

### 1. Make the spigot wallet

Any fresh Ethereum wallet. Simplest: a new account in your existing wallet app, or a throwaway created offline. Write down the address (`0x…`) and export the private key (`0x` + 64 hex characters). Put the key in the password manager under **PointCast HELLO spigot**.

### 2. Fund it, from the 2019 deployer

From the deployer wallet `0x676a…186e` (import it into a wallet app from the password manager, then remove it again when done):

| Send | Amount | Why |
|---|---|---|
| HELLO | 5,000 | ~100 days at the 50/day town cap. It is valueless; more is fine. |
| ETH | 0.02 | Gas for a few hundred sends at 2026 mainnet prices. Top up when `/faucet/hello` shows "low". |

Confirm on Etherscan that the spigot address holds both.

### 3. Set the secrets on Cloudflare Pages

Pages → pointcast → Settings → Environment variables → **Production**:

| Name | Value |
|---|---|
| `HELLO_FAUCET_SECRET_KEY` | the spigot private key (`0x…`, encrypt it) |
| `FAUCET_ETH_RPC_URL` | optional; leave unset to use `https://cloudflare-eth.com` |
| `HELLO_FAUCET_DAILY_CAP` | optional; default 50, max 500 |

The ledger uses the existing `AUTH_DB` D1 binding and `PC_RATES_KV`; nothing new to bind.

### 4. Apply the migration and redeploy

```
npx wrangler d1 migrations apply <AUTH_DB name> --remote
```

(`migrations/auth/0009_faucet_claims.sql` is the only new file.) Then redeploy so the secret is picked up. Open `/api/faucet/hello`: `claims.configured` should be `true` and `spigot` should show the address and balances.

## Approvals

- Sending real tokens from a server-held key is new for PointCast. Codex review first, then your call.
- The daily cap is the blast radius: 50 HELLO a day, plus gas. A stolen spigot key costs at most what is in the spigot.

## Not verified from the sandbox

cc could not reach an Ethereum RPC from the build sandbox (egress policy), so the HELLO decimals and the deployer's balance were not read. The code reads decimals from the contract at send time, so nothing depends on guessing. Please eyeball `0x1fda…012f` on Etherscan once: holders tab should show the deployer holding most or all of the supply.

## Remaining risk

- Two people pressing Send in the same second could race the wallet nonce; the KV lock narrows it and any failed send puts the drips back in the ledger. Codex may ask for a queue before funding.
- "Delivered" means broadcast. A dropped transaction shows a receipt link that 404s on Etherscan. Rare on mainnet; the fix is a re-send from the ledger, which cc can add if it ever happens.

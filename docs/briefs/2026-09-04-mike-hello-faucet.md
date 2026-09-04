# Mike brief — turning on the HELLO spigot

**Date filed:** 2026-09-04 PT · revised same day after Mike's call
**Filed by:** Claude Code (cc)
**Page:** `/faucet/hello`
**Status:** PR #1049 is merged. Once Cloudflare finishes the build from main, people can sign in and **claim** (ledger only). **Sending** opens the moment the one secret below is set and the site is redeployed. There is no migration step: the tables create themselves on first use.

## Correction (2026-09-04, later): the deployer is Leonar's

Mike: "leonar was the holder of the contract not me." So the HELLO deployer `0x676a…186e` is not Mike's wallet and its key is not in play. The spigot is a **fresh wallet**: Leonar sends it HELLO, Mike's MetaMask sends it a little ETH, and only that fresh key goes to Cloudflare. The runbook for that is `docs/briefs/2026-09-04-sol-hello-spigot.md`; the sections below are kept for the record but superseded where they say the spigot is the deployer.

## The three steps (about five minutes)

### 1. Paste the key into Cloudflare

Pages → pointcast → Settings → Environment variables → **Production** → Add:

| Name | Value |
|---|---|
| `HELLO_FAUCET_SECRET_KEY` | the HELLO row's private key from the sheet, as `0x` + 64 hex characters (add the `0x` if the sheet stores it bare). Mark it **encrypted**. |
| `FAUCET_ETH_RPC_URL` | optional; leave unset to use `https://cloudflare-eth.com` |
| `HELLO_FAUCET_DAILY_CAP` | optional; default 50, max 500 |

The ledger uses the existing `AUTH_DB` D1 binding and `PC_RATES_KV`; nothing new to bind.

### 2. Redeploy, that's it

Redeploy so the secret is picked up. The ledger tables create themselves on the first request (`CREATE TABLE IF NOT EXISTS`, same DDL as `migrations/auth/0009_faucet_claims.sql`, which stays for local work and tests). Then open `/api/faucet/hello`: `claims.configured` reads `true` and `spigot` shows `0x676a…186e` with its HELLO and ETH balances. Claim one, paste any address, press Send, follow the Etherscan link.

### Gas

The spigot is the deployer wallet `0x676a…186e`, not the MetaMask account. It stops sending under 0.001 ETH and the page says "getting low" under 0.005 ETH. A few thousandths of an ETH is dozens of sends at 2026 gas. If the live panel shows the spigot at 0 ETH, send it a little from anywhere.

## Alternative kept on file: a fresh spigot wallet

If you ever want the deployer key off the server: make a new wallet, send it 5,000 HELLO and 0.02 ETH from the deployer, and swap the secret to the new key. The code does not care which wallet it is.

## Remaining risk

- Sends are serialised by a D1 lock row, so two people pressing Send at once no longer race the wallet nonce. A send that fails before broadcast returns the drips to the ledger; a send that broadcasts is never un-delivered, even if the ledger write after it fails (the hash is logged for hand reconciliation).
- "Delivered" means broadcast. A dropped transaction shows a receipt link that 404s on Etherscan. Rare; the fix is a re-send from the ledger, which cc can add if it ever happens.
- The daily cap (50) is the only thing bounding outflow, and a cap is not a lock. That is the accepted trade.

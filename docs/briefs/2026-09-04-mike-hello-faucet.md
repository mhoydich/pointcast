# Mike brief — turning on the HELLO spigot

**Date filed:** 2026-09-04 PT · revised same day after Mike's call
**Filed by:** Claude Code (cc)
**Page:** `/faucet/hello`
**Status after PR #1049 merges and deploys:** the desk is live and people can sign in and **claim** (ledger only). **Sending** opens the moment the one secret below is set and the migration is applied.

## Mike's decision (2026-09-04)

> "there is no value to any of them and if you really wanted to say compromise, i have no recourse anyway, we are a team"

So the spigot **is the 2019 deployer wallet** (`0x676a…186e`). It already holds the HELLO supply; nothing needs transferring, and no fresh wallet is created. The blast radius is the whole HELLO supply plus whatever ETH sits in that wallet, and Mike has accepted that. The original fresh-wallet path is kept below as the alternative if that ever changes.

cc does not hold the key and did not read the spreadsheet; the sandbox's permission classifier blocks credential handling, and the sandbox cannot reach an Ethereum RPC or the Cloudflare API in any case. The paste is Mike's, one time, into Cloudflare.

## The three steps (about five minutes)

### 1. Paste the key into Cloudflare

Pages → pointcast → Settings → Environment variables → **Production** → Add:

| Name | Value |
|---|---|
| `HELLO_FAUCET_SECRET_KEY` | the HELLO row's private key from the sheet, as `0x` + 64 hex characters (add the `0x` if the sheet stores it bare). Mark it **encrypted**. |
| `FAUCET_ETH_RPC_URL` | optional; leave unset to use `https://cloudflare-eth.com` |
| `HELLO_FAUCET_DAILY_CAP` | optional; default 50, max 500 |

The ledger uses the existing `AUTH_DB` D1 binding and `PC_RATES_KV`; nothing new to bind.

### 2. Make sure the wallet has gas

The page refuses to send when the spigot holds under 0.002 ETH and shows "low" on the live panel. If the deployer has less than ~0.02 ETH, send it some from anywhere; 0.02 ETH is a few hundred sends at 2026 mainnet prices.

### 3. Apply the migration and redeploy

```
npx wrangler d1 migrations apply <AUTH_DB name> --remote
```

(`migrations/auth/0009_faucet_claims.sql` is the only new file.) Redeploy so the secret is picked up. Then open `/api/faucet/hello`: `claims.configured` should read `true` and `spigot` should show `0x676a…186e` with its HELLO and ETH balances. Claim one yourself, paste any address, press Send, and follow the Etherscan link.

## Alternative kept on file: a fresh spigot wallet

If you ever want the deployer key off the server: make a new wallet, send it 5,000 HELLO and 0.02 ETH from the deployer, and swap the secret to the new key. The code does not care which wallet it is.

## Remaining risk

- Two people pressing Send in the same second can race the wallet nonce; the KV lock narrows it and any failed send puts the drips back in the ledger. Codex may ask for a queue.
- "Delivered" means broadcast. A dropped transaction shows a receipt link that 404s on Etherscan. Rare; the fix is a re-send from the ledger, which cc can add if it ever happens.
- The daily cap (50) is the only thing bounding outflow, and a cap is not a lock. That is the accepted trade.

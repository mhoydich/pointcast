# Sol brief — turn on HELLO sending (fresh spigot wallet, Leonar sends the supply)

**Date filed:** 2026-09-04 PT
**Filed by:** Claude Code (cc) for Mike to hand to Sol
**Repo:** `mhoydich/pointcast` · faucet code is on `main` (PRs #1049, #1059)
**Page:** `/faucet/hello` · live desk `/api/faucet/hello`
**Correction from Mike:** the HELLO contract and its deployer wallet `0x676a…186e` belong to **Leonar**, not Mike. So the spigot is **not** the deployer. It is a fresh wallet that Leonar funds with HELLO and Mike funds with a little ETH.

## The job in one line

Make a fresh spigot wallet, put its key in Cloudflare, get Leonar to send it HELLO, get a few thousandths of an ETH into it, redeploy, and send one HELLO end to end.

## Step 1 — make the spigot wallet

Any fresh Ethereum wallet. From the repo (viem is installed):

```
cd pointcast && npm ci
node -e "import('viem/accounts').then(({generatePrivateKey, privateKeyToAccount}) => { const k = generatePrivateKey(); console.log('ADDRESS', privateKeyToAccount(k).address); console.error('KEY', k); })"
```

The address prints to stdout; the key prints to stderr so it does not land in a log by accident. Put the key in Mike's password manager as **PointCast HELLO spigot**. Do not commit it, paste it in chat, or write it to the repo.

## Step 2 — set the secret and redeploy

Cloudflare Pages → pointcast → Settings → Environment variables → **Production**:

| Name | Value |
|---|---|
| `HELLO_FAUCET_SECRET_KEY` | the spigot private key, `0x` + 64 hex, marked **encrypted** |

Optional: `FAUCET_ETH_RPC_URL` (default `https://cloudflare-eth.com`), `HELLO_FAUCET_DAILY_CAP` (default 50, max 500).

Or from a machine with Wrangler auth: `npx wrangler pages secret put HELLO_FAUCET_SECRET_KEY --project-name pointcast`.

Redeploy (Deployments → retry latest, or any push to `main`). There is no migration to apply; the ledger tables create themselves on first use.

## Step 3 — the HELLO supply, from Leonar

Send Leonar this, with the spigot address filled in:

> Hi Leonar. PointCast is running a small daily faucet for the 2019 HELLO token (`0x1fda96405dd8ee22631abcf4f61282eae802012f`). It hands out one HELLO a day per person, no value, just a greeting. Could you send **5,000 HELLO** from the deployer wallet to the faucet's spigot address: `0x…`? That is about 100 days at the cap. The page is pointcast.xyz/faucet/hello. Thank you.

Before asking, confirm on Etherscan (token page → Holders) that the deployer still holds the supply, and note the balance in the report.

## Step 4 — gas

The spigot needs a few thousandths of an ETH. Mike's MetaMask (`0x48E8…38b37`) has ~0.005 ETH on mainnet; **0.003 ETH** to the spigot address is plenty for now. That send is Mike's tap in MetaMask unless Sol holds that account. The desk stops sending under 0.001 ETH and says "getting low" under 0.005.

## Step 5 — verify and send one

1. Open `/api/faucet/hello`: `claims.configured` is `true`, `spigot.address` is the new wallet, `spigot.tokenBalance` shows Leonar's HELLO, `spigot.ethBalance` shows the gas.
2. On `/faucet/hello`, sign in, claim today's HELLO, paste any address (Mike's MetaMask is fine), press Send, follow the Etherscan receipt.
3. Report: spigot address, HELLO and ETH balances, the tx hash of the first send, anything odd. Comment on issue #1052 and write `docs/manus-logs/2026-09-04-hello-faucet-spigot.md` if you have write access.

## Do not

- Do not use the deployer key, Leonar's key, or Mike's MetaMask key as the spigot. Fresh wallet only.
- Do not open or copy the `eth info` spreadsheet. Nothing here needs it.
- Do not commit any key or `.env.local`.

## If something is off

- `spigot` is `null` on `/api/faucet/hello` after redeploy → the secret is missing or not `0x` + 64 hex.
- `spigot.tokenBalance` is 0 → Leonar's transfer has not landed; check the spigot address on Etherscan.
- Send returns "can't reach Ethereum" → the default RPC is having a moment; set `FAUCET_ETH_RPC_URL` to another public mainnet RPC and redeploy.

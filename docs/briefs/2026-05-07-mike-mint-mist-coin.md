# Mint brief — `/mist` coined on Zora

**For:** Mike
**From:** cc
**Date:** 2026-05-07
**Branch:** `feat/mist-room-cc-2026-05-08`

You picked option 1 (coin /mist on Zora). Here's the exact recipe so the widget I just shipped (`MistCoinWidget.astro`) goes live the moment you paste the address.

## What's already in the code

- `src/components/MistCoinWidget.astro` — the widget. Reads `name`, `symbol`, `decimals`, `totalSupply` from the coin contract on Base via viem at build time. Renders coin name + symbol + total supply + Trade-on-Zora / Trade-on-Uniswap / Basescan buttons.
- `src/lib/eth/config.ts` — has two new constants, both currently `null`:
  - `MIST_COIN_BASE` — the coin's ERC-20 contract address
  - `MIST_COIN_POOL_BASE` — the Uniswap V4 pool address (optional, cached for the widget so it doesn't have to re-query)
- `src/pages/mist.astro` — renders `<MistCoinWidget />` between the Window onto Ethereum (Nouns) tile and the App Catalog. Until you set the address, it shows a "minting on Zora — seat at the table is empty" placeholder.

## The mint flow

### 1. Open Zora and connect

Go to **[zora.co](https://zora.co)**. Connect with whatever wallet you use for Base ops (MetaMask, your Coinbase Smart Wallet, etc.). Make sure the wallet is on **Base mainnet**.

### 2. Create the coin

Click **Create**. Zora's coining flow asks you to attach a post — paste:

```
https://pointcast.xyz/mist
```

Zora will pull metadata from the page (title, description, OG image). The OG card is the existing /mist OG; verify it looks right or upload a custom image.

### 3. Set name and symbol

Recommended:

- **Name:** `PointCast Mist` (or `Mist` if Zora caps you at 8 chars)
- **Symbol:** `MIST` (4 chars, all caps — what shows up in wallets and on Uniswap)
- **Description:** something like *"The room itself, coinable. /mist is PointCast's continuation of the 2014 Ethereum Mist vision — App Catalog by action, identity picker, editable contracts as Terms of Use. The coin is the room's own market. Trade it, hold it, ignore it. CC0-flavored."*

### 4. Mint

Confirm, sign, pay. Cost on Base is about $0.50 in gas. You'll get back:

- A **coin contract address** — `0x…` on Base. **This is the one you need.**
- A **Uniswap V4 pool address** — Zora records this on the coin contract; copy if visible
- A **Zora coin URL** — `https://zora.co/coin/base:0x…`

Stash all three somewhere you can find them (a sticky note, a doc, this brief).

### 5. Wire the address into the site

Single config edit. Open `src/lib/eth/config.ts` and change:

```ts
export const MIST_COIN_BASE: `0x${string}` | null = null;
export const MIST_COIN_POOL_BASE: `0x${string}` | null = null;
```

to:

```ts
export const MIST_COIN_BASE: `0x${string}` | null = '0xYOUR_COIN_ADDRESS';
export const MIST_COIN_POOL_BASE: `0x${string}` | null = '0xYOUR_POOL_ADDRESS';  // optional
```

Commit, push, deploy. The widget reads the contract at build time and renders the live data.

```
git add src/lib/eth/config.ts
git commit -m "feat(mist): wire MIST coin address from Zora mint"
git push origin feat/mist-room-cc-2026-05-08
npx wrangler pages deploy dist --project-name pointcast --branch feat/mist-room-cc-2026-05-08
```

(Or just edit on GitHub web and let Cloudflare Pages auto-build pick it up if the webhook is alive.)

### 6. Verify

Visit `/mist` (preview URL or pointcast.xyz once merged). The coin section should now show:

- The coin name + symbol
- Total supply (the initial mint amount Zora set, usually 1B with 18 decimals)
- "Trade on Zora" + "Trade on Uniswap" + "Basescan" buttons all populated with your coin address

If the Base RPC was slow at build time you might see a fallback card with the address but no live data — that's fine, next deploy will refresh it.

## What I'd consider after the mint

These are out of scope for *getting MIST live* but worth knowing they exist:

- **Live price tile**: read the Uniswap V4 pool's `slot0` and convert `sqrtPriceX96` → ETH price. Adds ~50 lines to the widget. I can do this in a follow-up once the pool address is known.
- **24h volume + holder count**: requires a subgraph query (Zora hosts one) or scanning Transfer events. Heavier integration. I'd lean on Zora's API rather than indexing ourselves.
- **Block-level coin gating**: certain blocks could require holding N MIST to attest via the Wire Attestations contract. That's a meaningful coordination primitive but lives squarely in the v1+ "now we're using the coin for something" lane.
- **Airdrop to Day-1 visitors**: snapshot the wallets that signed in via SIWE before some cutoff, drop them MIST. Lore-rich. Requires the Wire Attestations contract to be deployed first so we have a clean signer log.

## Approval gate

Per the project rule (and the `pointcast` skill), only you mint. cc never originates contracts on your behalf. The mint is your hand to play. The widget I shipped is read-only and will sit politely in placeholder mode until you finish.

## What if you change your mind

If the Zora coin path turns out to be wrong (fees too high, the Uniswap V4 pool doesn't get any depth, the lore lands flat), no commitment locks us in. The MistCoinWidget can render a "retired" state with one config edit (`MIST_COIN_BASE = null`), and we can swap in a self-deployed ERC-20 (option 2 from the earlier proposal) without touching the rest of /mist.

— cc

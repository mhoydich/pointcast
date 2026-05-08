---
date: 2026-05-07
status: approved
deciders: mike, cc
supersedes: docs/wallet-metamask-diagnosis.md (Manus 2026-04-17)
---

# Decision: PointCast Ethereum surface — `/mist` room

## Context

The Ethereum surface has been stalled since 2026-04-17. Manus diagnosed why
MetaMask broke, recommended dropping it from `WalletConnect.astro`, and
explicitly punted the build to "when Mike decides on poster vs. coin vs.
skip + a Wagmi or Zora SDK scaffold is scoped." That decision has been
postponed for three weeks.

Mike asked on 2026-05-07 to lead the buildout, prompted by the 2014
Ethereum Mist video (Alex Van de Sande presents the original Ethereum
dApp browser vision — coordination primitives as default apps, App
Catalog by action, identity picker, editable contracts as Terms of Use).

## Decision

Build a new room at `/mist` — direct tribute to the 2014 vision, framed
as a continuation of what the Mist team couldn't ship because Electron
RCEs and full-node sync killed the project. PointCast can ship the
substance of the 2014 vision in 2026 because the infra finally caught
up: Astro static + Cloudflare Workers + L2 reads + 2026 wallet UX
sidesteps every wall the Mist team hit.

## Specifics approved by Mike

- **Room name**: `/mist`. Tribute, not clone. Joins the cultural-artifact
  naming pattern alongside `/mythos`, `/window`.
- **Chain set**: Base mainnet for writes (low gas — ~$0.001-0.05/tx in
  May 2026), Ethereum L1 read-only for ENS resolution + the Nouns DAO
  live-auction tile. Optimism / Zora chain explicitly out of scope for
  v0 to keep surface area small.
- **Lead login**: Coinbase Smart Wallet (passkey, no seed phrase, mobile
  Safari works) — the 2026 equivalent of Mist's "Invitation Token"
  vision. MetaMask is fallback only, gated behind the hardened
  `connectMetaMaskAndSwitchToBase()` from the Manus diagnosis doc.
- **Stack**: viem + siwe (framework-agnostic, edge-compatible). NOT
  wagmi/RainbowKit — those are React-only and PointCast is Astro +
  vanilla TS. Coinbase Smart Wallet SDK loads via jsDelivr CDN with SRI,
  matching the existing Beacon SDK pattern in `WalletConnect.astro`.
- **Publish primitive**: A single ERC-721 on Base — "Wire Attestations".
  Each PointCast block becomes a token with `{block_id, content_hash,
  agent_address, signed_at}`. cc writes the source. Mike signs the
  origination — same rule as Tezos: no agent ever signs origination
  ops on Mike's behalf.
- **Outbound only, no marketplace**: View-on-Zora / View-on-OpenSea /
  Cast-to-Farcaster are URL routes, not built marketplaces.

## Why not the obvious alternatives

- **Why not just keep waiting on Zora?** Zora-on-Base is one of the
  catalog cards. The room itself is the thing — the catalog populates
  over time. Waiting for one specific marketplace to ship has been the
  block for three weeks.
- **Why not wagmi?** Adding React to a vanilla-TS Astro codebase is a
  much bigger architectural shift than this build calls for. viem alone
  covers the read/write surface; the wallet UI we already have works
  for Beacon and just needs EVM handlers wired in.
- **Why Base, not L2 sprawl?** Optimism / Arbitrum / Zora chain are
  fine but split the substrate. Base has Zora, Nouns auction-mirror
  activity, Farcaster, sub-cent gas, and Manus already specced it in
  April. v1 can widen.
- **Why an attestation contract, not minting blocks as NFTs?** The
  attestation framing — `{block_id, content_hash, signer}` — keeps
  the on-chain identity light and the off-chain block canonical. The
  block stays in the repo; the chain just records that an agent
  signed off on it at a moment. Cheap, philosophically right, leaves
  room for richer minting later as a separate contract.

## What the 2014 Mist mockup gets us

The original mockup's power is its clarity: a vertical sidebar, an
App Catalog grouped by action ("Money Together", "New Societies",
"Information is Power"), an Identity Picker, an editable-contract Terms
of Use. PointCast already has the analogues for most of these — channels
strip + Worlds Rail = sidebar + catalog, multi-resident agent system =
identity picker. The `/mist` room renders them in the 2014 idiom and
adds the things PointCast didn't have:

- An actual Ethereum wallet connect flow
- Read panels for ENS / balance / NFTs owned
- A "Window onto Ethereum" tile (live Nouns DAO auction from L1)
- The Wire Attestations write primitive

## Plan

Five small reviewable PRs over ~24 hours, one branch
(`feat/mist-room-2026-05-08`). Codex reviews wallet/contract code per
`CLAUDE.md`. Manus QAs the real-browser SIWE + passkey + Base mint flow
once the room is live. Manual `wrangler pages deploy` per the busted
GitHub→Pages webhook.

1. **Scaffold**: viem + siwe deps, `src/lib/eth/{config,clients}.ts`,
   this decision doc, wire block 0450.
2. **SIWE login + Identity Picker**: implement the auth/web3 endpoint
   per Manus's design, wire Coinbase Smart Wallet, uncomment + harden
   the MetaMask path with the diagnosis doc's
   `connectMetaMaskAndSwitchToBase()`.
3. **`/mist` v0**: vertical sidebar, App Catalog grid, connected-wallet
   read panel, Nouns DAO live tile.
4. **Wire Attestations contract**: source written by cc, deployed by
   Mike, per-block "Attest on Base" button.
5. **Outbound**: View-on-Zora / View-on-OpenSea / Cast-to-Farcaster.

## What this decision doesn't say

- Whether the room becomes the new home for `/eth-legacy`. v0 keeps
  them separate — `/eth-legacy` is the historical retrospective, `/mist`
  is the live workbench.
- Whether Solana / Phantom comes back. Out of scope for v0 — Manus's
  diagnosis recommended dropping it alongside MetaMask and the same
  reasoning still applies.
- Whether agents get their own EVM wallets. The attestation contract
  is signed by *whoever connects* — could be Mike, could be a visitor,
  could later be an agent if we mint per-resident keys. v0 is
  human-signer-only.

— cc, 2026-05-07

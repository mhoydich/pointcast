# Manus QA brief — `/mist` v0

**For:** Manus
**From:** cc
**Date:** 2026-05-07
**Branch:** `feat/mist-room-cc-2026-05-08`
**Commits:** `cec6778` (scaffold) → `0a12cb8` (SIWE) → `ef178d3` (page) → `475956e` (ENS + balance) → (this commit) (agents.json + wire block)
**Result destination:** `docs/manus-logs/2026-05-08-mist-qa.md`

## What to test

The new `/mist` room — PointCast's Ethereum-surface workbench. Continuation of the 2014 Mist vision, built on Base (writes) + Ethereum L1 (ENS reads) + Tezos (existing).

Live preview will be at the Cloudflare Pages preview URL once the branch is built. Until then, run locally:

```
git fetch origin feat/mist-room-cc-2026-05-08
git checkout feat/mist-room-cc-2026-05-08
npm ci
npm run dev   # or npm run preview after npm run build:bare
```

Then `http://localhost:4321/mist`.

## Acceptance criteria

### A. Page renders cleanly (no wallet)

1. Open `/mist` in a fresh browser session (no wallet connected).
2. **Capture screenshot 1**: header + Identity panel ("No wallet connected. Use the connect wallet button…") + sidebar + at least one App Catalog category visible.
3. Verify all four sidebar links (Money Together / New Societies / Information is Power / Make Together) jump to the corresponding section without page reload.
4. Verify all 12 catalog tiles render — each with a kind chip (`in-house` / `dapp` / `window`) and a chain chip (`tz` / `eth` / `base` / `multi` / `fc`).
5. Verify "soon" tiles (Coffee Mugs, Wire Attestations) render at reduced opacity with `soon →` instead of `enter →` / `open ↗`.

### B. MetaMask sign-in flow (desktop)

1. Install or unlock MetaMask. Make sure you have at least one account on Ethereum mainnet.
2. Click `connect wallet` button (top right corner).
3. Click MetaMask in the dropdown.
4. **Capture screenshot 2**: MetaMask signature popup. The message should start with `PointCast Ethereum Login` and include `Address`, `Origin`, `Issued At`, `Nonce`, and (optionally) `Chain ID` lines.
5. Sign the message.
6. Verify the corner pill shows your short address (`0x1234…abcd` shape).
7. Verify the `pc_session` cookie was set (DevTools → Application → Cookies). It should be HttpOnly, Secure, SameSite=Lax.
8. Verify on the `/mist` page itself: Identity panel updates with chain badge `Ethereum · metamask`, displays your primary ENS name as the headline (or the short address if no ENS), shows your address as a subline (when ENS resolves), and shows `0.XXXX ETH on Base` once balance fetch completes.
9. **Capture screenshot 3**: connected Identity panel with ENS + balance visible.

### C. Tezos sign-in still works

10. Disconnect MetaMask (corner menu).
11. Click `connect wallet` → Kukai. Sign the Tezos message.
12. Verify the panel updates with `Tezos · kukai` chain badge + your Tezos address.
13. **Capture screenshot 4**: Tezos-connected panel.

### D. Mobile Safari (the historical sticking point)

14. Open `/mist` on iOS Safari.
15. Tap `connect wallet`.
16. Verify Tezos / Kukai works (Beacon SDK should handle mobile fine).
17. Tap MetaMask. **Expected behavior**: if MetaMask app is installed and the deep link works, you're prompted to sign there; if not, the connect closes silently (no broken modal). MetaMask path on iOS Safari is the historical pain point — flag any error you see in the console.
18. **Capture screenshot 5**: any error or unexpected state.

### E. Failure modes worth flagging

- Anywhere the verify endpoint returns 401 / 400 / 500 — capture the network request (cookie, body, response) and the on-screen state.
- Anywhere the panel shows "resolving ENS…" or "reading Base balance…" for more than ~10 seconds — that's likely RPC throttling on the public endpoint.
- Anywhere the address-to-ENS round-trip resolves to a name that doesn't match what etherscan shows for the address.

## What I want at the end

A markdown file at `docs/manus-logs/2026-05-08-mist-qa.md` with:

- Pass/fail per acceptance item (A1, A2, B6, …)
- Five screenshots inline or linked
- Any console errors verbatim
- Browser/OS for each test (desktop Chrome, desktop Safari, iOS Safari, Android Chrome — at least three)
- A go/no-go recommendation for merging the `feat/mist-room-cc-2026-05-08` branch to main

## Approval gates

Manus does not need Mike's approval for this QA pass. **However**: do **NOT** sign any transaction beyond the personal_sign login message. The Wire Attestations contract is not yet deployed; if any "Attest on Base" button surfaces, do not click. That comes with the next ship.

## Out of scope

- Coinbase Smart Wallet (passkey login) — comes with the next PR
- The live Nouns DAO auction tile — comes with the next PR
- Wire Attestations mint flow — comes after Mike originates the contract on Base
- Outbound `View on Zora` / `Cast to Farcaster` buttons — separate PR

— cc

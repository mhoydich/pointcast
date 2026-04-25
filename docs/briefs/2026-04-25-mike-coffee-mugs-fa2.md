# Mike brief · Coffee Mugs FA2 — contract decision

**To:** Mike (MH) — owner / approver / origination signer
**From:** cc — wrote the off-chain claim flow on /coffee, ready to wire on-chain when contract lands
**Date:** 2026-04-25 ~10:50 PT
**Priority:** Medium — unblocks the income arc on /coffee
**Effort once you say go:** ~30 min cc + ~5 min Mike

---

## What this brief is

You asked at ~10:30 PT: *"do you think you can get a tezos minter going."* The honest answer is yes, but the on-chain part needs your hand. This brief lays out what's in your court so we can move quickly when you say go.

---

## State after this sprint

The /coffee page now has:

- A real **Beacon wallet connect** button in the Mintables section (reuses `WalletConnect.astro`)
- Five rarity-tiered mug cards (common · uncommon · rare · ultra-rare · legendary), with editions of 333 / 144 / 64 / 21 / 8 and unlock thresholds at 1 / 3 / 7 / 15 / 30 cups
- When wallet is connected + threshold met → the claim button activates and reads "MINT TO {tz_addr}"
- Click banks the claim **locally** — stored in `localStorage.pc:coffee:claims` with a pseudo-receipt id
- Card flips to "BANKED" state with a green chip
- All five tiers can be banked progressively as the user pours more cups

**What's NOT happening:** no on-chain operation, no real token, no real signature. The receipts are placeholder ids (`pcvm-cer-xyz`).

This is honest scaffolding. When the contract lands, the flow upgrades from `banked` → `minted` and the receipts become redeemable.

---

## Why a new contract instead of Visit Nouns

Visit Nouns FA2 (`KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`) is designed for **Nouns seeds 0–1199**. Each tokenId is a Nouns seed; the metadata is the Nouns SVG. Repurposing it for mug variants would:

- Pollute the collection (mug tokens mixed with Nouns)
- Break the `objkt.com/collection/<KT1>` page browsing experience
- Tie mug supply to Nouns supply (a hard ceiling at 1200)

Better path: a **dedicated Coffee Mugs FA2** with five tokenIds (one per variant), each with its own edition cap.

---

## Proposed contract: `coffee_mugs_fa2.py`

A standard SmartPy v0.24 multi-token FA2 with:

- **5 tokenIds** (0=ceramic, 1=espresso, 2=latte, 3=paper, 4=bistro)
- **Edition caps** per token (333 / 144 / 64 / 21 / 8 — total 570 mugs across the lifetime of the broadcast)
- **Mint entrypoint** that's **admin-restricted** (only the contract admin can mint to a recipient)
- **Eligibility check off-chain** — the PointCast frontend (Pages Function) verifies the user has poured enough cups + has a valid signed receipt, then calls `mint(recipient=user, tokenId=mug_idx)` with the contract admin signing
- **TZIP-21 metadata** pointing at `/api/tezos-metadata/{tokenId}` (already serving Visit Nouns; trivially extends)
- **Royalties:** 7.5% to Mike's main wallet (objkt resale royalty)

Total contract size: ~150 lines SmartPy. Same shape as `agent_derby_receipts.py`.

---

## What you decide (3 quick calls)

1. **Origination signer.** Two options:
   - **A.** Reuse the throwaway mainnet signer (`tz1PS4WgbYCKcKnfbfMNSH44JfrnFVhkcKp1` — same one that originated Visit Nouns). Fastest, ~30 sec, ~0.3 ꜩ. Admin transfer to your main wallet (`tz2FjJh…`) as a follow-up op.
   - **B.** Originate from your main Beacon wallet directly. Slightly more careful, key never lives on disk, ~3 min. **Recommended.**
2. **Royalty wallet.** Default = your main wallet (`tz2FjJh…`). Confirm or change.
3. **Edition caps.** I proposed 333 / 144 / 64 / 21 / 8 for the five tiers (a Fibonacci-ish curve so legendary feels legendary). Tweak if you want.

---

## What cc does once you say go

1. Write `contracts/v2/coffee_mugs_fa2.py` (~30 min, mirrors `visit_nouns_fa2.py`)
2. Compile via `node scripts/compile-coffee-mugs.mjs` (you sign + originate via `scripts/deploy-coffee-mugs-mainnet.mjs` per option A or via Beacon dashboard at `/admin/deploy` per option B)
3. Paste KT1 into `src/data/contracts.json` under `coffee_mugs.mainnet`
4. Wire `/api/coffee/claim` (already drafted in my head) to:
   - Read `coffee:cups:YYYY-MM-DD` from PC_RACE_KV to verify cumulative pours
   - Sign a TZIP-32 claim receipt with a server-side HMAC key
   - On redeem: client posts the receipt → server verifies → server calls `mint(user, tokenId)` from the admin wallet (gas paid by Mike, ~0.005 ꜩ per mint)
5. Update `/coffee` Mintables section: button transitions from `BANKED` → `MINTED` with a tzkt link to the operation
6. File a release block (likely 0364 or 0365) announcing the contract is live

Total elapsed: ~30 min cc + ~5 min Mike + ~3 origination ops.

---

## Edge cases worth naming

- **Storage cost.** Initial origination including 5 token_metadata records: ~0.45 ꜩ. Ongoing per-mint: ~0.005 ꜩ each. At 570 lifetime mugs total: ~3 ꜩ all-in. Cheap.
- **Double-claim defense.** Each (address, mugSlug) pair stores a `claimed=true` flag in KV after mint succeeds; the `/api/coffee/claim` endpoint returns 409 on retry.
- **Wallet not connected.** The current claim button reads "CONNECT WALLET" instead of disabled — opens the WalletConnect menu via the existing `pc:open-wallet-menu` event. Already wired.
- **Migration of banked claims.** When the contract lands, a one-time client-side check upgrades any `banked` localStorage entries to `pending-mint` and surfaces a "redeem now" CTA on the card. No data lost.
- **Rate limits.** /api/coffee/claim should be 5/hour/IP — same shape as the existing `coffee:pour` rate limit (60/min). Trivial to add.

---

## Open question for you

Do you want **claims to mint immediately** when the user clicks (gas paid by Mike's admin wallet) — or **batched** at midnight PT each day (one transaction per recipient, much cheaper)? Recommendation: **immediate** for the first month while volumes are tiny, batched after if it gets expensive.

---

*Ready when you are. The prose path is built; the chain part is one origination op away. — cc, 2026-04-25 ~10:50 PT*

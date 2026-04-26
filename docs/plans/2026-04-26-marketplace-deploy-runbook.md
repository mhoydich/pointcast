# PointCast Marketplace · deploy runbook

**Status:** contract source ready (`contracts/v2/marketplace.py`, multi-collection refactor merged in PR #116). UI ready (`/market` ships in PR opening alongside this doc).
**Effort:** ~5 minutes once you sit down at the IDE.
**Outcome:** PointCast-native multi-collection marketplace live on mainnet at a new KT1, `/market` flips from `pending` → `empty` → `active` on the first listing.

---

## What's pre-baked

- `contracts/v2/marketplace.py` — multi-collection FA2 marketplace, fa2_contract per-ask, all 7 tests pass in source review
- `src/data/contracts.json` — `marketplace.platformFeeBps=250` (2.5%), receivers set to your mainwallet, `supportedCollections=[coffee_mugs, visit_nouns]`
- `src/pages/market.astro` — full browse + list + buy UI, three-mode pending/empty/active driven by tzkt
- `/admin/deploy/marketplace/` — already shows DRAFT (source exists, no compiled artifacts yet)

---

## The 5 steps

### 1. Compile in SmartPy IDE (~2 min)

1. Visit `pointcast.xyz/admin/deploy/marketplace/`
2. Click **↥ Copy source** (the button next to the smartpy.io/ide link). Source is now in your clipboard.
3. Click **smartpy.io/ide ↗** in that same row — opens IDE in a new tab.
4. ⌘A in the IDE editor → ⌘V to paste the marketplace.py contents (overwrites whatever's there from your last session).
5. Click **Run**.
6. Verify all 7 tests pass — Test 1 List Ask through Test 7 Admin Fee Change. Look for green checkmarks on each `scenario.h2(...)` block.

If anything errors, screenshot it and ping me. Most likely cause is unicode (em-dash, smart quote, arrow) — the cleanup pass should have caught everything but the IDE is picky.

### 2. Download artifacts (~30s)

In the IDE, look for the build output panel (bottom or side). Find:
- `step_NNN_cont_0_contract.json` — the Marketplace contract Michelson (the FIRST origination)
- `step_NNN_cont_0_storage.json` — the Marketplace's initial storage

(There's a second origination for the test mock_fa2 — ignore those `step_NNN_cont_1_*` files.)

Either download them or copy the contents to your clipboard.

### 3. Originate via the Publisher (~2 min)

1. Visit `pointcast.xyz/admin/deploy/new/`
2. Top-right: **connect wallet** (Kukai · Beacon)
3. Network: leave on **Mainnet**
4. Paste the **michelson code** (the contract.json contents) into the first textarea
5. Paste the **initial storage** (the storage.json contents) into the second textarea
6. The page detects on the fly that the storage's first `tz` address (the admin) doesn't match your connected wallet — **the Publisher's auto-admin-patch will replace it with your mainwallet** before signing. You'll see "admin patched: tz1...→ tz2FjJh..." in the status line.
7. Verify the admin preview matches your wallet (tz2FjJh1gb9Xc2qNB7QgFkdBZkGCCRMxdFw)
8. Click **Originate &rarr;**
9. Confirm in Kukai. Cost: ~5–10 ꜩ for storage burn (the asks bigmap + entrypoint code).
10. Wait ~10s for confirmation. The page shows the new `KT1...` address with tzkt + better-call.dev links.

### 4. Wire the KT1 into contracts.json (~1 min)

```bash
# in the repo root
$EDITOR src/data/contracts.json
```

Set:
```json
"marketplace": {
  "mainnet": "KT1...whatever-was-printed",
  ...
}
```

And add a `_mainnet_notes` block matching the visit_nouns / coffee_mugs pattern:
```json
  "_mainnet_notes": {
    "originatedAt": "2026-04-26T...",
    "originator": "tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw",
    "administrator": "tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw",
    "opHash": "oo...",
    "tzkt": "https://tzkt.io/oo...",
    "note": "Originated via /admin/deploy/new (Publisher) with auto-admin-patch."
  },
```

### 5. Build + deploy (~30s)

```bash
npm run build:bare
npx wrangler pages deploy dist --project-name pointcast --branch main --commit-hash $(git rev-parse HEAD)
```

`/market` flips from `pending` to `empty · live · no listings yet`. The list-form button activates ("Sign + list"). The dashboard's "live" pile gains one entry.

---

## First listing (smoke test)

To prove the loop closes:

1. `/market` (your wallet connected)
2. Pick **Coffee Mugs**, token id `0` (your Ceramic Mug #0), price `0.5 ꜩ`, royalty `750` (7.5%)
3. Click **Sign + list**. One Kukai signature signs both `update_operators` + `list_ask` in the same batch.
4. ~10s later, the browse grid shows your ceramic mug card with "your listing · cancel via dashboard" (no buy button on your own listing — `M_NO_SELF_FULFILL`).

Test buy from a separate wallet (or just leave the listing up and someone in the wild can fulfill it).

---

## What can go wrong

- **Pre-flight admin check fails on contract calls:** the marketplace's admin entrypoints (`set_paused`, `set_platform_fee_bps`, etc.) require admin = connected wallet. The Publisher auto-patches admin to you on origination, so this should be clean. If you ever transfer admin elsewhere, the form will catch the mismatch before broadcast.
- **listing rejected with `MARKETPLACE_PAUSED`:** the contract starts unpaused. If you pause via the admin form, listings/buys block until you unpause.
- **listing rejected with `INVALID_ROYALTY_BPS`:** royalty cap is 10000 bps (100%). Above that returns this error.
- **buy rejected with `INCORRECT_AMOUNT`:** buyer sent ≠ `ask.amount_mutez`. The /market UI sends exactly the listed price; this fires only if seller updates the price between fetch and click.
- **buy rejected with `M_NO_SELF_FULFILL`:** you tried to buy your own listing. The UI hides the buy button on your own asks but the contract enforces it.

---

*Filed by cc, 2026-04-26 — accompanies the multi-collection refactor in PR #116 + the /market UI ship.*

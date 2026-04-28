# Marketplace v4 origination runbook

**Author:** cc · **Filed:** 2026-04-27 · **For:** Mike, when next at the keyboard
**Companion:** scheduled task `pointcast-v4-marketplace-watch` polls tzkt every 3h and auto-opens a draft cutover PR if it sees a new marketplace-shaped origination from your wallet — so steps 8-9 below may already be done by the time you read this.

---

## Pre-state check (30 seconds)

```
$ git fetch origin main -q
$ python3 -c "import json; d=json.load(open('src/data/contracts.json'))['marketplace']; print('mainnet:', d['mainnet']); print('version:', d.get('version', 3)); print('legacy:', d.get('_legacy_marketplace', []))"
```

You should see:
```
mainnet: KT1DoUowvD6a5TJnYMXwtR9YsjiqBKkzptc5
version: 3
legacy: []
```

If `version` is already 4 or `mainnet` is a different KT1 → the watcher already cut over, skip to step 12 (validate).

---

## The 7 steps you actually run

### 1. Open SmartPy IDE
[https://smartpy.io/ide](https://smartpy.io/ide)

### 2. Paste the v4 source
File on disk: `contracts/v2/marketplace.py` — already edited with the v4 changes:
- `royalty_receiver` is now per-ask (in the asks bigmap value record), not contract-wide
- `list_ask` takes a `royalty_receiver: sp.address` parameter
- `fulfill_ask` reads `ask.royalty_receiver` and dispatches accordingly
- The `set_royalty_receiver` admin entrypoint is removed
- Test scenarios all updated with the new param

```bash
$ pbcopy < contracts/v2/marketplace.py
```

(or open the file in your editor, copy all, paste into the IDE)

### 3. Run — verify all 7 tests pass
The IDE shows a green check on each scenario step. **All 7 must be green.** If any red, screenshot the failure and stop. Don't proceed.

### 4. Click **Deploy contract** → **Continue**
This populates the `/origination` tab with two artifacts.

### 5. Download both artifact JSON files
- `step_*_cont_0_contract.json` — the compiled Michelson code
- `step_*_cont_0_storage.json` — the initialized storage

### 6. Stage them in the repo
```bash
$ mv ~/Downloads/step_*_cont_0_contract.json public/admin/_artifacts/marketplace-contract.json
$ mv ~/Downloads/step_*_cont_0_storage.json public/admin/_artifacts/marketplace-storage.json
```

### 7. Visit `/admin/deploy/new?prefill=marketplace`
The page now shows a yellow callout (added in PR #158) walking through this exact flow. The artifact prefill loads automatically.

**Critical:** before you click **Sign**, the **layout safety check banner must show green ✓ canonical**. The banner walks the parsed Michelson and refuses to enable the Sign button if any FA2 transfer dispatch has alphabetical field order. This is the safety check that catches the v1+v2 failure. If it goes red, **do not sign** — it means SmartPy compiled the artifact with the wrong layout despite the `.layout(...)` directive.

If green: click **Sign** → Kukai pops → confirm the origination. Wait ~30 seconds. The KT1 + opHash appear at the top of the page.

---

## Post-sign: cutover (3 minutes)

### 8. Capture the v4 KT1 and opHash
From the page or from tzkt. The watcher auto-PR (if it fired before you signed) will already have these — check open PRs for `feat/marketplace-v4-cutover`.

### 9. Update `contracts.json`
If the watcher already opened a PR, just open it, mark non-draft, and merge.

If you're doing it manually:

```jsonc
"marketplace": {
  "mainnet": "KT1<NEW-V4-KT1>",
  "version": 4,
  // ... other fields ...
  "_legacy_marketplace": [
    "KT1DoUowvD6a5TJnYMXwtR9YsjiqBKkzptc5"
  ],
  "_mainnet_notes": {
    "originatedAt": "2026-04-29T<time>Z",
    "originator": "tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw",
    "administrator": "tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw",
    "opHash": "<v4-op-hash>",
    "tzkt": "https://tzkt.io/KT1<NEW-V4-KT1>",
    "note": "v4 origination — adds royalty_receiver per ask. Listed sellers pick the royalty destination at list time. v3 (KT1DoUowvD6...) moved to _legacy_marketplace; its open ask (Visit Noun #88) still browseable + cancelable on /market with a LEGACY badge."
  },
  "_legacy_marketplace_notes": [
    {
      "version": "v3",
      "address": "KT1DoUowvD6a5TJnYMXwtR9YsjiqBKkzptc5",
      "originatedAt": "2026-04-26T21:49:13Z",
      "opHash": "opG32iDS3YRPXJKpB5ZvpzWfsKcBB8qP7qaExEffDpnFNPWMmru",
      "supersededAt": "2026-04-29T<time>Z",
      "reason": "Replaced by v4 with per-ask royalty_receiver. v3 stays read-active for cancellation of any open asks."
    }
  ]
}
```

### 10. Commit + push + redeploy
```bash
$ git add src/data/contracts.json
$ git commit -m "chore(marketplace): cutover to v4 — move v3 to _legacy_marketplace"
$ git push origin HEAD:main
```

Cloudflare Pages picks it up. Build takes ~2 minutes.

### 11. The frontend lights up automatically
Already-shipped feature flags + plumbing handle it:

- **`marketplace.version: 4`** flips the royalty_receiver UI on at `/market` (PR #156). The list-token form gains a "royalty receiver" input that defaults to your configured creator wallet but is overrideable.
- **`_legacy_marketplace[0]`** populates legacy lane on `/market` (PR #146). The v3 KT1's open ask shows up with a LEGACY badge and a working cancel button.
- **`/admin/deploy/new`** callout panel for marketplace stops being relevant for v4 work (PR #158).

No frontend code change is needed for the cutover. The plumbing was staged in Day 1.

---

## 12. Validate (5 minutes)

After the deploy lands:

- [ ] `https://pointcast.xyz/market` loads, shows v4 KT1 in the about section
- [ ] If v3 had an open ask, it shows on `/market` with a `LEGACY` badge top-left of the art
- [ ] Connect your wallet, visit `/market`, click "List your token" — the **royalty receiver** input appears, prefilled with `tz2FjJhB...`
- [ ] List a tiny test token (a Visit Noun you don't mind moving) at 0.1 ꜩ to verify the new list_ask call shape works on-chain
- [ ] If it lists clean, cancel it (no need to actually sell)
- [ ] On `/market`, click **cancel** on the v3 LEGACY ask if you don't want it lingering
- [ ] tzkt shows v3 ask 0 cancelled, v4 ask 0 listed, v4 ask 0 cancelled — all clean

If any step fails:
- The frontend has graceful fallbacks: legacy KT1 errors don't break the page, just hide the legacy ask
- v4 contract failures will return clear Beacon errors — capture and roll back contracts.json if needed (set `mainnet` back to v3, `version: 3`, empty `_legacy_marketplace`)

---

## What's already done for you

By the time you sit down for this:

- ✓ v4 source edited and on disk
- ✓ `_legacy_marketplace` array exists in contracts.json (empty, ready to populate)
- ✓ `/market` reads from primary mainnet **+** every legacy address, tags ask cards with their KT1, routes buy/cancel/update to the right contract
- ✓ `/market` list form has a hidden `royalty_receiver` input that surfaces only when `version >= 4`
- ✓ `listToken()` conditionally includes `royalty_receiver` in the `list_ask` batch call when v4 is active
- ✓ `/admin/deploy/new?prefill=marketplace` shows a 7-step callout panel
- ✓ Press release at `docs/launch/2026-04-26-marketplace-press-release.md` already references v3 with the right opHash (will need a v4 update post-cutover, but that's editorial, not blocking)
- ✓ Day-1 launch posts at `docs/launch/2026-04-27-day1-posts/` reference v3 and stay accurate (v4 is an internal upgrade, not a relaunch)
- ✓ Scheduled task `pointcast-v4-marketplace-watch` running every 3h, will auto-PR the cutover diff if it sees the v4 origination from your wallet first

---

## What you need from me after the cutover

Nothing structural. A v4-celebrating block (0378 or whatever's next) and a tiny update to the press release on-chain section to reflect the new KT1. I'll handle both autonomously when the cutover lands.

— cc, 2026-04-27, El Segundo

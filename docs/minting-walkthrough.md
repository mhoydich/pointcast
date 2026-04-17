# Minting Walkthrough — Deploy PointCast Tezos Contracts

**Mike, here's the 15-minute path from compile to live on mainnet.** Each of the 3 contracts follows the same pattern. Do Visit Nouns first — it's the user-facing one.

## What you have

Three SmartPy contracts, all **compile-clean in v0.24.1** (confirmed by Claude + Manus last night):

| Contract | File | Purpose | Priority |
|---|---|---|---|
| **Visit Nouns FA2** | `contracts/v2/visit_nouns_fa2.py` | Multi-asset NFT (1200 Nouns). User mint flow. | **First** |
| **Marketplace** | `contracts/v2/marketplace.py` | objkt-style collect flow. | Second |
| **DRUM Token** | `contracts/v2/drum_token.py` | FA1.2 utility token for /drum claims. | Third (can wait for Phase C) |

Each has a `DEPLOY_NOTES*.md` sibling with error codes, init storage, and voucher/sig examples.

## The 7-step flow (per contract)

### 1. Open smartpy.io in a browser

Go to https://smartpy.io/ide. No account needed.

### 2. Paste the contract

- Open `contracts/v2/visit_nouns_fa2.py` in your editor
- Select all, copy
- In smartpy.io, clear the default example and paste

### 3. Click "Run"

Top-right green button. Takes ~5–15 seconds. You should see:
- Green checkmarks next to test scenarios
- "Compiled" banner
- No red errors (deprecation warnings from `fa2_lib` internals are fine — they're Manus-confirmed safe to ignore)

### 4. Download the compiled artifacts

In the right panel after compile:
- Click the **"Compiled"** tab
- Scroll to find **`contract.json`** → click to expand → **Copy** the full JSON array
- Scroll to find **`storage.json`** (or the initial-storage Michelson value) → **Copy** that JSON too

Keep both on your clipboard OR save them to `/tmp/visit-nouns-contract.json` + `/tmp/visit-nouns-storage.json` for safety.

### 5. Open `/admin/deploy`

- Go to https://pointcast.xyz/admin/deploy
  - If you've set `ADMIN_TOKEN` in Cloudflare Pages: visit `?k=<token>` once to set the cookie, then drop the `?k=`.
  - If not set yet: admin routes stay open (fine for initial deploy; lock down with `ADMIN_TOKEN` before anything else goes public).

### 6. Fill the form

- **Network:** Select **Shadownet** for a dry-run first (free tz from the faucet). Once that works, repeat with **Mainnet**.
- **Michelson code:** Paste the contract.json array into the first textarea.
- **Initial storage:** Paste the storage Michelson-JSON value into the second textarea.
- Stats counters should light up showing the byte sizes (sanity check — if they say 0, the paste didn't take).

### 7. Click **Deploy** and sign with Kukai

- Make sure **WalletConnect** shows your Kukai wallet connected (top-right of the page).
- Click **Deploy**. Kukai popup appears requesting an origination signature.
- Review fee (should be a few cents tz on Shadownet, ~0.5–1 tz on Mainnet) and approve.
- Origination lands on-chain in ~30 seconds.
- The page prints the new **`KT1…`** address + explorer link.

---

## After deploy — wire the address into PointCast

1. Copy the `KT1…` address from the deploy page.
2. Open `src/data/contracts.json`.
3. Add:
   ```json
   {
     "visit_nouns_fa2": "KT1...",
     "marketplace": "KT1...",
     "drum_token": "KT1..."
   }
   ```
4. For Visit Nouns specifically — call `set_metadata_base_cid(cid)` ONCE to light up all 1200 Nouns' metadata (requires uploading the metadata directory to Pinata first; run `node scripts/upload-nouns-ipfs.mjs` after `export PINATA_JWT=...`).
5. `npx astro build && npx wrangler pages deploy dist --project-name pointcast --commit-dirty=true`

---

## If something breaks

**smartpy.io shows red errors →** Re-check you pasted the ENTIRE file. The contract starts with a big comment header and ends with test scenarios — both halves are required.

**Kukai doesn't pop up →** WalletConnect at the top right isn't connected. Click it, pick Kukai, authorize.

**"M_NO_SELF_FULFILL" or similar on Marketplace →** This is intentional invariant protection; it means the signer is trying to fulfill their own listing. Use a second wallet to test collect flow.

**Shadownet origination fails with "balance_too_low" →** Visit https://faucet.shadownet.teztnets.com to grab free test ꜩ, then retry.

**Mainnet origination fails →** Double-check your wallet has at least 2 tz for fees. If Kukai reports "counter already used", wait 60 seconds and retry (mempool flush).

---

## Recommended order today

1. **Shadownet dry-run Visit Nouns** (5 min) — proves the pipeline works end-to-end without spending real ꜩ.
2. **Mainnet Visit Nouns** (3 min) — once the Shadownet address shows up in your wallet history, you're good to ship for real. Save that `KT1…`.
3. **Upload Nouns metadata to Pinata** (varies — depends on upload speed + your internet). Then `set_metadata_base_cid`.
4. **Mainnet Marketplace** (3 min) — same flow, different contract file. Save the `KT1…`.
5. **Skip DRUM token** for now unless you want to ship the claim flow today.
6. **Update `src/data/contracts.json`** with both `KT1…` addresses + deploy the site.
7. **Test mint** on pointcast.xyz from a second wallet (since the deployer wallet hits M_NO_SELF_FULFILL on marketplace).

After that, shout when you want to tackle the Frame → Mini App migration (Manus is working on the spec right now, task `ifdbkV2QoaW7PXHoTNrgB9`).

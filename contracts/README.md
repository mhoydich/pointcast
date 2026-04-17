# PointCast Contracts

Phase A of the "host our own marketplace" roadmap. This directory holds
the SmartPy sources, compiled Michelson artifacts (after you build), and
deployment configs for PointCast's Tezos contracts.

```
contracts/
├── README.md                     — you are here
├── visit_nouns_fa2.py            — FA2 multi-asset for Visit Nouns (Phase A) [WRITTEN]
├── marketplace.py                — asks/fulfill_ask/cancel/update (Phase B) [WRITTEN]
├── drum_token.py                 — DRUM FA1.2 + claim flow (Phase C) [TBD]
├── build/                        — compiled Michelson + storage (created by compile step)
│   ├── visit_nouns_fa2.json      — Taquito-friendly JSON Michelson
│   ├── visit_nouns_fa2_storage.json
│   ├── marketplace.json
│   ├── marketplace_storage.json
│   └── ipfs-cids.json            — written by upload-nouns-ipfs.mjs
```

**Current phases:**

### Phase A — Visit Nouns FA2 mint

- [x] Contract source (`visit_nouns_fa2.py`)
- [x] IPFS metadata upload script
- [x] Browser-based deploy page (`/admin/deploy`)
- [x] Frontend mint buttons pre-wired to `src/data/contracts.json`
- [ ] Compile contract → Michelson (smartpy.io web IDE, 5 min)
- [ ] Pin metadata to IPFS (Pinata, 3 min)
- [ ] Deploy to Ghostnet · test mint
- [ ] Deploy to Mainnet (~5 ꜩ from your 200)
- [ ] Paste KT1 into `contracts.json` + redeploy → mint buttons auto-activate

### Phase B — PointCast Marketplace (primary sales)

- [x] Contract source (`marketplace.py`) — list_ask / fulfill_ask /
      cancel_ask / update_ask / admin (pause, fee, treasury)
- [x] 2% default platform fee (settable, capped at 10%)
- [x] Royalty-aware — each ask carries per-token royalty_bps + receiver
- [x] Pause toggle + admin rotation + self-fulfill block
- [ ] Compile via smartpy.io (same flow as Phase A)
- [ ] Deploy via `/admin/deploy` (Ghostnet then Mainnet)
- [ ] Paste KT1 into `contracts.json` under `marketplace`
- [ ] Frontend: list-a-token admin UI (new page `/admin/list`)
- [ ] Frontend: `/collect/[tokenId]` swaps objkt fulfill for our marketplace
- [ ] Indexer: pull active asks from marketplace → cache to `src/data/market.json`
      (replaces `scripts/fetch-market.mjs` objkt-GraphQL dependency)

### Phase C — DRUM token + drum-room claim

- [x] Contract source `drum_token.py` — FA1.2 fungible with:
      • standard transfer/approve/getBalance/getAllowance/getTotalSupply
      • `claim(recipient, amount, nonce, expiry, signature)` voucher entrypoint
      • `admin_mint` / `admin_burn` / `set_signer` / `set_paused`
      • Voucher replay protection via `used_nonces` big_map
      • Wrong-recipient anti-spoof (sender must be voucher recipient)
      • Expiry check + signature verification via on-chain `check_signature`
- [x] Full test suite covering: admin mint, voucher claim, replay
      rejection, wrong-recipient rejection, expired voucher rejection,
      transfer, pause
- [ ] Generate signer keypair: `npx @taquito/signer generate`
- [ ] Store private key as Cloudflare secret:
      `npx wrangler pages secret put DRUM_SIGNER_KEY`
- [ ] Write `functions/api/drum/claim.ts` — POST `{recipient, sessionId}`,
      server looks up drum count, computes claimable, signs voucher,
      returns `{recipient, amount, nonce, expiry, signature}`
- [ ] Compile drum_token.py via smartpy.io
- [ ] Deploy via `/admin/deploy` with init storage containing signer_pubkey
- [ ] Paste KT1 + signer_pubkey into `src/data/contracts.json`
- [ ] Wire "Claim DRUM" button on `/drum` + DrumModule to fetch voucher +
      submit to contract
- [x] Rate: 1 DRUM per 100 drums (configurable server-side)
- [ ] Daily cap: TBD (recommended 100 DRUM/session/day to bound abuse)

### Drum Room UI (/drum)

- [x] 3-drum rack (low / mid / high pitches, each with own noun avatar)
- [x] Per-drum pitched synth (70 Hz / 110 Hz / 170 Hz)
- [x] Keyboard: `1/2/3` or `A/S/D` or Space (= mid drum)
- [x] Tap timeline: 16 dots, color-coded per drum, height = combo level
- [x] Jam detection: `JAM · N` badge when 3+ unique drummers in 2s window
- [x] Combo multiplier + BPM + milestone progress + active-drummer count
- [x] Haptic feedback on mobile
- [x] AudioContext priming on first any-interaction
- [x] Remote drum ripples with decoded drum-index + combo from broadcast seed

---

## TL;DR runbook

You'll do four things once, in order:

1. **Compile** the contract (smartpy.io, browser, free).
2. **Pin metadata** (Pinata free tier, needs a JWT).
3. **Deploy to Ghostnet first** (testnet, free ꜩ from faucet — dry-run).
4. **Deploy to Mainnet** (you sign once with Kukai, ~5-10 ꜩ).

Step-by-step below.

---

## 1. Compile the contract

We don't require a local SmartPy install. Use their web IDE — it builds
to Michelson in the browser.

1. Open https://smartpy.io/ide
2. Click **New Contract** (top-left), delete the template code.
3. Paste the contents of `contracts/visit_nouns_fa2.py`.
4. Click **Run** (the play icon, top-right).
5. The test at the bottom of the file runs. You should see:
   - Alice mints Noun #137 → `ledger[alice, 137] = 1`
   - Bob also mints #137 (open editions) → `supply[137] = 2`
   - Out-of-range mint fails (expected)
   - Price change works, underpay is rejected (expected)
6. Click **Deploy Michelson Contract** (bottom-left panel).
7. In the dialog, click **Download**. You'll get a zip with files like:
   - `step_000_cont_0_contract.json` ← Michelson code
   - `step_000_cont_0_storage.json` ← Initial storage
8. Save both into `contracts/build/`:
   - Rename `*_contract.json` → `visit_nouns_fa2.json`
   - Rename `*_storage.json` → `visit_nouns_fa2_storage.json`

> **Heads-up — the compile snapshot captures the storage values from the
> test run (admin = test "admin" account, base CID = stub).** Before
> deploying for real, edit `visit_nouns_fa2_storage.json` and replace:
>
> - `admin` → your tz2 address (`tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`)
> - `metadata_base_cid` → the real CID (you'll get it in step 2)
>
> You can also pass a live admin + CID to SmartPy at compile time by
> editing the test's `main.VisitNouns(...)` arguments to the production
> values, re-running, and re-downloading.

---

## 2. Pin metadata to IPFS

Gives us the `metadata_base_cid` that each token's `ipfs://.../{nounId}.json`
URI will resolve against.

### One-time: get a Pinata JWT

1. Sign up at https://app.pinata.cloud (free tier: 1 GB, plenty).
2. **API Keys** → **New Key** → pick **JWT** (not API key + secret pair).
3. Copy the JWT. You'll paste it into an env var.

### Run the upload script

```bash
export PINATA_JWT="eyJhbGciOiJIUzI1NiIs..."
node scripts/upload-nouns-ipfs.mjs
```

What it does:

- Builds 1200 TZIP-12/TZIP-21 metadata JSONs (one per Noun ID 0..1199).
- Each JSON points `displayUri` → `https://noun.pics/{n}.svg` (CC0 images,
  stable CDN, no upload needed).
- Pins the whole directory to Pinata → returns a single CID.
- Also pins a TZIP-16 contract-level metadata JSON → returns another CID.
- Writes both CIDs to `contracts/build/ipfs-cids.json`.

Expected output:

```
✓ Pinata authenticated
Building 1200 metadata JSONs...
  total size: 850 KB
Pinning 1200 metadata JSONs as a directory...
✓ metadata dir CID: bafybeigdyr...
✓ contract metadata CID: bafybeibsgf...

Next steps:
  1. Originate the FA2 contract with contract metadata URI = ipfs://bafybeibsgf...
  2. After origination, call set_metadata_base_cid("bafybeigdyr...") from your admin wallet.
  3. Test: https://ipfs.io/ipfs/bafybeigdyr.../137.json should return PointCast Noun #137.
```

### (Optional) `--with-svgs` for full on-IPFS art

By default, metadata references `https://noun.pics/{n}.svg` for the image.
To also pin all 1200 Noun SVGs onto IPFS and rewrite `displayUri` to
`ipfs://…`, run:

```bash
node scripts/upload-nouns-ipfs.mjs --with-svgs
```

This takes a few minutes (fetches 1200 files from noun.pics, uploads them
to Pinata). Result is fully decentralized: no runtime dependency on
noun.pics. For MVP, the default is fine — we can always re-run with
`--with-svgs` later and `set_metadata_base_cid` to the new CID.

### `--dry-run` to inspect before uploading

```bash
node scripts/upload-nouns-ipfs.mjs --dry-run
```

Writes all JSONs to `out/nouns-metadata/` locally so you can review.

---

## 3. Deploy to Ghostnet (testnet) first

Ghostnet is a free Tezos testnet. Lets you test the whole flow with fake
ꜩ before spending real money.

### Faucet some test ꜩ

- Visit https://faucet.ghostnet.teztnets.com
- Paste your Kukai wallet address → claim 100 testnet ꜩ.
- **Use a fresh Kukai account for testnet** — don't faucet against your
  mainnet wallet. In Kukai: **Settings → Switch account → New account**.

### Deploy the contract

1. On the dev server (`npm run dev`) or deployed site, visit `/admin/deploy`.
2. Connect your Kukai wallet (the **testnet** account).
3. Pick **Ghostnet**.
4. Paste contents of `contracts/build/visit_nouns_fa2.json` into the
   **Michelson code** box.
5. Paste contents of `contracts/build/visit_nouns_fa2_storage.json` into
   the **Initial storage** box.
6. Click **Review & Deploy →**. Kukai pops up → review → sign.
7. 10-20 seconds later, the page shows `KT1…` + a tzkt link.

### Test the mint

Visit the `KT1…` on https://ghostnet.tzkt.io. Under **Entrypoints** →
`mint_noun` → call it with `noun_id = 137`, amount = 0 ꜩ. Sign, wait for
confirmation, then check:

- **Storage** tab: `ledger` should contain your address mapped to `137 → 1`.
- `supply[137] = 1`
- **Tokens** tab: your account should own 1 of token 137.
- https://ghostnet.objkt.com/users/<your-testnet-address> — your Noun
  should appear here within a minute.

If the image doesn't resolve, your `metadata_base_cid` setup may have an
off-by-one. Test directly: `https://ipfs.io/ipfs/<cid>/137.json` should
return the metadata for Noun #137.

---

## 4. Deploy to Mainnet

Once Ghostnet is clean, flip the switch:

1. Switch Kukai to your **mainnet** account (fund with ~15-20 ꜩ: ~10 for
   origination, a few for `set_metadata_base_cid`, plus buffer for early
   mints if you want to pre-mint).
2. Visit `/admin/deploy`, pick **Mainnet**, paste the same two artifacts.
3. Sign. Done.

### Post-deploy admin calls

The compiled snapshot starts with a stub `metadata_base_cid`. Right after
deploy, call `set_metadata_base_cid("bafybeigdyr...")` — use
https://better-call.dev to call it directly, or we can wire a little
admin panel next.

Also consider:

- `set_mint_price(0)` — default is 0 (gas-only). If you want to charge,
  pass mutez (1 ꜩ = 1_000_000 mutez).
- `set_royalty_bps(1000)` — already 1000 (10%) by default. Only call if
  you want to change.
- `set_max_noun_id(1199)` — default 1199. Only call if noun.pics grows.

### Save the contract address

After mainnet origination, write the address to a new file so the
frontend can reference it:

```
src/data/contracts.json
```

```json
{
  "visit_nouns": {
    "mainnet": "KT1...your-address-here",
    "ghostnet": "KT1...testnet-address"
  }
}
```

The mint buttons (Noun modal, weather moment, top-right Noun) will read
this file — see next phase.

---

## Next phases

- **Wire frontend mint buttons** to call `mint_noun(nounId)` via Taquito.
  Replaces the current `/collect` redirect on the three existing CTAs.
- **Marketplace contract** (Phase B) — `list_ask` / `fulfill_ask` /
  `cancel_ask` entrypoints. Replaces objkt's marketplace for primary sales.
- **DRUM token** (Phase C) — FA1.2 fungible, claim-with-signature flow
  gated by drum-room clicks.

Once Phase A is mainnet-live, ping me and we'll pick up Phase B.

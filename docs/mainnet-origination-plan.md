# Mainnet origination plan — Visit Nouns FA2

**Context:** Shadownet origination succeeded end-to-end today (`KT1S8BbKPzWjTRQgnc986Az8A187V886UtK5`, op `ooh64H3CrpsqeKTP5DLR5KuZ2p4atQGtJPENyMcuBQ5qSnsdi6m`). First mint confirmed. Pipeline proven.

Next: re-run on Tezos Mainnet so tokens land in Mike's real `mhoydich` objkt account.

## Two paths, pick one

### Path A — Kukai via `/admin/deploy` (recommended)

Mainnet Kukai at `wallet.kukai.app` (NOT the shadownet subdomain that bit us today) is the battle-tested path. Beacon SDK knows mainnet natively, no TLD-config weirdness, no ABORTED_ERROR quirks.

**Do this:**

1. On the `main` branch, open `pointcast.xyz/admin/deploy`
2. Pick **Mainnet** network
3. Click **↺ Load Visit Nouns FA2 (pre-staged)** — the button Mike wired today
4. The `_artifacts/visit-nouns-storage.json` admin is `tz2FjJhB...MxdFw` (Mike's original address). If Mike's current mainnet Kukai wallet is different, edit the first `string` field in the storage textarea to that address.
5. Click **Review & Deploy**
6. Beacon picker → Kukai → Use Browser → Connect in Kukai → Sign origination
7. KT1 prints on the result panel

**Why this works now when Shadownet didn't:**
- Mainnet Kukai has `tlds configuration for network mainnet` (the error we saw today was Shadownet-specific)
- Mainnet Kukai simulator accepts the origination with default fee/gas (no need for the `storageLimit: 60000` workaround — mainnet hits the same limit but the wallet surfaces a clean error if it fails)

### Path B — Taquito + InMemorySigner with Mike's mainnet key

**Skip this.** Requires Mike's real mainnet secret key on disk — too risky. Only consider if Kukai flakes again.

## Cost estimate

- **Storage burn**: 60,000 bytes × 250 mutez = 15 ꜩ max (probably lands closer to 8-10 ꜩ)
- **Tx fee**: ~0.5-1 ꜩ
- **Total**: fund wallet with **25 ꜩ** for comfortable headroom

## Post-origination checklist

Once the mainnet `KT1…` is live:

1. **Wire into `src/data/contracts.json`:**
   ```json
   "visit_nouns": { "mainnet": "KT1<NEW>", "shadownet": "KT1S8B…UtK5", ... }
   ```

2. **Update every Block JSON with an `edition.contract` field** — swap Shadownet KT1 → Mainnet KT1. Affected in seed set: `0209.json`, `0210.json`.

3. **Upload Nouns metadata to Pinata**:
   ```bash
   export PINATA_JWT=...
   node scripts/upload-nouns-ipfs.mjs
   ```

4. **Call `set_metadata_base_cid(cid)`** once, with the Pinata CID. This lights up all 1200 Nouns' tokenUri.

5. **First real mint**: use `scripts/mint-first-noun-shadownet.mjs` as a template — copy to `mint-first-noun-mainnet.mjs`, swap RPC + signer, call `mint_noun(0)` or whatever first tokenId is desired.

6. **Verify on objkt**: `https://objkt.com/profile/{your-tz}/` should show the newly minted token within a few blocks.

## Who does what

- **CC** — prepare the Block JSON updates, pre-write the `contracts.json` diff
- **M** — run the UI flow in `/admin/deploy`, log screenshots, verify on tzkt
- **MH** — approve the mainnet deploy before clicking sign, answer which mainnet wallet receives admin rights
- **X** — optional: final review of storage JSON before sign (belt-and-braces)

## Rollback

Originated Tezos contracts are immutable. If the mainnet contract has a bug post-deploy, the only fix is originate a new one and point the site at it. The `set_administrator` entrypoint lets us transfer admin if the wrong admin address gets baked in — but the contract itself is permanent.

Before sign: Mike approves. Before approve: test the same storage JSON against Shadownet one more time as a dry-run.

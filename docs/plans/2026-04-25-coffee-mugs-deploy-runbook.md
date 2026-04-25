# Coffee Mugs FA2 — deploy runbook

**Filed:** 2026-04-25 ~11:30 PT (Sprint v4 follow-on)
**Owner:** Mike (executes) · cc (wrote contract + runbook)
**Status:** Contract source filed at `contracts/v2/coffee_mugs_fa2.py`. Awaiting Mike's compile + originate signal.
**Cost:** ~0.45 ꜩ origination + ~0.04 ꜩ register_tokens. Mike funds.
**Brief context:** [`docs/briefs/2026-04-25-mike-coffee-mugs-fa2.md`](../briefs/2026-04-25-mike-coffee-mugs-fa2.md)

---

## Summary of what's already in the repo

- **Contract source:** `contracts/v2/coffee_mugs_fa2.py` — SmartPy v0.24, mirrors visit_nouns_fa2.py
- **Storage placeholder:** `src/data/contracts.json` → `coffee_mugs.mainnet = ""` (paste KT1 here when done)
- **Frontend wiring:** `/coffee` page already shows `banked` state for claims; once `coffee_mugs.mainnet` is populated, an upgrade flow lights up
- **Test scenario:** included in the contract file — `sp.add_test()` block exercises register + mint + cap enforcement

## Defaults baked in (per the brief, no overrides given)

| Param | Value | Notes |
|---|---|---|
| Royalty | 750 bps (7.5%) | To Mike's main wallet |
| Royalty wallet | `tz2FjJh…XdFw` (your main) | Default; the contract administrator address gets the royalties |
| Edition caps | 333 / 144 / 64 / 21 / 8 | Fibonacci-ish ladder; legendary is rare for real |
| Mint price | 0 ꜩ (gas-only) | Free claim; gas paid by the user when they mint |
| Origination signer | **Option B: your Beacon wallet** | Recommended in the brief — admin lands on your main wallet, no throwaway hop |

If you want to override anything (caps, royalty, signer), say so before running and cc will adjust.

---

## Step 1 · Compile

Two paths — pick one:

### Path A · SmartPy.io (browser, no local install)

1. Go to https://smartpy.io/ide
2. Open File → New
3. Paste the entire content of `contracts/v2/coffee_mugs_fa2.py`
4. Click **Run** to compile + execute the test scenario
5. After the green tests pass, click **Deploy contract** in the bottom panel
6. The IDE generates `step_002_cont_0_contract.json` (Michelson) and `step_002_cont_0_storage.json` (initial storage). Download both.
7. Save them locally as:
   ```
   /tmp/pointcast-coffee-mugs-contract.json
   /tmp/pointcast-coffee-mugs-storage.json
   ```

### Path B · Local CLI

```sh
# Requires SmartPy installed locally (one-time setup)
pip install smartpy
smartpy compile contracts/v2/coffee_mugs_fa2.py /tmp/coffee-mugs-build/
# Outputs the same two JSON files into /tmp/coffee-mugs-build/
cp /tmp/coffee-mugs-build/step_002_cont_0_contract.json /tmp/pointcast-coffee-mugs-contract.json
cp /tmp/coffee-mugs-build/step_002_cont_0_storage.json /tmp/pointcast-coffee-mugs-storage.json
```

## Step 2 · Originate

### Option B (recommended) · Originate from your Beacon wallet via /admin/deploy

1. Visit https://pointcast.xyz/admin/deploy (the existing deploy UI used for Visit Nouns)
2. Click **Connect Wallet** if not already connected — Kukai prompts
3. The page reads `/tmp/pointcast-coffee-mugs-contract.json` + `…-storage.json` if they're at the conventional path
4. Confirm the storage shows administrator = your main wallet
5. Click **Originate** — Beacon prompts you to sign
6. Wait ~30 seconds for the operation to be included
7. Copy the returned KT1 address

### Option A (fallback) · Throwaway signer

Mirror of `scripts/deploy-visit-nouns-mainnet.mjs`. cc will write `scripts/deploy-coffee-mugs-mainnet.mjs` if you pick this path — say the word.

## Step 3 · Register the 5 tokens

The contract origination leaves token_metadata empty. One admin call registers all 5 mug names with their metadata URIs and royalties:

```sh
node scripts/register-coffee-mugs.mjs
```

(cc will write this small script — it makes one `register_tokens(...)` call against the new KT1 with the 5 names.)

The call sends a `sp.map[sp.nat, sp.string]` of token_id → name. Idempotent — second call rejects.

## Step 4 · Paste KT1 into the repo

```diff
  "coffee_mugs": {
-   "mainnet": "",
+   "mainnet": "KT1XXXXXXXXXXXXXXXXXXXXXXXX",
```

Update `src/data/contracts.json` and commit. Build + deploy.

## Step 5 · Wire the claim flow

cc writes (in the same PR or a follow-up):
- `functions/api/coffee/claim.ts` — POST endpoint that verifies eligibility from KV and returns a server-signed receipt
- Frontend redeem flow upgrade: `BANKED` → `pending-mint` → user signs the on-chain mint via Beacon → `MINTED` with tzkt link

This part is gated on the KT1 being live. Once it is, ~30 min cc work and the loop closes.

## Step 6 · Smoke test

After the claim flow ships:
1. Visit /coffee on a fresh browser
2. Pour 1 cup → ceramic mug becomes eligible
3. Connect Kukai with a test wallet
4. Click "MINT TO tz1…" → Kukai prompts you to sign + pay gas (~0.005 ꜩ)
5. Operation includes after ~30s
6. Refresh /coffee → ceramic chip says "MINTED" with the tzkt link
7. Visit `https://objkt.com/collection/<KT1>` → see the new edition appear

## Rollback

If something goes wrong post-origination:
- The contract is permanent (Tezos contracts are immutable)
- Worst case: a wrong storage value (royalty wrong, cap wrong) — the contract still works, but
  - Royalty: cannot change post-origination (it's per-token-info, baked at register_tokens)
  - Caps: cannot change post-origination (storage field but no setter — by design)
- Mitigation: compile carefully, run the test scenario, eyeball the storage JSON before signing
- If Mike wants a different shape post-deploy, originate v2 + deprecate v1 (ledger entries from v1 stay forever, just the new mints go to v2)

## Open questions for Mike (if any apply)

1. **Edition caps** — happy with 333/144/64/21/8? Anything you'd push or shrink?
2. **Royalty** — 7.5% to your main wallet?
3. **Mint price** — defaulting to 0 ꜩ (free, gas-only). Want to set a small price (e.g. 0.5 ꜩ to bistro for legendary)?
4. **Signer path** — Option B (Beacon) recommended; Option A (throwaway) faster.
5. **Token names** — "Ceramic Mug / Espresso Cup / Latte Glass / Paper Cup / Bistro Cup" — happy?

---

*Filed by cc, 2026-04-25 ~11:30 PT. Ready when Mike is.*

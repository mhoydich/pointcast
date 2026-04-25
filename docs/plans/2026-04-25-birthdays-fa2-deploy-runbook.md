# Birthdays FA2 — deploy runbook

**Filed:** 2026-04-25 PT
**Author:** cc
**Source:** Mike chat 2026-04-25 ~3:55pm PT — *"ok try and lets set up minting"*. Mirrors the coffee-mugs runbook (docs/plans/2026-04-25-coffee-mugs-deploy-runbook.md).
**Audience:** Mike (signs origination + register_birthday calls) + cc (post-deploy wiring).

---

## What this contract is

Open-edition multi-token FA2 for PointCast birthday cards. One token_id per BIRTHDAY block (token_id = block ID as integer; block 0366 → token 366). Free, gas-only mint. One claim per wallet per token_id. No edition cap. No royalties.

Source: [`contracts/v2/birthdays_fa2.py`](../../contracts/v2/birthdays_fa2.py) — 305 lines SmartPy, mirrors `coffee_mugs_fa2.py` structure.

Spec: [`docs/briefs/2026-04-25-cake-room-bdy-channel.md`](../briefs/2026-04-25-cake-room-bdy-channel.md) §v1.

---

## Pre-deploy checklist

- [ ] Visit Nouns FA2 contract is live (it is — `KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`); confirms the FA2 lib + admin pattern works
- [ ] Mike's main mainnet wallet has ~1 ꜩ for origination + the first `register_birthday` op
- [ ] `contracts/v2/birthdays_fa2.py` test scenario passes in SmartPy IDE (8 cases — origination, register, mint, dedup, payment-rejection, idempotent register, view checks)
- [ ] `src/data/contracts.json` has the `birthdays` slot (it does — empty KT1 keeps the mint button in "pending" mode)

---

## Step 1 — compile the contract (~5 min)

**Option A — SmartPy IDE (preferred)**

1. Open https://smartpy.io/ide
2. Paste the entire content of `contracts/v2/birthdays_fa2.py`
3. Click **Run** — confirm test scenario passes (all 8 sections green)
4. Click the **Deploy contracts** button on the test scenario panel
5. Select the originated test contract → **Compile** → download `step_001_cont_0_contract.tz` (Michelson code) + `step_001_cont_0_storage.tz` (storage)

**Option B — local CLI**

```sh
node scripts/compile-birthdays.mjs    # mirror of compile-coffee-mugs.mjs (CC writes if needed)
# outputs to /tmp/birthdays_fa2.{contract.tz,storage.tz,contract.json,storage.json}
```

Either path produces:
- **contract.tz** (or .json) — Michelson code, ~340KB
- **storage.tz** (or .json) — initial storage, ~200B

---

## Step 2 — originate via /admin/deploy (~3 min, ~0.5 ꜩ)

The browser-based originator at [`pointcast.xyz/admin/deploy`](https://pointcast.xyz/admin/deploy) accepts both Michelson-JSON and Michelson-text formats since #90.

1. Navigate to `/admin/deploy`
2. Connect Beacon wallet (Mike's main mainnet wallet)
3. Network: **Mainnet**
4. Paste the Michelson code into the **michelson code** textarea
5. Paste the storage. **Storage init values:**
   - `administrator` = Mike's main mainnet wallet (`tz1...`)
   - `metadata` = `sp.scenario_utils.metadata_of_url("https://pointcast.xyz/api/tezos-metadata/birthdays.json")` — produces a small `(Pair {Elt "" 0x...}` map
   - `metadata_base_uri` = `"https://pointcast.xyz/api/tezos-metadata/birthdays"`
   - `birthdays`, `bday_supply`, `claimed`, `ledger`, `token_metadata`, `supply` = empty big_maps
   - `next_token_id` = `0`
6. Click **Deploy** → Beacon prompts → sign
7. Wait for confirmation (~30s)
8. Copy the new `KT1...` address

---

## Step 3 — paste KT1 into the registry (~1 min)

```sh
# In src/data/contracts.json, set:
"birthdays": {
  "mainnet": "KT1...",          # ← paste here
  ...
}
```

Commit as a separate PR (or part of the post-deploy ship):
```
chore(birthdays): paste KT1 — birthdays_fa2 originated at <opHash>
```

---

## Step 4 — register Morgan's card (token_id 366) (~30s, ~0.05 ꜩ)

This is the very first `register_birthday` call. From the connected wallet at `/admin/deploy` (or via a one-off SmartPy CLI op):

```python
# Direct call shape (Beacon-friendly)
contract.register_birthday(
    sp.record(
        token_id=366,
        recipient_slug="morgan",
        recipient_name="Morgan",
        block_id="0366",
        noun_id=888,
        birthday_year=2026,
    )
)
```

Or via Taquito in a quick browser console snippet:
```js
const c = await tezos.wallet.at('KT1...');
const op = await c.methods.register_birthday(
  366, "morgan", "Morgan", "0366", 888, 2026
).send();  // adjust positional vs object based on Taquito's parameter mapping
await op.confirmation();
```

After this lands, verify on TzKT:
- Token 366 appears in `tokens` storage with the expected metadata
- `bday_supply[366]` = 0
- `birthdays[366].recipient_slug` = "morgan"

---

## Step 5 — verify metadata endpoint resolves (~30s)

```sh
curl https://pointcast.xyz/api/tezos-metadata/birthdays/366.json | jq
```

Expected:
- `name` = "Happy birthday, Morgan · 2026"
- `symbol` = "PCBDAY"
- `displayUri` = "https://noun.pics/888.svg"
- `attributes` includes `recipient: Morgan`, `permanent_noun: 888`, `block_id: 0366`
- `externalUri` = "https://pointcast.xyz/b/0366"

If the function 404s, the block JSON at `/b/0366.json` isn't reachable — check `npm run build` output.

---

## Step 6 — smoke test the mint flow (~2 min, ~0.005 ꜩ from a test wallet)

1. Navigate to `https://pointcast.xyz/b/0366`
2. Confirm the coral mint strip now shows **"Mint this card · free →"** (not the "MINT COMING SOON" pending note)
3. Click the button
4. Beacon prompts → sign with a test wallet (NOT Mike's admin wallet — verify the public mint path)
5. Wait for confirmation
6. Status flips to "Minted ✓" with a tzkt.io op link
7. On objkt: search for the contract `KT1...` — Morgan's token #366 should appear with the proper image (Noun 888) + metadata

**Edge cases to verify:**
- Click again from same wallet → should revert with `ALREADY_CLAIMED` (one per wallet)
- Try with XTZ attached (Beacon dev tool) → should revert with `NO_PAYMENT_ACCEPTED`

---

## Step 7 — announce (~5 min)

Block 0367 (release note) is pre-staged in the repo announcing the contract + the Morgan card mint. Verify it links to:
- The KT1 address
- The first tzkt.io op
- The objkt collection page
- `/b/0366` (where the button now works)

Ship.

---

## Rollback notes

If origination succeeds but `register_birthday` for Morgan fails or has a bug:
- Contract is on-chain forever, but **token 366 is unregistered** (no metadata, no mint, no harm)
- Re-call `register_birthday(366, ...)` with corrected params
- The `ALREADY_REGISTERED` guard means the first valid call wins — if the first call wrote bad metadata, you'd need to redeploy a v1.1 contract (token_id 366 is locked once written)

If a buggy mint happens (e.g. someone exploits a flaw):
- `WithdrawMutez` mixin lets admin withdraw any XTZ stuck in the contract
- Admin can transfer admin to a new wallet via `set_administrator`
- For a hard reset, redeploy as v1.1 — block-ID conventions stay (just point `contracts.json` at the new KT1)

---

## Open questions

1. **First-claim reservation for Morgan** — the brief says "social agreement, no on-chain reservation" for v1. Confirm: do you want Morgan's wallet to claim token 366 first, or is the first-mint-wins semantic fine? cc recommends first-mint-wins; whoever shows up first owns "edition #1" socially.
2. **Should the script for `register_birthday` be a Cloudflare Function admin endpoint** so cc/codex can trigger it programmatically when a new BIRTHDAY block ships? Or stays Mike-signed? cc recommends Mike-signed for v1 (low frequency — handful of birthdays in the first year). Automate later if cadence exceeds ~weekly.
3. **objkt collection page customization** — once 5+ tokens are minted, the collection page becomes a real surface. Want to set custom collection metadata (cover image, description) via objkt's UI? It's a separate manual step.

---

— cc, runbook filed alongside the contract source, 2026-04-25

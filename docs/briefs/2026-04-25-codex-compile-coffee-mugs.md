# Codex brief · compile + originate Coffee Mugs FA2

**To:** Codex
**From:** cc — wrote the contract + scripts + frontend, hit a SmartPy install wall on Mike's machine (Python 3.9, no brew, no docker)
**Date:** 2026-04-25 ~11:30 PT
**Priority:** Medium — visitor-acquisition arc is shipped; this is the income-arc unlock
**Effort:** ~15 min for compile path (option A), ~30 min for full originate path (option B)
**Mike approval:** option A is pre-approved (Mike said *"lets try to have codex do it"* at ~11:25 PT). Option B requires either (i) Codex has a funded throwaway mainnet signer ready, or (ii) Mike funds the new throwaway and you signal him before the broadcast op.

---

## Context — everything that's already in the repo

| Thing | Path |
|---|---|
| **Contract source** | [`contracts/v2/coffee_mugs_fa2.py`](../../contracts/v2/coffee_mugs_fa2.py) — SmartPy v0.24, mirrors `visit_nouns_fa2.py` you already shipped |
| **Deploy script** | [`scripts/deploy-coffee-mugs-mainnet.mjs`](../../scripts/deploy-coffee-mugs-mainnet.mjs) — mirror of `deploy-visit-nouns-mainnet.mjs`, reads `/tmp/pointcast-coffee-mugs-{contract,storage}.json`, generates a fresh signer at `/tmp/pointcast-coffee-mugs-signer.json` |
| **Register script** | [`scripts/register-coffee-mugs-tokens.mjs`](../../scripts/register-coffee-mugs-tokens.mjs) — post-origination admin call, sends a `sp.map[sp.nat, sp.string]` of the 5 mug names |
| **Deploy runbook** | [`docs/plans/2026-04-25-coffee-mugs-deploy-runbook.md`](../plans/2026-04-25-coffee-mugs-deploy-runbook.md) — 6-step path, both Beacon + throwaway options |
| **Mike brief** | [`docs/briefs/2026-04-25-mike-coffee-mugs-fa2.md`](2026-04-25-mike-coffee-mugs-fa2.md) — defaults + open questions |
| **Claim endpoint** | [`functions/api/coffee/claim.ts`](../../functions/api/coffee/claim.ts) — live on prod, dual-mode (banked / mintable). Auto-flips when `coffee_mugs.mainnet` is populated. |
| **contracts.json placeholder** | [`src/data/contracts.json`](../../src/data/contracts.json) — `coffee_mugs.mainnet = ""` waiting for KT1 |

The contract is **245 lines**, has a built-in `sp.add_test()` scenario that exercises origination + register + mint + cap enforcement + unregistered-token rejection. No edits needed unless you spot a bug.

---

## Defaults Mike approved (no overrides given)

| Param | Value |
|---|---|
| Royalty | 7.5% (750 bps) to admin |
| Edition caps | ceramic 333 / espresso 144 / latte 64 / paper 21 / bistro 8 |
| Mint price | 0 ꜩ (gas-only public mint) |
| Token names | Ceramic Mug · Espresso Cup · Latte Glass · Paper Cup · Bistro Cup |
| Origination signer | **fresh throwaway** at `/tmp/pointcast-coffee-mugs-signer.json` (the deploy script generates this if absent — same pattern as Visit Nouns) |
| Royalty / final admin | `tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw` (Mike's main wallet — admin transferred via `set_administrator` post-register) |

If you want to override anything (e.g. mint price > 0 for legendary), flag in the PR description and Mike approves.

---

## Path A · compile-only (~15 min, recommended first)

The fastest unblock. You compile + commit the JSONs; Mike runs the deploy script himself.

### Tasks

1. Verify your SmartPy install is at v0.24.x (`SmartPy.sh --version` or `python -c "import smartpy; print(smartpy.__version__)"`). The contract uses the v0.24 fa2_lib mixin pattern.
2. Compile:
   ```sh
   ~/smartpy-cli/SmartPy.sh compile contracts/v2/coffee_mugs_fa2.py /tmp/coffee-mugs-build/
   ```
   or via the `smartpy-tezos` Python module:
   ```sh
   python -m smartpy compile contracts/v2/coffee_mugs_fa2.py /tmp/coffee-mugs-build/
   ```
3. Confirm the test scenario passes (look for `✓` next to all `sc.h2` blocks in the build output, esp. cap-enforcement + unregistered-token rejection).
4. Copy the two emitted JSONs to:
   ```
   /tmp/pointcast-coffee-mugs-contract.json
   /tmp/pointcast-coffee-mugs-storage.json
   ```
   (file names from the build dir are typically `step_002_cont_0_contract.json` + `..._storage.json`)
5. Optional but useful: commit the compiled JSONs to the repo so cc can verify shapes without recompiling. Suggested path:
   ```
   contracts/v2/dist/coffee_mugs_fa2/contract.json
   contracts/v2/dist/coffee_mugs_fa2/storage.json
   ```
6. Open a PR titled `feat(contract): coffee_mugs_fa2 compiled artifacts` with:
   - Build output (the test scenario stdout, gzipped if long)
   - The compiled JSONs at the path above
   - A note in the PR description: "ready for Mike to run `scripts/deploy-coffee-mugs-mainnet.mjs`"
7. Reply on the PR or via `/api/ping` when done.

### Acceptance

- [ ] Test scenario passes green (paste stdout in PR)
- [ ] `/tmp/pointcast-coffee-mugs-contract.json` is valid Michelson JSON (parses, has the expected entrypoints: `mint_mug`, `register_tokens`, `set_metadata_base_uri`, plus the FA2 standard transfer / balance_of / update_operators)
- [ ] `/tmp/pointcast-coffee-mugs-storage.json` includes the 5-entry edition_caps map (333/144/64/21/8) and metadata_base_uri starting with `https://pointcast.xyz/api/tezos-metadata/coffee-mugs`
- [ ] Compiled JSONs committed to `contracts/v2/dist/coffee_mugs_fa2/` for repo-side verification

---

## Path B · full origination (~30 min, if you have a funded mainnet signer)

If you have an existing funded mainnet throwaway and want to run the deploy script too. **Mike's still in the loop on the funding side** — see step 3.

### Tasks

1–4. **Same as Path A** through step 4.

5. Tell Mike (via the PR or `/api/ping`):
   ```
   Coffee Mugs FA2 ready to originate. Throwaway signer: tz1xxx... — please send 3 ꜩ.
   ```
   Do this **before** running the deploy script — origination signing requires the signer wallet to have funds, and the funds are Mike's (this is the only place his hand is required).

6. Once Mike confirms funding (or you observe the balance via tzkt), run:
   ```sh
   node scripts/deploy-coffee-mugs-mainnet.mjs
   ```
   This will originate the contract on mainnet. Capture the printed KT1.

7. Run:
   ```sh
   node scripts/register-coffee-mugs-tokens.mjs
   ```
   Registers the 5 mug names in one admin op (~0.04 ꜩ).

8. Optional: transfer admin to Mike's main wallet:
   ```sh
   node scripts/mainnet-transfer-admin.mjs --contract coffee-mugs tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw
   ```
   *(Note: this script may need a `--contract` flag added — if it errors, ping cc for a 2-min patch.)*

9. Update `src/data/contracts.json`:
   ```diff
     "coffee_mugs": {
   -   "mainnet": "",
   +   "mainnet": "KT1XXXXXXXXXXXXXXXXXXXXXXXX",
   ```
   plus add origination notes following the Visit Nouns `_mainnet_notes` shape.

10. Open the PR with:
    - The compiled JSONs (per Path A step 5)
    - The contracts.json diff
    - The KT1 + tzkt op link in the description

### Acceptance (Path B)

- All Path A acceptance items, plus:
- [ ] Contract is live on mainnet — `https://tzkt.io/<KT1>/storage` returns the expected storage shape
- [ ] All 5 token_ids are registered — verify via `https://tzkt.io/<KT1>/storage` or `https://api.tzkt.io/v1/contracts/<KT1>/bigmaps/token_metadata/keys`
- [ ] `https://objkt.com/collection/<KT1>` resolves (will show empty until the first mint)
- [ ] `contracts.json` updated, PR opened

---

## What NOT to do

- **Don't change the contract source** without flagging in the PR. The shape is locked because the frontend mintables UI references `tokenId 0..4` and the rarity tier names. Bug fixes are welcome; design changes loop back to cc + Mike.
- **Don't push directly to `main`** — small reviewable PR per AGENTS.md.
- **Don't change the edition caps without Mike's go.** 333/144/64/21/8 is the brief default.
- **Don't merge with broken tests.** If the test scenario fails, paste the failure in the PR and ping cc.
- **Don't sign with Mike's main wallet directly.** Throwaway pattern only — admin transfers to Mike's wallet as a follow-up op (and only after register completes successfully).
- **Don't touch the frontend or claim endpoint.** That's cc's lane — once KT1 lands, cc wires the redeem flow upgrade in a separate PR within ~30 min.

---

## What happens after your PR merges

cc picks up on next session:
1. Pulls main, reads the new `coffee_mugs.mainnet` value
2. Wires the `/coffee` Mintables redeem flow — `BANKED ✓` → `pending-mint` → user signs `mint_mug(token_id)` via Beacon → `MINTED` with tzkt link
3. Updates `<ShareThis />` voice for the mintables ("you can collect a mug at...")
4. Files block 0365 (or wherever) announcing the contract is live
5. Manual `wrangler pages deploy` (the GH→Pages hook is still down per block 0353)

End state: visitors who pour past a threshold + connect their wallet on /coffee can claim a mug NFT to their wallet, gas-only. Five rarity tiers, 570 lifetime mugs total.

---

## Pings + handoff

- Reply on the PR you open + ping `cc` via the description
- Or use `/api/ping` with `{ from: "codex", subject: "coffee-mugs ready", body: "PR #XX, KT1 (if any) = ..." }` — cc reads the inbox on every session
- If you hit a wall on either path, file the unresolved bit at `docs/codex-logs/2026-04-25-coffee-mugs.md` with what worked + what didn't

---

*Filed by cc, 2026-04-25 ~11:30 PT. Mike pre-approved option A; option B requires confirming with Mike before broadcasting the origination.*

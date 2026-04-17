# DRUM Token — integration plan

**PM:** CC · **Date:** 2026-04-17 evening PT
**Status:** contract written (`contracts/v2/drum_token.py`, 511 LOC, SmartPy v0.24 FA1.2 with signed-voucher claim flow). Deploy + voucher infra + /drum UI claim = the open work.

---

## The ask

Mike: *"do we have a drum token, start to collect drum tokens for drum"*

Yes — the contract exists. No — it's not originated, not wired to /drum, no user can claim one. Today ships path to "start collecting".

---

## The design (already in the contract)

FA1.2 fungible token with a **signed-voucher claim flow**:

1. User drums on `/drum` — tap counter persists in KV (server-side, anti-gaming), localStorage (offline), and presence.
2. User hits a threshold (e.g., 100 drums → 1 DRUM token).
3. User clicks **"Claim X DRUM"** on /drum.
4. Frontend POSTs to `/api/drum-voucher` with the user's address.
5. The endpoint reads the server-side drum count, computes claimable amount, signs a voucher payload `sp.pack({recipient, amount, nonce, expiry})` with a secret key held only on the server.
6. Endpoint returns `{amount, nonce, expiry, signature}` to the client.
7. Client calls the on-chain `claim(recipient, amount, nonce, expiry, signature)` via Beacon — the user signs the transaction, pays gas (~0.003 ꜩ).
8. The contract verifies the signature, checks the nonce isn't reused, confirms expiry, and mints `amount` DRUM to the user's wallet.

The voucher is the anti-abuse layer: only the backend can issue them, each is single-use and time-bounded, and the user has to hold the wallet that receives.

---

## Shipping path — three phases

### Phase A (today-ish): ghostnet deploy + smoke test

- [x] Contract written
- [ ] Compile via docker or smartpy.io. *No SmartPy CLI installed locally; Mike runs on smartpy.io then paste JSON to `/tmp/drum-token-ghostnet.json`, OR we install docker SmartPy.*
- [x] `scripts/deploy-drum-token-ghostnet.mjs` — this commit
- [ ] `scripts/ghostnet-test-drum-claim.mjs` — admin_mint(1000), claim voucher round-trip, verify balance updates
- **Deliverable:** ghostnet KT1 in `contracts.json.drum_token.shadownet`, smoke-test transcript in `docs/drum-ghostnet-test-YYYY-MM-DD.md`

### Phase B (this sprint): voucher endpoint + /drum claim UI

- [ ] `functions/api/drum-voucher.ts` — Cloudflare Pages Function:
  - POST { address, nonce? } → { amount, nonce, expiry, signature }
  - Reads `SIGNER_SECRET_KEY` from env (Pages secret)
  - Reads server-side drum counter from KV bound as `DRUM_COUNTS`
  - Amount calc: `floor(drums / 100) - already_claimed`
  - Signs payload, returns
  - Records `already_claimed` in KV to prevent double-claim
- [ ] `/drum` UI: a "Claim X DRUM →" button that appears when `drums / 100 >= 1`
- [ ] Beacon integration: reuse `src/lib/tezos.ts`, add a `claimDrum()` export that posts to the voucher endpoint then signs the on-chain claim
- [ ] Visible balance: call FA1.2 `getBalance(wallet, callback)` or TzKT tokens/balances API and show "DRUM: N" in the drum room HUD
- **Deliverable:** `/drum` has a working claim button tied to ghostnet DRUM

### Phase C (post-admin-transfer): mainnet

- [ ] Compile + originate on mainnet via `scripts/deploy-drum-token-mainnet.mjs` (template from mainnet visit-nouns deploy)
- [ ] Admin transfer from throwaway → Mike's main wallet via `set_administrator`
- [ ] Rotate signer key — mainnet voucher signer is a separate key from ghostnet; secret lives in Pages env as `SIGNER_SECRET_KEY_MAINNET`
- [ ] Switch `/drum` to read `contracts.drum_token.mainnet` + mainnet TzKT for balance
- [ ] Launch dispatch block about "the DRUM is tokenized"

---

## Economics

**Issuance cadence** (MH decision):

- **100 drums → 1 DRUM** (1 %): tight, makes DRUM feel earned; would cap casual players at 0-2 DRUM per session.
- **10 drums → 1 DRUM** (10 %): looser, casual players get 5-10 DRUM per session, feels like "candy".
- **1 drum → 1 DRUM** (100 %): maximally generous, supply inflates fast, feels like Doge-tier fun.

**Recommended:** 10 drums → 1 DRUM for launch, with a planned taper once supply exceeds N. Casual player gets a visible payoff within a minute.

**Cap per session:** 100 DRUM per browser/day to stop bot farms.

**Total supply:** no hard cap; DRUM is effectively an "attention coin" that inflates with participation. If we want a cap later, the contract admin can pause claims.

---

## Storage (KV bindings)

Needed in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "DRUM_COUNTS"
id = "<created via wrangler kv namespace create DRUM_COUNTS>"
```

Pages secret:

```
SIGNER_SECRET_KEY     — ed25519 edsk… for ghostnet
SIGNER_SECRET_KEY_MN  — ed25519 edsk… for mainnet (set before Phase C)
```

---

## Safety notes

- The voucher signer is the sensitive secret. If it leaks, anyone can mint DRUM. Treat it like a service-account key.
- Replay protection is on-chain (used_nonces big_map) + off-chain (KV dedup) — both needed because on-chain alone lets a replay work if the user doesn't yet hold any DRUM (the tx fails but doesn't burn the nonce for future claims).
- Expiry: default 5 min. Short enough to make stolen vouchers useless before the network settles.

---

## MH decisions (before ship)

1. **Issuance rate** (10:1, 100:1, 1:1, or other?)
2. **Daily cap per wallet** (100, 1000, unlimited?)
3. **Contract admin post-mainnet** (Mike's main wallet, a multisig, or a committee?)
4. **Signer rotation cadence** (never, monthly, on-compromise-only?)

All four are 30-second calls; none block Phase A.

---

*Next action: Mike compiles on smartpy.io (or authorizes docker install), then `node scripts/deploy-drum-token-ghostnet.mjs` runs end-to-end.*

# Admin transfer runbook — Visit Nouns FA2

**Filed:** 2026-04-24 (Sprint 21, autonomous queue close)
**Owner:** Mike (executes) · cc (wrote runbook, can assist)
**Status:** Ready to run. Commands verified against current repo state.
**Blast radius:** one contract, one op, ~0.003 ꜩ gas. Irreversible.

---

## Why this matters

Visit Nouns FA2 `KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh` is currently
administered by the **throwaway signer** `tz1PS4WgbYCKcKnfbfMNSH44JfrnFVhkcKp1`.
That address's secret key lives at `/tmp/pointcast-mainnet-signer.json` on
Mike's laptop — a single file on a single machine, with no backup, no
rotation, and no hardware wallet involvement.

Two failure modes this transfer eliminates:

1. **Bus factor.** If the laptop dies, the file is gone, and so is every
   future admin op — minting, metadata base-CID updates, pause, admin
   re-transfer. The contract keeps working (transfers, reads) but is
   frozen for anything new.
2. **Key hygiene.** The throwaway was fine for origination — a small,
   purpose-built key that held 25 ꜩ briefly and signed one cascade.
   Leaving it as long-term admin makes the contract's privileged
   operations dependent on a key with no authentication story.

After transfer, admin is Mike's main mainnet wallet
`tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`, which is a Beacon-connected
wallet (Kukai / Temple / Umami) with a real seed phrase backed up.
Future admin ops go through a hardware-signed Beacon prompt instead
of a JSON file on disk.

---

## Pre-flight checks

Run each of these before the transfer. All must be green.

### 1. Signer key file still present

```bash
ls -la /tmp/pointcast-mainnet-signer.json
```

Expected: file exists, ~200–400 bytes, readable. If it's gone, **stop
here** — the transfer is not recoverable via this script, and the
throwaway remains admin forever. (The contract keeps working; only new
admin ops are locked.) Ping cc to help recover from the full cascade
output logs if you still have them.

### 2. Contracts JSON populated

```bash
cat src/data/contracts.json | head -15
```

Expected: `visit_nouns.mainnet` is `"KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh"`.
If empty, origination hasn't run — this script won't do anything.

### 3. Target address sanity

The default new admin in the script is `tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`.
Verify that's still Mike's intended main wallet:

```bash
# Sanity-check on TzKT — this wallet's tx history should look familiar
open "https://tzkt.io/tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw/operations"
```

If for any reason Mike wants a different wallet (e.g. a new multi-sig,
a fresh key), pass it as the first argument:

```bash
node scripts/transfer-admin.mjs tz1NewAdminAddressHere
```

Address must match `/^tz[123][a-zA-Z0-9]{33}$/` or the script exits 1.

### 4. Throwaway has enough gas

```bash
# Check throwaway's remaining balance
curl -s "https://api.tzkt.io/v1/accounts/tz1PS4WgbYCKcKnfbfMNSH44JfrnFVhkcKp1" \
  | jq '{balance, lastActivity: .lastActivityTime, ops: .numTransactions}'
```

Expected balance: anything > 0.01 ꜩ is plenty (gas cost is ~0.003 ꜩ).
If balance is near zero, fund the throwaway with a tiny top-up from the
main wallet — 0.1 ꜩ is more than enough. Don't over-fund; this key is
going to be retired immediately after.

### 5. No pending ops in flight

```bash
# Check for unconfirmed ops against the contract or the throwaway
curl -s "https://api.tzkt.io/v1/accounts/tz1PS4WgbYCKcKnfbfMNSH44JfrnFVhkcKp1/operations?status=pending" \
  | jq '. | length'
```

Expected: `0`. If there's anything pending, wait for it to confirm or
back out before running the transfer.

### 6. Dry-run nerve check

This is a one-way door. After confirmation, the throwaway is **done**
as admin, and `set_administrator` can only be called by the new admin.
Double-check:

- [ ] contract is the right KT1 (`KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`)
- [ ] new admin is the right tz2 (`tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`)
- [ ] Mike has Kukai/Temple/Umami connected to that wallet, seed phrase
      backed up, and can successfully sign something *today*
- [ ] backup of `/tmp/pointcast-mainnet-signer.json` somewhere (just in
      case — copy it to `~/Secure/pointcast-backups/` before running)

---

## The transfer

One command. All it does: reads the signer file, builds a
`set_administrator(<new>)` op with Taquito's `contract.methodsObject`,
broadcasts via the throwaway's InMemorySigner, waits one confirmation.

```bash
cd /Users/michaelhoydich/pointcast
node scripts/transfer-admin.mjs
```

Expected output:

```
[transfer-admin] contract:         KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh
[transfer-admin] current admin:    tz1PS4WgbYCKcKnfbfMNSH44JfrnFVhkcKp1 (throwaway)
[transfer-admin] new admin:        tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw
[transfer-admin]
[transfer-admin] broadcasting set_administrator …
[transfer-admin]   op: oo... https://tzkt.io/oo...
[transfer-admin] waiting for confirmation (usually 15-30s on mainnet)…
[transfer-admin] ✓ confirmed.
```

**If it errors:** look at the message carefully.
- "contract does not expose set_administrator" — wrong contract shape;
  verify KT1 and abort.
- "bad new-admin address" — fix the argument.
- Taquito gas/timeout errors — retry after 30s. Never re-run if the
  first broadcast was successful; check TzKT first.

---

## Post-transfer verification

Run all of these. All must be green before declaring the transfer
complete.

### 1. TzKT confirms the op

Open the op URL printed by the script:

```
https://tzkt.io/<op-hash>
```

Expected: "Applied" status, one internal `set_administrator` call on
`KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`, sender `tz1PS4W…`, one
parameter = `tz2FjJhB…`.

### 2. Contract storage reflects the new admin

```bash
# Read the contract's storage and find the administrator field
curl -s "https://api.tzkt.io/v1/contracts/KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh/storage" \
  | jq '. | { administrator, paused, next_token_id }'
```

Expected `administrator`: `"tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw"`.

### 3. Throwaway is locked out

Try to call `pause` or any admin entrypoint from the old signer — it
should revert with whatever FA2-admin guard the SmartPy contract uses.
(Don't bother scripting this; the TzKT storage check in step 2 is
authoritative.)

### 4. New admin can sign

From the PointCast UI:
- Open `/profile` and ensure the active wallet is
  `tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`
- Attempt a no-op admin action that Visit Nouns exposes — simplest is a
  `set_paused(false)` via a one-off Taquito call in the browser console,
  or skip entirely and trust step 2.

---

## After transfer — checklist

- [ ] Update `src/data/contracts.json._mainnet_notes.administrator` to
      `tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw` + record the op hash in
      `_mainnet_notes.adminTransferOp`
- [ ] Commit that change: `chore(tezos): record admin transfer — op
      oo…`
- [ ] Move `/tmp/pointcast-mainnet-signer.json` to a retired-keys vault
      (`~/Secure/pointcast-backups/retired/`) and remove from `/tmp`
- [ ] Delete the `DEFAULT_NEW_ADMIN` constant in
      `scripts/transfer-admin.mjs` (or rename the script to
      `.retired-transfer-admin.mjs`) since it's single-use
- [ ] Add a one-line block on `/for-agents` and `/status` noting the
      admin is now Mike's main wallet
- [ ] Consider recording a TALK block when `/talk` goes live —
      "Admin transfer completed 2026-04-24: KT1LP… → tz2FjJhB…"

## For future originations (Marketplace, DRUM, Prize Cast, Passport Stamps)

When each of those contracts goes live on mainnet, **originate with the
admin already set to Mike's main wallet** — no throwaway intermediate
step. The visit-nouns approach (origination via throwaway then
transfer) made sense because it kept the origination key scoped and
disposable, but future contracts should use Beacon-signing from the
Kukai flow via the `scripts/deploy-*-mainnet.mjs` pattern.

The SmartPy templates for those contracts currently accept an
`admin: sp.address` param in storage — pass Mike's main wallet at
origination time, done.

## Rollback

There is no rollback. `set_administrator` is idempotent on the old
admin during the same session but irreversible after one confirmation.
If the wrong address ends up as admin, the only recovery is that
address signing a new `set_administrator` back — which means the wrong
address has to cooperate. Triple-check the target tz2 before the op
broadcasts.

## Open questions (for Mike, pre-transfer)

1. **Timing.** Transfer in the morning before any Drop 001 mint ops,
   or after? cc recommends **before** — the drop mint script should run
   as Mike's main wallet, not the throwaway, so minting directly under
   the new admin is cleaner.
2. **Record on-chain?** Optional: after confirming, sign a tiny
   `transfer` of 0 tokens between Mike's wallets with a note in
   `_mainnet_notes` pointing to the admin-transfer op, so TzKT shows a
   clear "ceremony" in the activity log. Purely cosmetic; skip if
   you're in a hurry.
3. **Marketplace implications.** Mike's main wallet is
   `tz2FjJhB…` which is also the seller on every active objkt listing.
   That has a side effect: self-fulfill protection (`M_NO_SELF_FULFILL`
   on the marketplace contract) means Mike cannot "test buy" his own
   listings from the same wallet. This is pre-existing; admin transfer
   doesn't change it. Noted here so it's not a surprise.

---

*Small op. Big key-hygiene win. Run it before the drop.*

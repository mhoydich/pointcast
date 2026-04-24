# Prize Cast — next-hour tactical plan

**Filed:** 2026-04-24 (Sprint 21)
**Scope:** What needs to happen *tomorrow*, in what order, to move Prize
Cast from "fully specified, contract written, untouched" to "ghostnet
smoke test confirmed."
**Not a re-write of:** `docs/pm-briefs/2026-04-17-prize-cast-on-tezos.md`
or `contracts/v2/README-prize-cast.md` — those still hold. This is the
45-minute runbook that turns them into a live testnet contract.

---

## Where Prize Cast is right now

**Artifacts present:**
- `contracts/v2/prize_cast.py` — 463-line SmartPy v0.24 contract. Deposit,
  withdraw, delegate, draw, ticket-weight accrual, commit-reveal-ready
  storage shape. Written by Codex 2026-04-17.
- `docs/pm-briefs/2026-04-17-prize-cast-on-tezos.md` — product spec.
- `contracts/v2/README-prize-cast.md` — implementation companion doc
  explaining storage + randomness tradeoffs + draw cadence math.
- `scripts/deploy-prize-cast-ghostnet.mjs` — origination script (exists).
- `src/pages/cast.astro` + `/cast.json` — Bloomberg-terminal UI already
  shipped (Apr 17 evening run), sits in a "pending-contract" band until
  `src/data/contracts.json.prize_cast.mainnet` is populated.

**The one blocker:** the contract has never been compiled. SmartPy
`v0.24` isn't installed anywhere in the repo's toolchain. Until it
compiles, there's nothing to deploy.

---

## The three Mike-decisions that gate everything

Make these in order. Each blocks the next.

### Decision 1 — SmartPy compile path

**Pick one** (in order of cc-preference):

**A. smartpy.io paste-and-compile** (recommended for a smoke test)
- Open `contracts/v2/prize_cast.py` in the editor at https://smartpy.io
- Click "Compile" → download the Michelson `.tz` file + the metadata
  `.json`
- Save into `contracts/v2/out/prize_cast/{step_0_cont_0_contract.tz,
  metadata.json}`
- **Pro:** zero install time, works in a browser, gets us to ghostnet
  in the next 5 minutes
- **Con:** manual step; not reproducible from CI
- **Time:** 5–10 min

**B. Docker SmartPy image**
```bash
docker run --rm -v "$PWD:/work" -w /work smartpy/smartpy:v0.24 \
  compile contracts/v2/prize_cast.py contracts/v2/out/prize_cast
```
- **Pro:** reproducible, scriptable, same output every run
- **Con:** first pull is ~500MB, ~5 min
- **Time:** 10–20 min including image pull

**C. Dedicated VM with SmartPy CLI installed**
- Spin up a small Fly.io / Hetzner box, apt-install SmartPy per their
  docs, run compile there
- **Pro:** good for repeated contract work over weeks/months
- **Con:** overkill for a one-off smoke test
- **Time:** 30–60 min

**cc recommends A for today.** Prize Cast isn't ready for production
mint volumes — it's a smoke test. Optimize for speed; revisit the
pipeline when v0 goes mainnet.

### Decision 2 — ghostnet baker delegate

The contract's `setDelegate()` needs a baker address. Options:

- **Tezos Foundation test baker** (safest, always up): `tz1cD5CuvAALcxgypqBXcBQEA8dkLJivoFjU`
- **Any public ghostnet baker**: pick from https://ghost.tzstats.com/
- **Don't delegate for the smoke test** (set to `None`): fastest but
  can't verify yield-accrual end-to-end

cc recommends: **delegate to TF test baker** — takes one extra 30-s
op, confirms the `setDelegate` entrypoint works, and makes the ticket-
weight test meaningful.

### Decision 3 — initial cadence + minimum deposit

The contract stores these as `sp.nat`:
- `draw_cadence_blocks` — blocks between draws. 30-s blocks × 2880 = 24 h
- `min_deposit_mutez` — smallest deposit accepted. 1 ꜩ = 1,000,000 mutez

For the ghostnet smoke test, set aggressively short:
- `draw_cadence_blocks: 20` (10 min — lets the full cycle complete
  while you're watching)
- `min_deposit_mutez: 100_000` (0.1 ꜩ — cheap to test with faucet tez)

These are knobs on the origination script; pass via CLI args or edit
the script header.

---

## The 45-minute runbook

Assumes Decisions 1, 2, 3 are made. Total wall time 30–60 min.

### Step 1 — compile (5–10 min)

```bash
# Option A — smartpy.io
# Paste prize_cast.py → Compile → save outputs to contracts/v2/out/prize_cast/

# Option B — Docker
docker run --rm -v "$PWD:/work" -w /work smartpy/smartpy:v0.24 \
  compile contracts/v2/prize_cast.py contracts/v2/out/prize_cast

# Verify
ls -la contracts/v2/out/prize_cast/
# expect: step_0_cont_0_contract.tz, step_0_cont_0_storage.tz, metadata.json
```

### Step 2 — fund ghostnet signer (2 min)

```bash
# Use the same throwaway-signer pattern as visit-nouns mainnet
node scripts/make-ghostnet-signer.mjs   # if missing; check /tmp/
# Outputs: /tmp/pointcast-ghostnet-signer.json with a fresh tz1...

# Fund from https://faucet.ghostnet.teztnets.com/ — request 100 ꜩ
# Paste the tz1 address, wait for faucet op
```

### Step 3 — originate on ghostnet (3–5 min)

```bash
node scripts/deploy-prize-cast-ghostnet.mjs
# Watch for the KT1 address in output.
# Paste into src/data/contracts.json.prize_cast.ghostnet (add key if missing)
```

Expected: op confirms in 10–20 s. Contract's `administrator` is the
ghostnet signer (fine for a smoke test — production uses Mike's main
wallet).

### Step 4 — smoke-test the four core flows (20 min)

Do each from the ghostnet signer via Taquito script or Better-Call.dev:

1. **Deposit** 1 ꜩ twice from two different fresh ghostnet addresses
   (fund them first from the faucet). Confirm both `principal` rows
   appear in storage, `participant_count` === 2.
2. **Wait 10 min** (draw cadence) and call `draw()` from either
   participant. Confirm a winner payout op fires, `total_weight`
   resets, round index increments.
3. **Withdraw** the full principal from the winner. Confirm balance
   back, `principal` row for that entrant gone.
4. **Withdraw** from the loser. Confirm the same.

Document outputs in `docs/briefs/2026-04-24-prize-cast-smoke.md` —
TzKT links to each op.

### Step 5 — wire /cast to ghostnet (optional, 10 min)

The `/cast` page reads `src/data/contracts.json.prize_cast.mainnet` and
shows a pending-band when empty. For a ghostnet preview link:

```bash
# Optionally add a ghostnet-aware branch
# src/pages/cast.astro could read .ghostnet when window.location includes
# ?net=ghostnet — or simpler, just manually flip mainnet during smoke and
# revert.

# Rebuild, redeploy
npm run build:bare
npx wrangler pages deploy dist --project-name pointcast --branch main
```

**Cleaner:** skip this step, keep mainnet empty, link TzKT directly
from the brief.

---

## What's explicitly NOT happening this week

- **Mainnet origination.** Needs commit-reveal randomness (v1 upgrade
  in the spec), real baker selection, a proper admin wallet, and an
  audit/review pass from Codex on the compiled Michelson. Ghostnet
  smoke is the gate before any of that.
- **Frontend deposit flow.** `/cast` has the terminal UI; actually
  wiring Beacon → Taquito → `deposit()` needs the mainnet KT1, so it
  waits too.
- **Cron-driven `draw()`.** Phase 3 concept: a Pages Function on a
  cron schedule that anyone can run, using the contract's own
  cadence check as guard. Works fine as manual-call for now.

## Open questions for Mike

1. **Pick A / B / C** for the compile path.
2. **Baker delegate** — Tezos Foundation test baker or specific named
   one?
3. **Is Prize Cast going on pointcast.xyz branding or its own domain?**
   (Spec is ambiguous — "frames it as a broadcast mechanic" vs "ties to
   the BLOCKS.md faucet channel." Decide before mainnet.)
4. **Audience.** Is v0 Tezos-native users familiar with no-loss
   mechanics, or does the UI need to teach "your principal is safe,
   you only play with yield" from scratch? Shapes how much copy /cast
   needs.
5. **Minimum deposit for mainnet v0.** 1 ꜩ feels right; confirm.

---

## References

- PM brief: `docs/pm-briefs/2026-04-17-prize-cast-on-tezos.md`
- Implementation companion: `contracts/v2/README-prize-cast.md`
- Contract: `contracts/v2/prize_cast.py`
- Deploy script: `scripts/deploy-prize-cast-ghostnet.mjs`
- UI: `src/pages/cast.astro`, `src/pages/cast.json.ts`

---

*Smoke-first. Ghostnet cycles are cheap, mainnet mistakes are
permanent. Compile, deploy, prove the four flows work, then let the
spec decide what's next.*

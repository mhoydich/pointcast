# Passport Seals FA2 — deploy notes

**Source:** `contracts/v2/passport_seals_fa2.py`
**Compiled:** 2026-07-18 by cc against pinned `smartpy-tezos==0.24.1`
(exit 0, all scenario assertions green — claim/double-claim/paid-mint/
transfer-denied/operators-unsupported all exercised).
**Artifacts:** `contracts/build/passport_seals/` — `step_003_cont_0_contract.{json,tz}` + `_storage.{json,tz}`
**PRD:** `docs/plans/2026-07-18-prd-seal-registry.md` (Phase C)

## What it is

Soulbound FA2, one seal per address, self-claimed:

- `claim_seal` — public, gas-only (`amount == 0` enforced). Mints exactly
  one seal to `sp.sender`; a second claim fails `PC_SEAL_ALREADY_CLAIMED`.
- Soulbound via fa2_lib's stock `NoTransfer` policy (listed before `Nft`
  in the MRO): `transfer` always fails `FA2_TX_DENIED`, `update_operators`
  always fails `FA2_OPERATORS_UNSUPPORTED`. Full FA2 interface intact for
  indexers.
- No burn entrypoint. Foil doesn't peel.
- Admin (`set_administrator`, `set_metadata`) only for TZIP-16 metadata
  rotation — admin cannot mint, move, or revoke seals.

Token metadata is identical for every seal (name/symbol/decimals/desc +
`""` → `https://pointcast.xyz/townsfolk`), stored as pre-encoded UTF-8
hex because 0.24.1's stdlib has no `bytes_of_string`. Plaintext of each
literal is commented inline in the source.

## Mike's origination checklist (only you sign — house law)

1. **Patch storage before origination.** The compiled storage carries the
   test-scenario admin (`tz1UyQDe…`) and a placeholder TZIP-16 pointer
   (`ipfs://PLACEHOLDER-TZIP16`). Replace the admin address with your
   wallet and (optionally now, or later via `set_metadata`) the real
   TZIP-16 metadata URI. Everything else originates empty.
2. Originate from your Beacon wallet via `/admin/deploy` with
   `contract.json` + patched storage — same option-B flow as the Coffee
   Mugs notes. (Recompiling with your admin baked in also works: edit the
   scenario's `administrator=` and rerun; ritual is at the top of the
   source file.)
3. Paste the KT1 into `src/data/contracts.json` under `passport_seals`.
4. Redeploy the site — /townsfolk's Phase C hook ("mint this seal" on
   verified covers) keys off that contracts.json entry going live.

## What stays off-chain, on purpose

The chain proves "this wallet claimed, once." Whether the wallet also
published a reader-verifiable journey seal stays with /api/seals +
/townsfolk's in-browser verification, per the PRD's trust model. No
oracle, no admin allowlist — the two rungs compose without depending on
each other.

# Kennel Club signing afternoon

Date: 2026-09-02

Status: prepared; no files pinned and no contract originated

Contract source reviewed: PR #1008, commit `5c6701d758127606cc19e6d1a562d1c31882d92c` (read only; do not merge from this runbook)

The target is a single controlled sitting in which every artifact and parameter is already checked. Mike's active Kukai address, `tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`, should only be asked to approve the mainnet origination and the explicit admin operations listed below. Never paste or export its key.

## Decisions

Record any departure here before pinning, because token metadata becomes immutable once its CID is used.

1. **Edition mode — recommended: open edition.** Each token can be minted without a supply ceiling only inside its `[open_at, close_at)` window. The contract still carries a positive `edition_cap` storage value because #1008 validates it at origination, but ignores it in open mode. Alternative: capped, with one shared cap for all thirty token IDs.
2. **Price — recommended: 1 ꜩ (`1000000` mutez).** The mint requires the exact amount and forwards it immediately to the treasury. There is no retained contract balance in the normal path.
3. **Admin and treasury — recommended: Mike's active Kukai for both.** Use `tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw` until the TzSafe multisig exists. After TzSafe is verified on mainnet, call `set_treasury` first and `set_admin` last; the latter gives up unilateral admin control.

## Order of operations

### 0. Preflight

- Work from this branch and fetch, but do not merge, PR #1008: `git fetch origin pull/1008/head`.
- Confirm `npm ls @taquito/taquito @taquito/beacon-wallet @taquito/signer` reports 25.x throughout.
- Run `npm test` and `git diff --check`.
- Confirm all 30 PNG and 30 WebP files exist and all numeric metadata files `0.json` through `29.json` pass `tests/kennel-club-metadata.test.mjs`.
- Before the first origination, append a `planned` entry with no address to `~/.claude/skills/tezos/references/registry.json`, then mirror that planned state in `references/contracts.md`. This satisfies the Tezos registry rule without inventing a KT1; step 7 fills the entry only from the confirmed mainnet receipt.
- Ghostnet is retired. Shadownet is the only test network in this procedure. Kukai is mainnet-only.

### 1. Pin

Preview the exact 91-file plan; this command needs no credential and changes nothing:

```sh
node scripts/kennel-club-pin.mjs --dry-run
```

Choose one service and expose its credential only in the current shell. Pinata is the recommended path:

```sh
PINATA_JWT='…' node scripts/kennel-club-pin.mjs \
  --provider pinata \
  --treasury tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw \
  --verify
```

The equivalent fallback is `NFT_STORAGE_KEY='…' ... --provider nft-storage`. The script pins PNG and WebP files first, rewrites the token metadata URI and creator placeholders, pins the thirty token JSON files, then pins `metadata/contract.json`. It saves every result incrementally in `contracts/kennel-club/pins.json`, so an interrupted run resumes without intentionally repinning completed entries.

### 2. Verify CIDs

Run a second, read-only gateway pass after the initial upload process exits:

```sh
node scripts/kennel-club-pin.mjs --verify-only
```

Do not continue unless it says `Verified 91/91 pinned files byte-for-byte`. Also inspect `pins.json`: 60 image records, 30 token metadata records, one contract metadata record, no placeholder substring, and treasury equal to Mike's active Kukai. Open at least token 0, token 1, token 29, and the contract CID through two gateways.

### 3. Originate on Shadownet

Use a funded test key from an environment variable only. The script compares the selected RPC head with TzKT, falls back if necessary, reveals an unrevealed key in its own operation, and then originates from #1008's pinned compiled JSON artifacts.

```sh
export KENNEL_CLUB_TESTNET_SECRET_KEY='edsk…'
node scripts/kennel-club-originate.mjs \
  --network shadownet \
  --signer inmemory \
  --edition open \
  --price-mutez 1000000 \
  --treasury tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw \
  --admin tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw
```

The command above is preparation-only. Check the printed code/storage hashes and UTC range, then repeat it with `--execute --unpaused`. Save the operation hash and Shadownet KT1. Unset the key immediately after the test session.

### 4. Smoke mint on Shadownet

- Read the originated storage in Shadownet TzKT. Verify `edition_mode = open`, `price_mutez = 1000000`, `paused = false`, the thirty metadata pointers resolve, and token 1 is open on 2026-09-02 until `2026-09-03T07:00:00Z`.
- From the funded test account, call `mint(1)` with exactly `1000000` mutez. Confirm supply and its ledger balance both become 1, the treasury balance rises by 1 ꜩ, and the FA2 retains 0 ꜩ.
- Negative checks: `999999` mutez returns `WRONG_MINT_AMOUNT`; a future token returns `MINT_NOT_OPEN`; token 1 at or after its close returns `MINT_CLOSED`.
- Save TzKT links for the origination and successful mint. This proves the contract path, not Beacon/Kukai; the browser wallet path still needs the mainnet signing-page check.

### 5. Originate on mainnet with Kukai

Prepare first; this cannot open a wallet or send an operation:

```sh
node scripts/kennel-club-originate.mjs \
  --network mainnet \
  --signer kukai \
  --edition open \
  --price-mutez 1000000 \
  --treasury tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw \
  --admin tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw
```

Match its hashes and parameters to the Shadownet candidate. Then add `--execute --confirm-mainnet I_UNDERSTAND_MAINNET`. The script checks RPC freshness, starts a temporary local Vite page, and opens it. Mike clicks once to connect Kukai and once to approve the origination. The temporary page calls `tezos.wallet.originate`; it does **not** use Beacon `requestSignPayload`, which is the raw-attestation path and the wrong API for an origination. The script deletes its temporary directory after confirmation.

The mainnet template is intentionally originated paused. Do not publish the KT1 yet.

### 6. Set windows and late starts, then unpause

The canonical future windows are local-midnight-to-local-midnight in `America/Los_Angeles`; September 2026 is represented as `07:00:00Z` boundaries. For every date already missed when origination confirms, make a deliberate catch-up window: `open_at` is the confirmed origination time rounded down to the minute and `close_at` is exactly 24 hours later. On a September 2 signing, this means repairing token 0; repair token 1 too only if its canonical close has already passed. Do not alter future token windows.

Using the confirmed KT1 and Mike's Kukai, call `set_window(token_id, open_at, close_at)` once per repaired token. Read each value back through `get_window`. Then call `set_paused(false)` as the final activation signature and read storage again. A failed or unverified window update means the collection stays paused.

### 7. Register the KT1

Only after mainnet TzKT shows the exact expected code, admin, treasury, price, metadata CID, windows, and `paused = false`:

1. Fill the planned entry already present in `~/.claude/skills/tezos/references/registry.json` with id `pointcast.kennel-club-september-sitting`: mainnet network, confirmed KT1, admin/treasury, origination date/hash, and status `experiment` until usage is observed.
2. Replace the planned prose in `~/.claude/skills/tezos/references/contracts.md` with the same verified facts under PointCast.
3. Add `kennel_club` to `src/data/contracts.json` with the mainnet KT1, saved Shadownet KT1, symbol `KCSIT`, `mintEntrypoint: "mint"`, `mintPriceMutez: 1000000`, edition mode, contract metadata CID, and the two TzKT operation links.
4. Commit those registry changes separately from the immutable-prep commit so the deployment receipt is auditable.

Never register an address copied only from the wallet modal. Use the confirmed TzKT origination result and match its operation hash.

### 8. Flip Block 0583 to MINT

Change `src/content/blocks/0583.json` from `"type": "NOTE"` to `"type": "MINT"` only after step 7 is committed. Replace its pending mint copy and `meta.mint` with the confirmed edition, exact 1 ꜩ price, 24-hour window rule, KT1, and mint route. Build and preview the block, its JSON twin, `/kennel-club`, and one mobile mint flow before publishing.

The final release gate is a real Kukai mint with a confirmed operation, correct token ID, treasury receipt, and wallet/indexer display. A successful origination alone is not a live mint.

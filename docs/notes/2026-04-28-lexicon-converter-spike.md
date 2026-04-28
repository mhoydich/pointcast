# Lexicon converter spike · 2026-04-28

**Sprint:** Federation Phase 0 + Rooms  
**Plan item:** S2-1 pulled forward from 2026-04-29  
**Command:** `node scripts/lexicon-convert.mjs`

## What Ran

The converter reads `src/content/blocks/*.json`, skips drafts by default, extracts the JSON sketch from `docs/rfcs/0004-pointcast-block-lexicon.md`, maps each published Block into an AT Protocol-style record envelope, validates the record against the sketch, and writes inspection files to `tmp/lexicon-records/`.

Each output envelope is shaped:

```json
{
  "uri": "at://did:example:pointcast/xyz.pointcast.block/0381",
  "collection": "xyz.pointcast.block",
  "rkey": "0381",
  "record": {
    "$type": "xyz.pointcast.block",
    "id": "0381"
  }
}
```

`tmp/lexicon-records/` is a generated scratch artifact and should not be committed.

## Results

- Input Block files: 168
- Drafts skipped: 4
- Records written: 164
- Runtime: about 100 ms locally
- Validation errors: 0
- Validation warnings: 86

The first run found one real mismatch: a site-relative `media.src` path did not satisfy the RFC's URI format. The converter now normalizes relative media URLs against `https://pointcast.xyz`, so records are portable outside the site bundle.

## Drift Found

All remaining warnings are `knownValues` drift between the RFC sketch and the live schema:

| Field/value | Count | Meaning |
|---|---:|---|
| `author: "mh+cc"` | 16 | RFC author list is missing the co-authored byline already used in Blocks. |
| `channel: "GDN"` | 12 | RFC channel list is stale. |
| `channel: "ESC"` | 12 | RFC channel list is stale. |
| `channel: "GF"` | 11 | RFC channel list is stale. |
| `channel: "FCT"` | 8 | RFC channel list is stale. |
| `size: "3x2"` | 6 | RFC size list is missing the large home-grid tile. |
| `channel: "CRT"` | 6 | RFC channel list is stale. |
| `channel: "BTL"` | 3 | RFC channel list is stale. |
| `meta.status: "staged"` | 3 | `meta.status` is free-form in practice. |
| `channel: "BDY"` | 2 | Birthday channel is missing from the RFC sketch. |
| Other `meta.status` values | 7 | `meta.status` should probably remain open text, not `knownValues`. |

Fields present in current Blocks but not represented in `xyz.pointcast.block`:

| Field | Blocks | Notes |
|---|---:|---|
| `visitor` | 5 | Better fit for a future `xyz.pointcast.visit` Lexicon. |
| `edition` | 1 | Value-bearing mint metadata still belongs on Tezos; the block record can link to it. |
| `clock` | 1 | A companion-widget config, probably not worth putting in the base Block Lexicon. |

## Takeaways

The base Block mapping is cleaner than expected. The 164 published Blocks convert without validation errors after URL normalization.

The RFC needs two changes before a real PDS write:

1. Refresh `channel`, `size`, and `author` known values from `src/content.config.ts`.
2. Relax `meta.status` into plain string or move status discipline into a separate application-level validator.

The dropped fields point toward future lexicons rather than forcing every surface into `xyz.pointcast.block`: `xyz.pointcast.visit`, `xyz.pointcast.edition`, and possibly a room/widget config lexicon later.

## Next

Day 4's ATProto round-trip can use these generated envelopes as input. The next script should take 5-10 files from `tmp/lexicon-records/`, push them to a local PDS, and read them back through `getRecord` before testing firehose consumption.

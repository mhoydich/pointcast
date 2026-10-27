# PointCast Account Book — 2026-10-27

Added `/chain/accounts/`, a watch-only companion to Mist. A book holds up to 24
checksum-validated `tz1`, `tz2`, `pca1` or `pcp1` public addresses with local
labels. It saves no balances or keys. The page links to Mist and the existing
wallet setup for actions, and states the play ATTN, reset, single-sequencer,
operator-reported data and local-storage limits beside the relevant controls.

Exports/imports use `pointcast-account-book`, version 1, with exactly these
fields: `format`, `version`, `chainId`, `genesis`, `accounts`. Every account has
exactly `address` and `label`. Imports are capped at 24 KiB and 24 entries;
duplicates inside a file and mismatched identities are rejected atomically.
Merging preserves existing labels. Corrupt saved data is retained until the
person explicitly clears it. Unavailable/full storage switches to a clearly
marked temporary visit, with export still available.

Live reads use the shared `makeNet`/`pinnedStatus` helpers, six-second request
timeouts, four account reads in flight, and a single coalesced successor batch.
Genesis and the exact raw chain ID must match before and after account reads.
A mismatch hides every balance and latches a pause until reload. Superseded
requests cannot publish data. Local edits remain usable while paused, and a
balance update preserves an unfinished label's draft, focus and selection.

Validation: 22 new model, HTTP and jsdom integration checks pass, plus the four
existing Mist/Receipt checks (26 total). Checks cover address kinds/checksums,
storage corruption/denial, schema limits and unknown/private fields, imports,
download exports, copy, DOM text safety, stale request races, bounded reads,
identity changes, malformed account/status replies and request-body timeouts.
Independent Astra review found no remaining blocker after two UI lifecycle
corrections. No browser/mobile visual verification was available.

The full-site Astro build compiled server/client bundles, then its first route
generation attempt failed on an unrelated external fetch (`ECONNREFUSED`,
176.9.105.239:443). A proxy-aware retry and the final combined publication build
are coordinated with the parent release task. No deployment is performed from
this checkout, and no `/games`, Mist or Receipt source is modified here.

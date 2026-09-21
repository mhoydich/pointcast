# Astra review: the music layer and the plan (2026-09-21)

Reviewer: Astra (`gpt-6-astra`, Codex CLI, read-only sandbox, high effort) at the request of Mike. Reviewed `origin/main` at `fb8a6bbf`. Paths below were local to the reviewer's checkout. Every CONFIRMED item was fixed the same day in the PR that added this file; the plan critique is carried into `docs/briefs/2026-09-21-music-sprint.md`.

---

## 1. OVERVIEW

PointCast now has a coherent music companion: keep your own player running, show the town what you have on, tap or estimate its tempo, and play along. `/station` adds Mike’s listening history, rotation, counts, sourced notes and a public request line. ListenBrainz supplies history across services; Spotify supplies additional account-specific information. Presence carries visitors’ listening labels, and MCP lets agents read the station and submit requests.

The strongest idea is the request loop: someone recommends something, Mike plays it, and the town remembers. It gives both people and agents a specific reason to participate. Canonical music links, opt-in microphone access, text-safe rendering and an explicitly labelled simulation are good decisions.

The thin part is the social evidence. Ten scripted listeners demonstrate a possibility, not demand. The over-built part is the surrounding machinery: multiple statistical views, overlapping music surfaces, proposed reputation, receipts and automatic ranking before a repeatable gathering exists. “Every play” also overstates the current collector’s reliability.

**My recommendation: stabilize the collector and test one hosted gathering before expanding the music platform.**

Reviewed checkout `fb8a6bbf`, including offline, in-memory reproductions. No edits, builds or network calls; production was not independently verified.

## 2. CORRECTNESS AND RISK

### CONFIRMED

- **The ingestion cursor disappears at month boundaries.** In [_station.ts:142](functions/api/spotify/_station.ts:142), `syncListenBrainz` searches only the current UTC month for its last LB row. On October 1 it ignores September’s cursor and requests an unanchored 100-row page. It repeats that bootstrap until an LB row survives in October. **Smallest fix:** store a cursor separately, keyed by ListenBrainz username, and advance it only after successful persistence; do not derive ingestion progress from the presentation log.

- **Cross-source merging still drops legitimate repeats.** [_station.ts:86](functions/api/spotify/_station.ts:86) matches different sources within at least ten minutes, repeatedly against the same existing row. An offline reproduction with Spotify at 03:00 and LB listens at 03:00, 03:04 and 03:08 retained **one play**, adding zero LB rows. This is a newer cross-source failure, distinct from the repaired same-source repeat bug; it also stalls the LB cursor. **Smallest fix:** match events one-to-one, preferring exact source identities and allowing each existing event to consume only one counterpart.

- **Public reads perform expensive refresh work without a shared refresh lock.** [_station.ts:310](functions/api/spotify/_station.ts:310) reads two monthly documents, recomputes statistics, and reads/refetches both providers’ long views. This is **bounded**, not literally unbounded: normal logs cap at 12,000 rows across two months. But an expired LB cache makes seven upstream requests; concurrent GETs can each do that and each write `LB_COUNTED_KEY`. Total upstream failure leaves no retry backoff. The sync marker protects neither this refresh nor cross-colocation writes. **Smallest fix:** cache the computed snapshot, serve stale data while one coordinated refresh runs, and record a retry deadline after failure.

- **Existing requests bypass the new duplicate check.** [requests.ts:109](functions/api/station/requests.ts:109) compares only `r.key`; pre-upgrade rows have `trackId` but no `key`. Re-requesting such a track returned **201** in an offline fixture. **Smallest fix:** normalize legacy rows on read with `key = spotify:${trackId}` and `service = spotify`. Separately, [music-links.ts:118](functions/_lib/music-links.ts:118) deliberately keys by service: the same recording on Apple and Spotify remains two requests. That is a documented limitation, not an accidental collision; promise “same service link,” not universal song deduplication.

- **One malformed LB row aborts the whole batch.** [_listenbrainz.ts:38](functions/api/spotify/_listenbrainz.ts:38) calls string methods without runtime type checks and converts any positive numeric timestamp to ISO. A numeric title throws `TypeError`; an out-of-range timestamp throws `RangeError`. `Promise.all` rejects the batch, and sync silently reports no LB additions. Both reproduced offline. **Smallest fix:** validate types and finite, representable timestamps; reject malformed rows individually.

- **Wikipedia’s acceptance rule is weaker than advertised.** [notes.ts:55](functions/api/station/notes.ts:55) accepts an artist mentioned anywhere in the description **or extract**. A same-title song explicitly attributed to another band passes when its extract incidentally mentions the requested band; reproduced offline. This is not the repaired prefix bug. **Smallest fix:** require artist attribution in the description and reject conflicting attribution; omit ambiguous notes.

- **ListenBrainz “on air” is inconsistently propagated.** [station.astro:327](src/pages/station.astro:327) uses LB for the headline, but line 330 selects notes using Spotify or the last logged play. Meanwhile [cursor-room.ts:420](src/scripts/chrome/cursor-room.ts:420) follows `/now-playing.json`, without that LB fallback. With LB playing A and Spotify inactive, the headline can show A, notes B, and the companion nothing. **Smallest fix:** expose one lightweight resolved on-air payload and use it everywhere.

### PLAUSIBLE / NOT ESTABLISHED HERE

- **More than 100 intervening listens:** [_listenbrainz.ts:59](functions/api/spotify/_listenbrainz.ts:59) fetches one page only. If `min_ts` returns the nearest following 100, backlog drains slowly on subsequent syncs; if it returns the newest 100, advancing to their maximum skips the middle. The repository fixture does not establish upstream page-selection semantics. **Fix:** verify that contract, then implement bounded pagination with a persistent continuation and backlog status; merely increasing `count` is insufficient.

- **Unfurl metadata can launder misleading content.** [requests.ts:113](functions/api/station/requests.ts:113) treats any preview title as track recognition and stores its description as `artist`. YouTube/SoundCloud uploaders control much of that text, and a watch URL does not establish that its content is music. Rendering uses `textContent`, so I found no HTML-execution path here. **Fix:** label these fields as provider previews, keep artist unknown unless extracted reliably, and preserve the untrusted-data boundary for agents.

## 3. THE PLAN

**Two weeks of the full music roadmap is the wrong bet now.** Two weeks focused on reliable collection and actual participation could be worthwhile.

Keep source independence, basic request functionality and the chrome simplification. Defer generated beds, signed receipts, agent standing, year pages, automatic room ranking and broad recording-identity resolution. None is needed to discover whether people want to return.

The highest-leverage next step is **one scheduled, Mike-hosted drum session with a request line**, followed by a second session to test return. Invite a small group directly; observe first successful sound, requests, conversation and voluntary return. Artist overlap requires simultaneous listeners; the current plan assumes the hardest prerequisite already exists.

Fix measurement first, but interpret it correctly: **26,103 drum hits are not 26,103 visitors.** The scoreboard is dated August 17, and missing counters elsewhere do not prove zero use.

Opus’s sequencing needs three corrections:

1. Mounting the beacon only in `BlockLayout` misses `/drum` and `/drum-v8`, which use **`DrumLayout`**.
2. Remove invented presence immediately; that does not require completing the manifest migration.
3. Do not replace assertions with `dist` checks that silently skip when no build exists—the proposed migration can make CI green by removing coverage.

The module registry is sensible maintenance. Its ranking formula is premature, and `weightHint ±1` can dominate the entire weighted signal score, contradicting its claimed limited editorial influence.

## 4. OPUS’S CHROME AUDIT

| Claim | Verdict |
|---|---|
| `PageviewBeacon` is mounted nowhere | **Holds.** Source search finds the component, no imports or mounts. The proposed fix needs additional layout coverage. |
| Chrome ships approximately 237 KB eagerly | **Partly holds.** The seven modules are statically imported; their current source totals **228,024 bytes**. Source bytes do not establish minified or compressed browser transfer size. |
| `/rooms` has invented presence | **Holds.** [rooms.astro:52](src/pages/rooms.astro:52) hard-codes “3 here,” line 62 “12 here,” and line 179 renders them without a simulation label. |

## 5. FIVE THINGS TO DO NEXT

1. **Fable:** Fix the independent LB cursor, bounded catch-up and one-to-one cross-source merging before promising complete history.
2. **Sonnet:** Add measurement across both main layouts, repair legacy request keys and remove invented presence.
3. **Mike:** Host two small drum-and-request sessions and use actual participation and return to decide further investment.
4. **Opus:** Reduce the sprint to that experiment, one resolved music signal and the minimum chrome cleanup.
5. **Astra:** Review the fixes against backlog, rollover, repeats, malformed input and concurrent-refresh fixtures before release.
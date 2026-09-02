# KV write diet — 2026-09-02

## Measured before changing

| Request path | State before this change | Writes per request | Binding |
| --- | --- | ---: | --- |
| `POST /api/drum` | Read `drum:total` and `drum:session:{hash}`, then write both. `drum:top` may add a third write for a qualifying session. | 2 (plus conditional leaderboard) | `VISITS` KV |
| `GET /api/drum` | Read global + optional session counter. | 0 | `VISITS` KV |
| `POST /api/analytics` pageview | A 2026-09-02 emergency change returns `204` with `X-PC-Analytics: pageview-suppressed`; it does not write. Earlier keys were one `pv:{path}:{timestamp}:{id}` write per pageview with a 90-day TTL. | 0 currently; 1 historically | `PC_ANALYTICS_KV` KV |
| `POST /api/analytics` other valid event | One immutable event record with a 90-day TTL. | 1 | `PC_ANALYTICS_KV` KV |
| `POST /api/visit` presence-only | Always overwrites `present:{ipHash}` to refresh its 10-minute TTL. | 1 | `VISITS` KV |
| `POST /api/visit` committed visit | Presence overwrite + `log` + `count`, plus `firsts` only for a new type/country. | 3 (or 4) | `VISITS` KV |

`wrangler.toml` has KV bindings for `VISITS` and `PC_ANALYTICS_KV`, and external Durable Object bindings for `pointcast-presence` and `pointcast-drum`; it has no D1 binding. The existing `pointcast-drum` Worker already has a SQLite Durable Object migration for `DrumRoomV2`.

## Decision

Move the shared drum counter and per-session progress to a SQLite Durable Object in the existing `pointcast-drum` Worker. It returns the same JSON synchronously, but mirrors changed state to the legacy KV keys only after 15 seconds or 50 taps. This keeps the public top-ten reader and any direct KV maintenance path compatible while replacing write-per-tap behavior.

Restore route pageview measurement as an anonymous 1-in-10 sample. Each retained pageview carries `sampled: 10`; an isolate batches all retained analytics records for up to 10 seconds into one KV value. `scripts/score-live.mjs` expands the weighted records when building the project score inputs. There is no maintained register-scoreboard surface allowlist in this repository, so no unverified exception is applied.

Presence heartbeats now read their existing entry and only refresh the KV record when the visible identity changes or half of the presence TTL has elapsed. That preserves the 10-minute "here now" behavior while turning one-minute identical heartbeats into reads rather than writes.

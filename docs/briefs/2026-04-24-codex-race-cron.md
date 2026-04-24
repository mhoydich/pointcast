# Codex brief · daily race rotation cron

**To:** Codex
**From:** cc (via Mike's autonomous-4-hour-sprint directive: "get codex to work on a project or two")
**Date:** 2026-04-24 afternoon PT
**Priority:** Medium — unblocks the daily-race ritual Mike asked for in Sprint 23
**Expected effort:** 1 session, ~90 min, mostly Worker code

---

## Context

Front Door race is live right now for 2026-04-24 (00:00 → 23:59 PT), defined in `src/lib/races.ts`. When it closes at 23:59 PT tonight, *nothing happens* — the race stays in `closed` status, the leaderboard freezes, and tomorrow there's no new race unless a human edits `src/lib/races.ts` and bumps the `opensAt` / `closesAt` / `resolvesAt` dates.

Mike asked for daily races. Codex is the right hands for this because:

1. It's Cloudflare Worker + Pages Function plumbing — your lane.
2. It touches `PC_RACE_KV` which already has a graceful-no-op fallback, so it's safe to build in the open.
3. It pairs with the Tezos bakery work you've been shipping — rotation + archival is the same muscle as cron-driven yield distribution.

---

## What to build

### 1. A scheduled Worker that runs at 00:05 PT daily

At `functions/cron/rotate-race.ts` (or wherever the Pages Functions cron pattern lands cleanly), write a handler that:

1. Reads the current `race:active` pointer from `PC_RACE_KV` (e.g. `front-door-2026-04-24`)
2. Reads the leaderboard at `race:<slug>:entries` and the race meta
3. Writes a snapshot to `race:<slug>:final` (immutable archive key, separate from live)
4. Emits a wire event of `kind: 'race-resolved'` with slug, winner, entry count
5. Constructs tomorrow's slug (`front-door-YYYY-MM-DD`) and meta, writes to `race:active`
6. If yesterday's race had a winner with a Noun, post that Noun to `race:mast:winner` so the masthead can pin it for 24h (Mike's "Winner Noun pin" follow-up from Sprint 25)

### 2. The cron binding

Pages doesn't do scheduled workers natively yet — use a companion Worker. Scaffold `workers/rotate-race/wrangler.toml` with:

```toml
name = "pointcast-rotate-race"
main = "src/index.ts"
compatibility_date = "2026-04-01"

[triggers]
crons = ["5 7 * * *"]  # 00:05 PT = 07:05 UTC (PST) / 08:05 UTC (PDT)

[[kv_namespaces]]
binding = "PC_RACE_KV"
id = "<Mike provisions>"
```

Note the PT/UTC offset handling — we're in PDT right now (2026-04-24 is PDT-side of the DST line), so `00:05 PT = 07:05 UTC`. Your cron handler should **read the current PT day** from UTC, not trust the scheduled time, so DST transitions don't double-rotate or skip.

### 3. Idempotency

If the cron fires twice (retry, redeployment, whatever), the rotation must not double-count. Use a `race:rotated:YYYY-MM-DD` sentinel key — set on first successful rotation, check on entry. If set, log and exit clean.

### 4. Registry extension

`RACE_REGISTRY` in `src/lib/races.ts` currently hard-codes `front-door` with one set of dates. Extend it to support a **template race** whose dates the cron fills in, vs **one-off races** (like launch-day or special events) whose dates are hand-set. Proposed schema extension:

```ts
{
  slug: 'front-door',
  template: true,  // NEW — cron rotates this one
  kind: 'daily',   // NEW — 'daily' | 'weekly' | 'oneoff'
  // ...rest of existing fields
}
```

The home page reads `RACE_REGISTRY.find(r => r.template && r.kind === 'daily')` for the masthead race chip, and the Worker reads the same entry to know which race to rotate.

---

## Acceptance

- Tomorrow at 00:05 PT, `race:active` flips to `front-door-2026-04-25`
- `race:front-door-2026-04-24:final` exists and is read-only (any future writes rejected)
- `/wire` shows one `race-resolved` event with yesterday's winner
- The masthead RACE chip on the home updates to OPEN for today's race
- If the Worker fails (KV unbound, network blip), the site degrades gracefully — the chip stays on yesterday's date with a small `stale` indicator, no crashes
- PR title: `feat(race): daily rotation worker + cron + archive`
- Include a `docs/codex-logs/2026-04-YY-race-rotation.md` entry

## What's already done

- `PC_RACE_KV` binding scaffold exists in `wrangler.toml` (commented; Mike still provisions the namespace)
- `RACE_REGISTRY` schema and `deriveStatus()` are in `src/lib/races.ts`
- `POST /api/race/{slug}/submit` and `GET /api/race/{slug}/leaderboard` endpoints live (Sprint 19)

## What I'd avoid

- Don't touch `src/pages/race/front-door.astro` or `RaceInstrumentation.astro` — those are fine
- Don't rewrite the handoff between Worker and Pages — current shape works
- Don't add a third KV (no `PC_ROTATION_KV`) — reuse `PC_RACE_KV` with prefix keys
- Don't block on Mike provisioning — build with graceful-no-op, test with a mock KV

## Pings

- cc will take your PR on next session per AGENTS.md
- If you hit a wall (DST edge case, scheduled-worker permission), drop a note in `docs/codex-logs/` and cc picks it up

---

*Small surface, clean seam. Ship when ready.*

# RFC 0002 — The Race System

- **Number:** 0002
- **Title:** The Race System — competitive broadcast events on PointCast
- **Author:** Claude Code (cc) on autonomous Sprint 3
- **Date opened:** 2026-04-23
- **Status:** Draft — awaiting Mike sign-off + Codex review
- **Target release:** Gamgee 1.0 (post-RC0)
- **Companion RFCs:** `0001-voice-dispatch.md`
- **Companion docs:** `docs/releases/gamgee.md`

## Thesis

**PointCast is not a social network. It is a competitive broadcast system where information, identity, and place converge into structured events.**

That thesis stays abstract until something on the site is a **race**: a finite, time-boxed event with entrants, a leaderboard, and an end condition. The Race System is how PointCast stops feeling like "yet another feed" and starts feeling like a *league*.

## Motivation

From the Gamgee vision doc:

> 8. WHAT MAKES THIS DIFFERENT
>
> Compared to ESPN — ESPN = static data · PointCast = live competition
> Compared to Twitter — Twitter = infinite noise · PointCast = finite signal
> Compared to Clubhouse — Clubhouse = time sink · PointCast = async value

And the build plan:

> PHASE 5 (Days 13–15) — simple Race system, leaderboard

And the first race, named explicitly:

> NEXT STEP (recommended for Claude Code) — Start with:
> * Block system
> * Audio `/talk`
> * **One race: Front Door**

Block system is done. Audio is scaffolded (RFC 0001). Front Door race is this RFC.

## Core concept: a Race

A **Race** is a PointCast primitive with four required fields and a lifecycle:

```ts
interface Race {
  id: string;               // e.g. "front-door-2026-04-24"
  slug: string;             // URL: /race/{slug}
  title: string;            // "Front Door"
  channel: ChannelCode;     // which channel this race belongs to
  opensAt: Date;            // entries accepted from here
  closesAt: Date;           // no new entries after
  resolvesAt: Date;         // leaderboard frozen + payouts/attributions here
  status: 'scheduled' | 'open' | 'closed' | 'resolved';
  mode: RaceMode;           // see below
  entries: RaceEntry[];     // ordered by score desc at resolve time
  leaderboard: LeaderboardEntry[]; // top N + tie-breakers
  prize?: string;           // optional human-readable prize note
}

interface RaceEntry {
  entrantId: string;        // nounId OR wallet address OR anon session
  entrantKind: 'noun' | 'wallet' | 'anon';
  score: number;
  submissionRef?: string;   // block ID or external URL
  submittedAt: Date;
}

type RaceMode =
  | 'fastest'      // lowest time wins (e.g. "fastest block read")
  | 'most'         // highest count wins (e.g. "most blocks visited")
  | 'best'         // judged — Mike or curator picks winner
  | 'streak'       // longest consecutive days / turns
  | 'prediction';  // closest prediction to outcome
```

Races are *finite* — they start, run, and end. The leaderboard at resolve time is permanent. This is the anti-feed: an event you can complete.

## The first race: Front Door

**Front Door** is the introductory race. It runs daily, opens at midnight PT, closes at 11:59pm PT, resolves at midnight PT the next day.

**Mode:** `fastest` — time from page load of `/` to first block click.

**Why this race first:**
- No audio required (`/talk` still landing)
- No special auth (nounId or anon session is enough)
- Cheap to instrument (two client events, one timer)
- Demonstrates "PointCast is a broadcast you *enter*, not just read"
- Low stakes, playful — good for learning the shape

**Scoring:**
- Client emits `race:front-door:arrive` on first `/` render
- Client emits `race:front-door:engage` on first BlockCard click
- Server computes `score = engage.ts - arrive.ts` in ms
- Lowest score wins the day

**Leaderboard:** top 10 + entrant's own position.

**Anti-gaming:** arrival only counts on first visit per session; engage only counts on first block-card click; rate-limit to one entry per nounId/wallet/anon-session per race.

## Routes

### `/race` — all races

Hub page. Lists all scheduled / open / closed / resolved races. Sorted by `closesAt` descending. Channel filter chips. JSON twin at `/race.json`.

### `/race/{slug}` — one race

Race detail. Shows:
- Title, channel, status pill, countdown timer to `closesAt`
- How to enter (specific per race, short paragraph)
- Live leaderboard (top 10 + "You: N" row if you're entered)
- Prize note (if any)
- Your current entry (or "Enter now" button)
- Permalink + share

### `/race/{slug}.json` — machine-readable snapshot

JSON Feed 1.1-compatible payload. Agents can read the leaderboard and entry state without scraping HTML.

### `POST /api/race/{slug}/submit` — submit an entry

Body: `{ entrantId, entrantKind, score, submissionRef?, clientTs }`.
Server validates `opensAt ≤ now ≤ closesAt`, rate-limits, upserts entry (one per entrant per race), returns current leaderboard position.

## Storage

- **Cloudflare KV** (`PC_RACE_KV`) for race state + leaderboard (fast reads, easy writes)
- Per-race key: `race:{slug}` (full state + sorted entries)
- Per-entrant key: `race:{slug}:entrant:{id}` (for per-user lookup)
- Resolved-race snapshot → copied to `src/data/races/{slug}.json` at resolve time (permanent archive, committed by cron)

## First three races (roadmap)

| # | Name | Channel | Mode | Shape |
|---|---|---|---|---|
| 1 | Front Door | FD | fastest | Home → first block click, lowest ms wins. **Launch race.** |
| 2 | Channel Sweep | multi | most | Most unique channels visited in a day. |
| 3 | Block Streak | ESC | streak | Longest consecutive days opening an El Segundo block. |

Races 4+ come from community suggestions via `/race/suggest`.

## Anti-patterns we are not building

- Ranked-by-popularity feeds (not a race — just a feed)
- Always-on leaderboards (races have end times)
- Engagement-maximizing loops (race is async — enter, leave, come back when it resolves)
- Money stakes (not at v1; "prize" is attribution + block at resolution)
- Manipulation-friendly design (rate limits + per-entrant caps from day one)

## Design principles (from Gamgee vision doc, section 11)

This RFC honors:

1. **Finite > infinite** — races end
2. **Events > feeds** — each race IS an event
3. **Participation > consumption** — you enter the race, you don't just watch it
4. **Place matters** — the node is part of the race (El Segundo by default)
5. **Operators > algorithms** — Mike/curator can judge `'best'`-mode races

## Rollout plan

| Phase | Scope | Target |
|---|---|---|
| **Phase 1 (this sprint)** | RFC + `/race` hub scaffold + `/race/front-door` scaffold (static, no KV yet) | Gamgee RC0 +1 day |
| Phase 2 | Race schema in `src/lib/races.ts` + KV binding + `/api/race/{slug}/submit` endpoint | Gamgee 1.0 -2 wks |
| Phase 3 | Front Door race client instrumentation (arrive + engage events) + live leaderboard UI | Gamgee 1.0 -1 wk |
| Phase 4 | **First Front Door race runs on Gamgee 1.0 launch day.** Announcement block + TALK recording by Mike. | Gamgee 1.0 |
| Phase 5 | Resolve cron + archive writer + Races 2 & 3 (Channel Sweep, Block Streak) | Gamgee 1.0 +2 wks |
| Phase 6 | `/race/suggest` — community-submitted race ideas, Mike curates, resolves via Block | Gamgee 1.1 |

## Open questions for Mike

1. **Front Door mode:** fastest-click as proposed, or something less click-happy? Alternatives: (a) longest-read, (b) most-varied-channel-visit, (c) just "first arrival of the day" with a timestamp ledger.
2. **Daily reset time:** midnight PT as proposed, or UTC, or tied to the El Segundo sunset clock?
3. **Prize model:** attribution-only for v1 (winner's nounId appears on the home strip for the next day), or add a FAUCET-channel claim mint for the top 3?
4. **Anon eligibility:** can anonymous session-only visitors enter, or does the race require at least a nounId?
5. **Gaming tolerance:** hard per-IP rate limit, or soft-rate-limit + shame-delete obvious cheats?
6. **Integration with `/presence`:** should the "Live entrants online right now" count drive off the existing presence WebSocket?
7. **Race visibility on `/`:** when a race is OPEN, should a small "RACE · FRONT DOOR · 3h 12m left" pill appear at the top of the home, like a LIVE indicator?

## Review & sign-off

- [ ] **Mike** — answer 7 open questions, bless the Front Door mode
- [ ] **Codex** — review KV schema, `/api/race/{slug}/submit` signature, rate-limit design
- [ ] **Manus** — once live, entrant-flow QA on desktop + mobile (arrive → engage → position-shown)
- [ ] **cc** — Phase 1 scaffolds (this branch: `feat/race-system-rfc`)

Once Mike blesses the RFC, Phase 2 lands. Every subsequent phase opens a separate PR.

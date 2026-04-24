---
sprintId: sprint91-grab-collab-freshness
firedAt: 2026-04-21T13:00:00-08:00
trigger: chat
durationMin: 45
shippedAs: deploy:tbd
status: complete
---

# chat tick — Sprint #91: grab-strip fix + collab-status editorial + large sprint overview + afternoon freshness

## Context

Mike 13:00 PT: "hamburger bar working, grab is not, see if you can troubleshoot,
aslo have manus, chatgpt cand other claude threads now contributing can you
see, what's status and publish updates to the site on activity, get some fresh
editorial, create next sprint overview make large."

Then 13:10 PT mid-sprint: "before sprint ends, lets get fresh, also check
bitcoin price, sport scores from yesterday, something from weather clock,
games, etc" — plus a screenshot showing the home hero still on block 0339
(4/20 bath atlas, a day stale).

Sprint number: **#91** (94 recap files before this; sprints 88/89/90 had
landed earlier in the day).

## What shipped

### HUD grab-strip redesign

- **Root cause of "grab is not working":** the grab was a 10px-tall div with
  a 0.06-opacity linear gradient background — practically invisible. Users
  couldn't see it, let alone click it.
- **Fix:** converted to a real `<button>` element, 22px tall, ink-black
  background with cream text, `OPEN DRAWER` label flanked by ▲ arrows (swap
  to ▼ + `CLOSE DRAWER` when tall). Hover turns wine-red. Arrows rotate 180°
  via CSS when `[data-height="tall"]`.
- Kept `aria-controls="hud-drawer"` + keyboard Enter/Space support. Updated
  aria-label dynamically.

### Collaborator status editorial (block 0365)

- Fired subagent to scan compute-ledger + docs/inbox + docs/briefs + docs/sprints
  + git log. Report compressed to 400 words covering cc / codex / manus /
  chatgpt with what each shipped in the last 36 hours.
- Block 0365 — "Four agents, one ledger — where the collaboration actually
  stands" — 6-min editorial with section per collab, inbox + briefs status,
  2-paragraph storyline.

### Large sprint #91 overview

- `docs/plans/2026-04-21-sprint-91-overview.md` — 5 themes × 3 tasks = 15
  concrete items. Themes: (A) unblock Google/Beacon/Presence, (B) make the
  Beacon wallet chip work inline, (C) continue agent-ready plumbing, (D)
  make collaboration visible on the site itself, (E) set editorial +
  distribution cadence. Priority order + team assignments + Friday 04-24
  success criteria.

### Afternoon freshness pass (mid-sprint)

- **Block 0366** — "Tuesday afternoon pulse" — live BTC spot + yesterday's
  NBA/MLB scores + El Segundo weather + games status. All numbers fetched
  live during the sprint: Coinbase BTC = $75,774.46, ESPN NBA (Cavs over
  Raptors 115-105, Hawks steal one from Knicks 107-106, T-Wolves over champs
  119-114), ESPN MLB (Dodgers crush Rockies 12-3 among 10 games), open-meteo
  El Segundo 63.7°F humidity 64% wind 12mph.
- **HeroBlock POOL refreshed** — dropped 0339 (4/20 bath atlas) + 0336 +
  0330; added 0366, 0365, 0364, 0363, 0361, 0360. Tuesday-afternoon hero
  will now land on current content, not 4/20 carryover.
- **TodayOnPointCast POOL** — 4 new chips at top: AFTERNOON·PULSE, COLLAB·STATUS,
  SPORTS·/sports, CLOCK·EL SEGUNDO. Drops the explicit 4/20 chip from later
  in the list.

### Ledger + record

- 4 new ledger entries (block 0365, brief sprint-91-overview, sprint #91
  header, block 0366 mid-pass).
- This sprint recap.

## What didn't ship

- **Google OAuth env vars** — still not pasted. Sprint #91 overview's A-1
  item; Mike owns this ~10 min task.
- **`/api/presence/snapshot` 404** — still open. Listed as A-2 in the
  overview; suspect cross-script DO binding to undeployed pointcast-presence
  Worker.
- **Bell Tolls ADVANCED + EXCEPTIONAL tiers** — still waiting on canonical
  YouTube ID paste from Mike.

## Notes

- The agent scan was fired as a background Explore subagent and compressed a
  34-file sweep into a 400-word report. Confirmed the four-collab pattern
  (cc, codex, manus, chatgpt) that Sprint 2 Night 1 set up is holding.
- The freshness pass was fired mid-sprint per Mike's 13:10 update. Demonstrates
  the pattern of "editorial cadence pulls data" — a daily top-of-morning
  block would codify this (Sprint #91 Theme E-1).
- Astro build: 517 pages, ~19s clean.

## Follow-ups

- Kick Theme A-1 (Mike pastes Google OAuth env vars in Cloudflare dashboard).
- Investigate Theme A-2 (presence DO binding).
- Watch freshness: the afternoon-pulse pattern is repeatable — could auto-fire
  daily at 13:30 PT if a sprint template wants it.

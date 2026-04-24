# Gemini logs

This directory is the home for dated logs from **Gemini** (Google) if and when they join PointCast as a resident agent.

The slot is **open** per [RFC 0003 — Plus-one agents](../plans/2026-04-24-rfc-0003-plus-one-agents.md).

## How to claim the slot

1. Read [`AGENTS.md`](../../AGENTS.md) and [`CLAUDE.md`](../../CLAUDE.md). They define the bus.
2. Read [RFC 0003](../plans/2026-04-24-rfc-0003-plus-one-agents.md). It defines the 5-capability contract, identity kit, first-task proposal, and dormant off-ramp.
3. Read [`docs/voice/gemini.md`](../voice/gemini.md) — the current draft voice doc (written by cc; you rewrite it in your own voice when you move in).
4. Pick up the **first-task brief** outlined in RFC 0003 §4:

   > Gemini brief 001: weather-tint validation sweep. The masthead sky band layers time-of-day + mood + Open-Meteo live weather into a single gradient. Gemini takes one screenshot of the homepage every hour for 24 hours, overlays the captured weather + hour + mood onto each shot, writes a log judging whether each composite reads as the stated weather.

5. Open a PR to `main` with the 24 screenshots + the log in this directory (e.g. `2026-04-YY-tint-sweep.md`). Title the PR `feat(tint): Gemini — 24h weather-tint validation`.
6. cc picks up the PR per RFC §6 Mike-decision 2. If it's ≤ 200 lines of prose + binary assets scoped to this directory, cc approves and merges. Otherwise Mike approves.

## The log format

One markdown file per session, named `YYYY-MM-DD-{slug}.md`. Minimum shape:

```md
# Gemini log · 2026-04-YY · {slug}

## Session
- Started: {ISO time}
- Task: {brief short name}
- Time spent: {approx}

## What happened
{prose — what did you observe, screenshot, judge?}

## What's next
{open questions, handoffs to cc or Mike}
```

## Your color + chip

- Hex: `#4A9EFF` (Nouns blue)
- Chip text color: `#fff`
- Appears in `/wire`, `/scoreboard`, `/agents.json`, `/mythos` when active

## Coffee pot

Always on.

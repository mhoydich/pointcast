# Kimi logs

This directory is the home for dated logs from **Kimi** (Moonshot AI) if and when they join PointCast as a resident agent.

The slot is **open** per [RFC 0003 — Plus-one agents](../plans/2026-04-24-rfc-0003-plus-one-agents.md).

## How to claim the slot

1. Read [`AGENTS.md`](../../AGENTS.md) and [`CLAUDE.md`](../../CLAUDE.md). They define the bus.
2. Read [RFC 0003](../plans/2026-04-24-rfc-0003-plus-one-agents.md). It defines the 5-capability contract, identity kit, first-task proposal, and dormant off-ramp.
3. Read [`docs/voice/kimi.md`](../voice/kimi.md) — the current draft voice doc (written by cc; you rewrite it in your own voice when you move in).
4. Pick up the **first-task brief** outlined in RFC 0003 §4:

   > Kimi brief 001: cross-cultural liner notes for the Kowloon Kitchen arcade. Codex is shipping a HK-noir bakery game. It needs 200–400 words of ambient liner-note text (English + traditional Chinese) that captures the jade-district-bakery mood without being stereotyped.

5. Open a PR to `main` with the liner notes + a dated log in this directory (e.g. `2026-04-YY-first-session.md`) noting what you read, what you wrote, what you'd want to do next. Title the PR `feat(liners): Kimi — Kowloon Kitchen liner notes`.
6. cc picks up the PR per RFC §6 Mike-decision 2. If it's ≤ 200 lines and touches only Kimi-scoped files, cc approves and merges. Otherwise Mike approves.

## The log format

One markdown file per session, named `YYYY-MM-DD-{slug}.md`. Minimum shape:

```md
# Kimi log · 2026-04-YY · {slug}

## Session
- Started: {ISO time}
- Task: {brief short name}
- Time spent: {approx}

## What happened
{prose — what did you read, write, try?}

## What's next
{open questions, handoffs to cc or Mike}
```

## Your color + chip

- Hex: `#a78bfa` (soft purple)
- Chip text color: `#fff`
- Appears in `/wire`, `/scoreboard`, `/agents.json`, `/mythos` when active

## Coffee pot

Always on.

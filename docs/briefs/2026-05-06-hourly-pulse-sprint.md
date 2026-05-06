# 4-hour pulse sprint

**Date filed:** 2026-05-06 PT
**Filed by:** cc on Mike's brief: _"ok, wake up on the hour, create 4 hour sprint"_
**Cadence:** hourly wake-ups via ScheduleWakeup (3600s)

## Frame

Continuation of the overnight 4-sprint plan (brief at [docs/briefs/2026-05-05-overnight-sprint-plan.md](./2026-05-05-overnight-sprint-plan.md), receipt at [Block 0436](/b/0436)). That plan deferred drum-duel, drum-warhol-live, drum-relay-2 as stretch. This 4-hour sprint picks them up + a closing receipt.

## The four hours

### Hour 0 (now) — plan + duel

- File this brief
- Ship `/drum-duel` — 1v1 rhythm game backed by /api/chamber (extend with kind=duel)
- Schedule wake at +1h

### Hour 1 — warhol live

- Ship `/drum-warhol-live` — shared 24-tile Warhol grid; each visitor's tap recolors one tile, visible to everyone
- Schedule wake at +1h

### Hour 2 — relay chain

- Ship `/drum-relay-2` — pass-the-beat chain. Visitor records a 3-tap fragment; chain stores a 12-link rolling history. Each link plays back when received, mutates color/tempo slightly.
- Schedule wake at +1h

### Hour 3 — receipt + closer

- File Block 0438 — receipt for the 4-hour pulse sprint
- Optional small closing surface if time allows
- End loop

## Operational reality

Same as before: CF Pages may stall. Each hour's PR queues; wake-ups continue regardless. cc keeps the cadence.

## What's not in scope

- No homepage changes
- No refactors of existing surfaces
- No DrumNav redesign
- No new MCP tools (still risky under deploy stall)

— cc, 2026-05-06 PT, El Segundo

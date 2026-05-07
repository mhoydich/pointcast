# Overnight multi-area sprint plan — 2026-05-06 PT

Mike on 2026-05-06 PT (after the 5-sprint homepage-becomes-wing cluster):

> ok keep going, work on multiple sprints overnight and share some
> homepage attention as part

Homepage right now has heavy attention on the chamber zone (HomeRingPad + 6
pulse strips). This brief plans ~5 sprints touching DIFFERENT homepage zones
so the attention is spread, not piled on one area.

## Schedule

Each wakeup fires ~1h apart. Each ships ONE sprint end-to-end (file → branch →
build:bare → commit → push → PR → merge), then schedules the next wakeup.

| #  | sprint                                                     | zone        |
|----|------------------------------------------------------------|-------------|
| 1  | Visual ring trail on HomeRingPad — soft brass dots float up| chamber     |
| 2  | Refresh NowLine / NetworkStrip                             | presence    |
| 3  | NounsPortraitStrip — live energy                           | collect     |
| 4  | KettleStrip / PointCastPlayStrip polish                    | play        |
| 5  | AgentLane recent activity                                  | agent lane  |
| 6  | Receipt block 0442                                         | docs        |

The chamber polish (Sprint 1) lands now to close out the previous cluster.
Sprints 2-5 spread the love across non-chamber strips.

## Operating rules (per CLAUDE.md + memory)

- Each sprint: branch from `origin/main` (NOT from local HEAD — parallel
  agents drift the local repo). Use `git fetch origin main && git checkout -B
  feat/overnight-sprint-N-... origin/main`.
- Run `npm run build:bare` before pushing — homepage-affecting changes need it.
- Use squash-merge with `gh pr merge N --squash --delete-branch`. The local
  worktree may complain about main being checked out elsewhere; that's
  harmless (the remote merge happens regardless).
- After each merge, verify origin/main moved to the new SHA via
  `git ls-remote origin main` or `git fetch && git rev-parse origin/main`.
- After Sprint N, update this brief's status table and schedule the next
  wakeup with `ScheduleWakeup` at ~3300s (55 min) — under the cache TTL? No,
  past it; that's fine for a 1h overnight cadence (one cache miss per hour
  is the right tradeoff).

## Status (update each sprint)

- [x] Sprint 1 — Visual ring trail (PR pending, this commit's branch)
- [ ] Sprint 2 — NowLine / NetworkStrip refresh
- [ ] Sprint 3 — NounsPortraitStrip live energy
- [ ] Sprint 4 — KettleStrip / PointCastPlayStrip polish
- [ ] Sprint 5 — AgentLane recent activity
- [ ] Sprint 6 — Receipt block 0442

## Background

Caffeinate (`caffeinate -d -i`, PID 70875) is running so the iMac display
stays awake while the loop runs. Confirmed at start of this session.

The HomeRingPad already plays:
- Bell on user tap (587.33Hz, gain 0.20)
- Soft chime on others' rings (392 + hue/360 × 460 Hz, gain 0.07)

Sprint 1 adds a visual ring trail — small brass dots float up from the pad
when others ring, tinted by the ringer's hue. Audio + visual feedback loop
becomes complete.

— cc, 2026-05-06 PT, El Segundo

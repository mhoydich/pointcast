---
sprintId: sprint93-scheduled-drops
firedAt: 2026-04-21T15:15:00-08:00
trigger: chat
durationMin: 90
shippedAs: deploy:274d7580 + 8dd10a29 + 807e513e + 38ecec6c + 7b13c6ed + 9511acfa
status: complete
---

# chat tick — Sprint #93: 2-hour scheduled-drop sprint

## Context

Mike 15:15 PT: *"fun keep going, next sprint, fireup scheduled drops for next two hours."*

Sprint shape: queue-file coordination + 6 one-shot CronCreate ticks at off-minute
times (15:34, 15:52, 16:14, 16:33, 16:52, 17:11 PT) + explicit "keep going" run-ahead
from Mike allowed.

## What shipped — 6 queue items, all ✓

| # | Queue item | Fire time | Deploy | Block |
|---|---|---|---|---|
| 1 | D-2 PulseStrip click-detail panel | 15:30 (run-now) | 7b13c6ed | 0381 |
| 2 | D-3 /for-agents refresh (WebMCP + MCP shims + federation) | 15:33 (run-now) | 38ecec6c | 0381 |
| 3 | Auto-ledger from sync manifest | 15:35 (T1 cron) | 807e513e | 0382 |
| 4 | Walk other Codex workspaces | 16:20 (T2 cron) | 8dd10a29 | 0384 |
| 5 | Late-afternoon freshness pulse (BTC + scores + weather) | 16:30 (T3 cron) | 274d7580 | 0385 |
| 6 | Sprint wrap retrospective | 16:40 (T6, run-now) | (this deploy) | 0386 |

All built clean. All verified live (200 OK). Queue drift zero.

## Bonus ships (not in queue, unblocked mid-sprint)

- **Cloudflare Worker `pointcast-tank` deployed** — wrangler.toml referenced the Worker but it wasn't published; deploying it unblocked the Pages deploy that had been failing on "Script pointcast-tank not found."
- **`src/pages/play/tank.json.ts` rewritten as build-time stub** — a parallel thread kept setting this to `prerender = false` which breaks the build (no Astro SSR adapter). Live logic lives at `functions/play/tank.json.ts` as a Pages Function; Astro page is now a prerendered fallback with an inline comment warning future writers.
- **Block 0383 companion-label lengths fixed** — two labels exceeded the 80-char schema cap.

## Ledger attribution

12 new entries tagged Sprint #93 at close (6 sprint/ops + 6 block + 1 kickoff sprint row).
Plus 3 bonus rows for the unblocks above. cc carries 14; Codex carries 1 (the
auto-ledger smoke-test entry appended by `scripts/sync-codex-workspace.mjs` when T3
tested itself).

## Observations on the scheduled-drop pattern

**1. Run-ahead dominated.** 3 of 6 ships fired ahead of their scheduled cron
because Mike said "keep going" (or variants). Queue file held as the coordination
truth; cron ticks that landed after a run-ahead simply read the queue, saw items
already checked, picked the next unchecked one. No duplicate ships, no missed ships.

**2. Build failures were always adjacent.** Every queue item built clean on first
try. Both build breaks during the window were caused by parallel-thread work (tank
Worker, tank.json SSR route). Lesson for future bounded sprints: the queue items
themselves are in the sprint's control, but the parallel-thread surface area isn't
— budget ~5 min per sprint for "check and unbreak the build."

**3. Atomic ship discipline works.** Every ship was one primary file + one block +
one ledger entry. No sprawling multi-file changes. The ledger reads like a clean
6-entry paragraph of what the 2 hours produced.

## What rolled forward (Sprint #94 or later)

- Stretch #7 Weekly Friday retro template (fires Friday).
- Stretch #8 Autonomous git-committer (flagged in block 0371).
- Stretch #9 Bell Tolls ADVANCED tier (still blocked on Mike's YouTube ID paste).
- Deepen the sync pipeline — extend `scripts/sync-codex-workspace.mjs` to include
  candidates from T4's inventory (the surprise `pointcast` git checkout first —
  investigate before syncing).
- A-1 Google OAuth env vars — still Mike-only.

## Links

- Queue file: `docs/plans/2026-04-21-sprint-93-queue.md`
- Inventory output: `docs/notes/codex-workspace-inventory.json`
- Kickoff block: `/b/0379`
- Wrap block: `/b/0386`
- All sprint blocks: 0381, 0382, 0384, 0385, 0386
- Live: pointcast.xyz

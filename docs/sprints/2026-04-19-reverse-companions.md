---
sprintId: reverse-companions
firedAt: 2026-04-19T02:11:00-08:00
trigger: cron
durationMin: 17
shippedAs: deploy:b37709da
status: complete
---

# 2:11 tick — reverse-companions on the YeePlayer trio

## What shipped

The companions pattern, introduced in the 10pm bundle (sprint `10pm-bundle`), only flowed one direction: Block 0275 (Wild Mountain Honey · a Mike playlist) linked OUT to its four /yee children. The children themselves had no pointer back. A visitor landing on `/yee/0263` (November Rain) had no structural breadcrumb to the playlist they were playing inside of.

Fixed. Each of **0262**, **0263**, **0264** now carries a `companions` array pointing at:

1. **0275** — "Wild Mountain Honey · the playlist" (surface: block) — the named reverse-companion follow-up from 10pm-bundle.
2. The other two YeePlayer siblings in the same set (surface: yee) — so the subgraph is fully connected.

Now the four blocks form a proper cluster: you can enter at the playlist and move to any YeePlayer, OR enter at any YeePlayer and move either back to the playlist or across to a sibling.

## Why this (over the other options in the pool)

- **Mood primitive** touches `content.config.ts` — the known silent-revert-prone file. Any schema edit during an overnight cron tick is risky without Mike around to debug; saving for a daylight tick.
- **/drum Codex pass** requires Codex to actually run — not a one-cc-tick task.
- **/poll/es-name-drops leader writeup** requires checking live tallies; the poll has no KV traffic yet on this deployment.
- **Polls JUICE** is broad by definition; reverse-companions is a named, concrete, surgical win with zero-risk data-only edits.

## What didn't

- Block 0236 (Chakra tune-up, listed in 0275's companions) does not receive a back-pointer this tick. Reason: 0236 was authored before the YeePlayer set was named; linking it back risks rewriting its editorial frame. Deferred — if a later tick finds 0236 needs a touchup for other reasons, fold it in then.
- No visual change. The companions strip already renders on `/b/{id}` per the 10pm bundle; new links surface automatically.

## Notes

- Content.config.ts schema DID NOT change. Only three data files touched. Post-edit grep of `companions:` in content.config.ts confirms the field definition is still present (lines 123-128) — no silent revert to worry about.
- Build clean (188 pages), only the known benign "products/projects collection empty" warnings.
- Deploy URL: `https://b37709da.pointcast.pages.dev`
- Pattern to remember: when adding companions fields, the order should be (a) the most relevant cross-surface destination first, then (b) siblings. Labels follow `{name} · {what it is}` rhythm so the chip reads cleanly.

— cc, 2:28 PT

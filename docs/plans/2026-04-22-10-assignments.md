# Ten assignments · codex + manus · 2026-04-22

**Shape:** five for codex (code + technical writing), five for manus (distribution + activation). Claude is running coordination — reviewing outputs, unblocking, stitching.

**Why this split:** product surface is rich now (PointCast v2 + Sparrow v0.33 federation layer live). The bottleneck is reach. Eight of these ten assignments target that directly.

---

## Priority order

1. **codex-01** · resolve in-flight rebase on `feat/collab-clock` — **blocks everything else touching that branch**.
2. **codex-02** · Show HN draft — blocks manus-02 (launch exec).
3. **manus-01** · outreach list — runs in parallel with codex work.
4. **codex-03** · demo capture script — blocks manus-03 (tweet threads need visuals).
5. **codex-04** · `/sparrow/llms.txt` surfaces — small but ships reach to crawlers immediately.
6. **codex-05** · Nostr RFC-style post — inputs to manus-04 community cross-post.
7. **manus-02** · Show HN launch execution (waits on codex-02).
8. **manus-03** · five-thread tweet batch (waits on codex-03).
9. **manus-04** · seed-pubkey curation for `/sparrow/federation.json`.
10. **manus-05** · cultural-angle press pitch.

## Dependencies

```
codex-01 ──► everything else on feat/collab-clock
codex-02 ──► manus-02
codex-03 ──► manus-03
codex-05 ──► manus-04 (cross-post to Nostr)
```

## Status

| ID         | Title                                      | Owner | State    | Brief                                                   |
|------------|--------------------------------------------|-------|----------|---------------------------------------------------------|
| codex-01   | Resolve in-flight rebase                   | codex | assigned | `docs/briefs/2026-04-22-codex-resolve-rebase.md`        |
| codex-02   | Show HN draft + backup tweet thread        | codex | shipped  | `docs/outreach/2026-04-22-show-hn.md`                   |
| codex-03   | Demo capture script (federation surface)   | codex | assigned | `docs/briefs/2026-04-22-codex-demo-captures.md`         |
| codex-04   | `/sparrow/llms.txt` + `/federation-llms.txt` | codex | assigned | `docs/briefs/2026-04-22-codex-llms-surfaces.md`         |
| codex-05   | Nostr RFC-style post (kind-30078)          | codex | assigned | `docs/briefs/2026-04-22-codex-nostr-rfc.md`             |
| manus-01   | 20-person outreach list                    | manus | assigned | `docs/briefs/2026-04-22-manus-outreach-list.md`         |
| manus-02   | Show HN launch execution + 24h monitoring  | manus | assigned | `docs/briefs/2026-04-22-manus-hn-launch.md`             |
| manus-03   | Five tweet threads (batch)                 | manus | assigned | `docs/briefs/2026-04-22-manus-tweet-threads.md`         |
| manus-04   | Seed-pubkey curation (15 entries)          | manus | assigned | `docs/briefs/2026-04-22-manus-seed-pubkeys.md`          |
| manus-05   | Cultural-angle press pitch                 | manus | assigned | `docs/briefs/2026-04-22-manus-press-pitch.md`           |

## Running the show (Claude's role)

- **On landing:** review each output against the brief. Flag anything off-spec; request revisions.
- **Cross-task stitching:** feed codex-02's HN draft into manus-02's launch checklist; codex-03's recordings into manus-03's threads; codex-05's RFC into manus-04's Nostr cross-post.
- **Status updates:** append to this file under each task row: `shipped`, `in-review`, `blocked`.
- **Cron behavior:** the 15-min engineering loop is OFF. Re-enable only on explicit request.

## What success looks like in 48h

- Rebase resolved; `feat/collab-clock` linearized.
- Show HN post live on the front page long enough to generate ≥50 real visitor sessions.
- Five tweet threads queued, first one live.
- 10+ of 20 outreach DMs sent; ≥2 responses.
- `/sparrow/federation.json` curated to 10-15 pubkeys with notes.
- At least one press pitch sent; reply threaded to this file.

If reach doesn't move at all in 72h, the problem isn't tactical — regroup on positioning.

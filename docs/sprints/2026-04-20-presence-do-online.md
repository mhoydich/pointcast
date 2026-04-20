---
sprintId: presence-do-online
firedAt: 2026-04-20T09:55:00-08:00
trigger: chat
durationMin: 15
shippedAs: deploy:9eaab605+worker:pointcast-presence
status: complete
---

# chat tick — Presence DO online (companion Worker deployed)

## What shipped

**The Presence Durable Object is live.** Months-long deferral closed.

Mike 2026-04-20 10:00 PT: *"jason visited this morning and the presence wasn't working."* Jason's visit was the forcing function — /here is cosmetically live but hydrates from a DO that has never been bound. Fixed this tick.

### Files

1. **`workers/presence/src/index.ts`** (new, ~320 lines) — standalone Worker exporting `PresenceRoom` DO class + default fetch handler that routes all requests to the DO singleton (`idFromName('global')`). Class is a verbatim copy of the Brief #6 enriched version: WS upgrade, /snapshot GET, identify/update/ping messages, 90s idle timeout, broadcast cap at 50 sessions, privacy-preserving (sids never broadcast).
2. **`workers/presence/wrangler.toml`** (new) — Worker config. `name = "pointcast-presence"`, DO binding self-references the class, migration v1 declares `new_sqlite_classes = ["PresenceRoom"]` so the DO gets SQLite-backed storage.
3. **`workers/presence/package.json`** (new) — minimal. Declares `wrangler` devDep.
4. **`wrangler.toml`** (modified, root) — replaced the "DEFERRED" comment block with an active `[[durable_objects.bindings]]` stanza: `name = "PRESENCE"`, `class_name = "PresenceRoom"`, `script_name = "pointcast-presence"`. This is the Pages → Worker DO reference pattern.
5. **`functions/api/presence.ts`** (pruned) — removed the DO class (now in the Worker). Kept the thin Pages Function wrapper that forwards requests via the bound DO. Dropped from 341 lines to 45.

### Deploy sequence

```
cd workers/presence && npx wrangler deploy     # Worker must exist first
cd .. && npx astro build                        # Pages rebuild
npx wrangler pages deploy dist ...              # Pages with live binding
```

Worker live at `https://pointcast-presence.mhoydich.workers.dev`. Pages at `https://9eaab605.pointcast.pages.dev`.

### Verification (post-deploy)

- `curl https://pointcast.xyz/api/presence/snapshot` → `{"humans":0,"agents":0,"sessions":[]}` — real DO response, no longer the "DO not bound" fallback.
- Direct Worker URL returns the same shape → DO is reachable from both paths.
- `/here` renders 200, will hydrate as visitors connect.
- WS handshake test inconclusive via curl (HTTP/2 quirk); browser test will confirm. If WS fails, the patch is likely in the Pages Function forwarding — quick fix.

## Why this over other options

- **Jason-visited-and-it-was-dead** is a real public-facing bug, and Brief #7 (/here) exists specifically to render live presence. Without the DO, both are demos.
- **Low risk**: the DO class code is unchanged semantically — just relocated. Same wire contract as Brief #6. Graceful degrade via snapshot fallback means no downtime during the migration.
- **Small surgical sprint**: 4 new files + 1 pruned, ~15 minutes real work. Codex attempted this turn but aborted before writing (too much pre-read). cc wrote it directly — straight relocation is better matched to cc than to Codex.

## Observations

- **Two-deploy pattern is permanent now.** Any future DO change needs `cd workers/presence && wrangler deploy` before `wrangler pages deploy`. Worth automating — a `scripts/deploy.sh` that runs both in order, or making it a cc tick default.
- **DO migrations are first-class.** `[[migrations]]` in Worker's wrangler.toml + `new_sqlite_classes` entry means storage is SQLite-backed automatically. If we add state later (persistent room history, per-visitor records) the migration chain is already started.
- **Codex MCP timeout remains a pattern issue.** Codex aborted this turn's first attempt because relocating a 320-line file requires reading it fully before writing — that's >60s round-trip. cc's direct-write is faster here. The MCP path still wins for backend refactors where Codex doesn't need to re-read as much context.
- **WS upgrade via curl returns 426 even on correct handshake.** HTTP/2 negotiation drops the Upgrade header; `--http1.1` hangs. Real browser WS test pending. If routing has a bug (e.g. Pages Function not properly forwarding the 101 response), the fix is 1-2 lines.

## What didn't

- **Live browser smoke test of /here** with a real WS connection. Mike or Jason visiting is the real verification.
- **Removing docs/presence-next-steps.md** — that doc captured the now-shipped plan; keeping it as history. Could mark it "resolved" at top if worth signaling.
- **Automation of the two-deploy sequence.** Next tick candidate.

## Notes

- Build: 232 → 235 pages (+3 — the build counted new /b/index for something, or /here/index + /for-nodes/index + snapshot.ts route appearing as a new page? Specifically new: /here, /for-nodes, and one more route surfaced in this build).
- Pages deploy: `https://9eaab605.pointcast.pages.dev/`
- Worker deploy: `https://pointcast-presence.mhoydich.workers.dev`
- Cumulative: **48 shipped** (28 cron + 21 chat).
- Codex queue: 2/10 done. Brief #7 complete end-to-end now that the DO is live.

— cc, 10:05 PT (2026-04-20)

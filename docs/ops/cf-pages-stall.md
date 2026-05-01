# Runbook — Cloudflare Pages deploy stall

**Status:** Operational workaround. Root-cause investigation is parked
under [docs/briefs/2026-04-30-codex-cf-pages-stall.md](../briefs/2026-04-30-codex-cf-pages-stall.md).

**When to use this runbook:** new merges to `main` aren't visible at
pointcast.xyz after ≥10 minutes. Symptom: `/b/{newest-id}/` returns 404
while older paths still serve.

---

## 1. Confirm it's a stall (60 sec)

```bash
# Should return the most recent commit's approximate time. If it's
# minutes-to-hours behind HEAD's commit time, you've got a stall.
curl -sS https://pointcast.xyz/agents.json | jq -r .generatedAt
git log origin/main --pretty=format:"%ai %h %s" -1

# Cache-bust to rule out CF edge cache:
curl -sS "https://pointcast.xyz/agents.json?t=$(date +%s)" | jq -r .generatedAt
```

If both return the same stale `generatedAt`, the deploy itself is
wedged — not a cache layer.

A second confirmation: pick the highest-numbered Block in
`src/content/blocks/` and check `/b/{id}/`. If it's 404 and
`agents.json` is stale, you're stalled.

## 2. Trigger a fresh build (the manual workaround)

Mike has been doing this from the dashboard ~10x/day. Two ways:

### A. Cloudflare Pages dashboard (Mike-only — needs login)

1. Open the Cloudflare dashboard → `pointcast` project → Deployments
2. Find the most-recent failed/cancelled/queued deploy
3. Click **Retry deployment**
4. Watch it build (~30-60s); confirm new `generatedAt` once it lands

### B. Kick commit (any agent can do this)

A tiny no-op commit to `main` re-fires the webhook:

```bash
# From a worktree off origin/main:
echo "" >> docs/ops/.kick     # any tiny mutation
git add docs/ops/.kick
git commit -m "chore(ops): kick CF Pages — deploy stall workaround"
git push
gh pr create --title "..." --body "..." # if branch protection requires PR
```

Or merge a real PR — when there's actual work queued, the merge serves
as the kick.

## 3. Verify (90 sec)

After the deploy fires:

```bash
# generatedAt should advance
curl -sS https://pointcast.xyz/agents.json | jq -r .generatedAt

# pick the highest block id and verify
LATEST=$(ls src/content/blocks | sort -r | head -1 | sed 's/.json//')
curl -sLI -o /dev/null -w "%{http_code}\n" "https://pointcast.xyz/b/${LATEST}/"
```

Both should be current.

## 4. If it's still stuck (escalation)

In escalating order:

1. **Check the CF Pages dashboard for build logs.** Each stalled deploy
   has a status. If they're all **failing** (not just queued), there's
   a real build error.
2. **Local build:** `npm run build:bare`. If it fails, the issue is
   code, not infrastructure — fix the code.
3. **Look for parallel-agent burst.** `git log origin/main --since="2 hours
   ago" --oneline | wc -l` — if >5, we're seeing the build-queue
   contention pattern. Wait, then kick.
4. **Check CF Pages build minutes for the month** in the dashboard.
   If we've blown past the soft cap on the free plan, builds get
   throttled.
5. **Diff a recent successful deploy's build log against a stalled one**
   — env vars, dep versions, build duration. The diff usually reveals
   the trigger.

## Preventive measures (low-cost)

- **Don't merge bursts.** When several PRs are ready at once, batch
  them with ~2 minutes between merges.
- **Watch `agents.json` after every merge** for ~5 min. If it doesn't
  advance, kick immediately rather than letting a queue build up.
- **Mark Block-publishing PRs separately from code PRs** in commit
  messages. If a stall happens, the most user-visible loss (a Block
  not appearing) is the most urgent to escalate.

## Pattern observed (data through 2026-04-30)

| Burst size (PRs in <30 min) | Stall outcome                  |
|----------------------------:|--------------------------------|
| 1                           | Self-resolves in <5 min        |
| 2-3                         | Self-resolves in 5-15 min      |
| 4+                          | Manual kick required           |
| 9 (recorded high)           | Manual kick required, multiple |

The overnight 2026-04-30 batch was 10 PRs in ~6 hours and triggered
the stall that is currently being recovered as this runbook lands.

---

*Filed by cc 2026-05-01 morning PT after the overnight payments-arc batch
left `/b/0415` through `/b/0419` 404'd while their JSONs were on `main`.*

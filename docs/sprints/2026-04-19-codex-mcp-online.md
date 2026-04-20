---
sprintId: codex-mcp-online
firedAt: 2026-04-20T09:20:00-08:00
trigger: chat
durationMin: 0
shippedAs: in-progress
status: in-progress
---

# chat tick — Codex MCP integration online · Brief #7 fired programmatically

## What shipped

**The integration itself.** Claude Code now talks to Codex via MCP stdio. No more computer-use dialog approvals, no more desktop-app clicks. cc fires `mcp__codex__codex` with prompt + cwd + sandbox + approval-policy; Codex runs the task; cc continues with `mcp__codex__codex-reply` against the threadId.

### The config change

One file: `~/Library/Application Support/Claude/claude_desktop_config.json`. Previously had only `preferences`. Added alongside:

```json
"mcpServers": {
  "codex": {
    "command": "/Users/michaelhoydich/.npm-global/bin/codex",
    "args": ["mcp-server"]
  }
}
```

Mike Cmd+Q'd and relaunched Claude. On session restart, `mcp__codex__codex` and `mcp__codex__codex-reply` appeared in the deferred tool list. Backup saved at `claude_desktop_config.json.backup-1776701866` for easy rollback.

### What got set up on Codex side (verified pre-config)

- Codex CLI v0.121.0 installed at `/Users/michaelhoydich/.npm-global/bin/codex`
- `codex mcp-server --help` prints valid stdio-server usage
- `~/.codex/config.toml` already trusts `/Users/michaelhoydich/pointcast` as a project
- `~/.codex/auth.json` populated (logged in)
- Model: `gpt-5.4` with `xhigh` reasoning effort (in config.toml)

### The first two test calls

**Probe call** (`sandbox: read-only`, `approval-policy: never`, `model_reasoning_effort: low`): asked Codex for cwd + git branch in one sentence. Returned `threadId` 019dabb3-3803-7623-a783-161d049bf82e + correct answer. MCP stdio roundtrip confirmed.

**Plan call** (via `codex-reply` on same thread, `model_reasoning_effort: medium`): handed Codex Brief #7 (`/here` congregation page), asked for implementation plan without writing files. Codex responded with a 5-file plan, cc's 3 open-question answers inline, estimated complexity medium.

**Implementation call** (new session, `sandbox: workspace-write`, `approval-policy: never`, `model_reasoning_effort: medium`): fed Codex the plan back plus cc's answers, asked for full implementation in one turn. **MCP request timed out at ~60s** — but Codex keeps running on the stdio subprocess after the MCP message deadline. Session log at `~/.codex/sessions/2026/04/20/rollout-2026-04-20T09-24-11-019dabb4-*.jsonl` confirms active file reads (VisitorHereStrip.astro etc.).

## Observations

- **MCP timeout is shorter than big-task Codex runs.** xhigh reasoning + big prompts exceed the default. Working pattern: reduce reasoning via `config: {model_reasoning_effort: "medium"}`, AND/OR break work into small checkpointed turns. Even on timeout the subprocess keeps executing; Codex session logs can be tailed for progress; threadId can be reconnected.
- **Parallelism unlocked.** Subsequent Codex briefs could fire concurrently (multiple stdio sessions). Manual pattern was sequential via one desktop app window; MCP pattern permits fan-out. Not exercising that yet — one brief at a time for now while pattern stabilizes.
- **`approval-policy: never` + `sandbox: workspace-write`** is the auto-apply combo. Codex writes without asking. cc reviews via git diff after the session completes or via monitor on session log.
- **Whimsical extension** is broken (bridge on localhost:21190 never came up because Whimsical desktop app isn't installed). Flagged to Mike; awaiting his call on uninstall vs reinstall. Not related to Codex integration.

## Why this matters

Three ticks ago cc was approving Codex dialogs via computer-use, one file at a time, with 2-3s latency per click. Ten Codex briefs at that cadence would be days of compute-bound orchestration. The MCP path compresses approval overhead to zero, lets cc fire and continue, and opens parallel work.

This is the programmatic development pipeline Mike asked about yesterday: *"how do you set up a proper mcp or programmatic connection."* Answer: `codex mcp-server`, one config-file entry, one Claude restart.

## What didn't (yet)

- **Brief #7 ship.** In flight — Codex session 019dabb4 writing files now. Retro will be updated when Codex returns `status: ready for cc build + deploy` and cc has deployed. Expected within 10-15 min.
- **Test parallel Codex briefs.** Single-file-line still for safety.
- **Whimsical fix** — awaiting Mike's decision.

## Notes

- Chat-fired tick; not a scheduled cron.
- Tick budget: open — stays in-flight until Codex completes Brief #7, at which point I'll finish the retro + ship.
- Codex queue now 2/10 done, 1 in flight (Brief #7).
- Cumulative before this tick: 46 shipped (28 cron + 19 chat). MCP-online counts as the 20th chat ship once Brief #7 deploys.

— cc, 09:30 PT (2026-04-20)

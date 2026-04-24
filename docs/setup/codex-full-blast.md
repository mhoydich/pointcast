# Codex full-blast setup (ChatGPT Max → Claude Code MCP)

**Source:** Mike 2026-04-20 19:10 PT chat, pasted from OpenAI docs + Cowork setup guide.

**Purpose:** Let Claude Code (local CLI) drive Codex on Mike's ChatGPT Max quota instead of per-session MCP wiring. After setup: every Codex call from any Claude Code session inherits high-reasoning + workspace-write defaults. Usage bills to ChatGPT Max, not Claude budget.

---

## 1. Install Codex CLI

```bash
npm install -g @openai/codex
# or: brew install --cask codex
```

## 2. Log in with ChatGPT Max account (NOT an API key)

```bash
codex
```

Opens browser for OAuth. Sign in with the ChatGPT account that has Max. Token cached at `~/.codex/`, shared with VS Code extension.

Max users get $50 one-time API credits on first login (30-day expiry; bonus).

## 3. Wire Codex into Claude Code as an MCP server

Shortest path — CLI:

```bash
claude mcp add codex -- codex mcp
```

Or edit `~/.claude/settings.json` for more control:

```json
{
  "mcpServers": {
    "codex": {
      "command": "codex",
      "args": [
        "mcp",
        "-c", "model=gpt-5-codex",
        "-c", "model_reasoning_effort=high",
        "-c", "sandbox_mode=workspace-write",
        "-c", "approval_policy=on-request"
      ]
    }
  }
}
```

Restart Claude Code. Run `/mcp` inside — should see `codex` listed with `codex` + `codex-reply` tools.

## 4. Full-blast config

Flags that matter:

- `model=gpt-5-codex` — Codex-tuned GPT-5 variant, best coding perf.
- `model_reasoning_effort=high` (or `xhigh` if available) — longer thinking, deeper passes. **This is the fix for the low-reasoning 60s MCP timeouts we hit in Cowork tonight.**
- `approval_policy=never` + `sandbox_mode=danger-full-access` — zero-prompt autonomy. Only for code you're willing to let it freely edit/run.
- Shorthand for the above: `--dangerously-bypass-approvals-and-sandbox` ("yolo" mode).
- Safer middle: `--full-auto` (workspace-write sandbox, network off, no prompts inside sandbox).

Set defaults in `~/.codex/config.toml`:

```toml
model = "gpt-5-codex"
model_reasoning_effort = "high"
approval_policy = "on-request"
sandbox_mode = "workspace-write"
```

## 5. Verify

In Claude Code:

> Use the codex MCP to review `src/foo.ts` and propose a refactor. Pass it the file contents and come back with its diff.

Should see `mcp__codex__codex` call + structured output. If errors: `codex mcp` manually in terminal — if that hangs, auth/install issue not Claude Code.

---

## Relationship to this Cowork session

- Cowork already has `mcp__codex__codex` + `mcp__codex__codex-reply` pre-wired.
- Tonight (2026-04-20), two Codex MCP calls timed out at 60s but Codex actually completed the work server-side; files landed (PrizeCastChip.astro was the proof).
- Takeaway for any cc session using MCP Codex: **do not trust MCP return code**. Fire the call, check filesystem for expected output regardless of MCP response.
- Once Mike runs this setup locally + reasoning-effort is `high`, the timeout issue should go away entirely — complex briefs will complete within the MCP budget.

## When to use what

- **cc direct** — anything visitor-facing or small enough to write fast. Cheapest.
- **Codex MCP (current Cowork)** — atomic single-file components with clear specs. Proven working tonight despite MCP timeouts.
- **Codex CLI (local, via this setup)** — longer refactors, multi-file work, independent sessions. Bills to ChatGPT Max.
- **Codex via `codex` in separate terminal** — when Mike wants Codex driving a whole session, not as a sub-agent. Use a git worktree so it doesn't stomp on cc.

## Sources

- https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
- https://developers.openai.com/codex/auth
- https://developers.openai.com/codex/mcp
- https://developers.openai.com/codex/cli/reference
- https://github.com/openai/codex/blob/main/docs/config.md

— cc, 19:15 PT (2026-04-20) · saved here so future cc sessions find it on session-start read

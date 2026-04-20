# Codex MCP integration — programmatic connection for PointCast

**Audience:** Mike, executing setup. cc can operate once setup is done.

**Context:** Mike 2026-04-19 22:32 PT: *"how do you set up a proper mcp or programmatic connection"* — question after observing that managing Codex via the desktop app + computer-use is manual and slow.

**Answer:** Codex CLI ships with built-in MCP server capability. Run `codex mcp-server` and cc can talk to Codex via MCP tool calls — same way cc talks to Slack, Chrome, Jira, etc.

---

## Three integration paths

### Path 1 — Codex MCP server (recommended)

The Codex CLI already installed at `/Users/michaelhoydich/.npm-global/bin/codex` includes a `mcp-server` subcommand. It starts Codex as a stdio MCP server.

**Setup in Claude Code:**

1. Confirm CLI is working:
   ```bash
   codex --version
   codex mcp-server --help
   ```

2. Confirm login to OpenAI:
   ```bash
   codex login
   ```
   (may prompt for auth if not already logged in)

3. Add to cc's MCP config (`.claude/mcp-servers.json` or equivalent):
   ```json
   {
     "codex": {
       "command": "codex",
       "args": ["mcp-server"],
       "type": "stdio"
     }
   }
   ```
   Actual path may vary — consult your Claude Code MCP docs for the exact config file location.

4. Restart cc session. Codex tools appear as `mcp__codex__*` alongside other MCP tools.

**Once connected, cc can:**
- `mcp__codex__exec` — run a task non-interactively
- `mcp__codex__review` — run a code review
- `mcp__codex__status` — check if Codex is mid-task
- (Exact tool names depend on what `codex mcp-server` exposes — first MCP call should enumerate them)

**Benefit:** No more computer-use clicks. cc queues Codex tasks programmatically. Same way cc ships to Cloudflare Pages now.

### Path 2 — Codex CLI exec (non-MCP, simpler)

Skip MCP entirely; just invoke `codex exec` from Bash.

```bash
codex exec --file docs/briefs/2026-04-19-codex-tv-stations.md
# or
codex exec "read docs/briefs/2026-04-19-codex-presence-do-upgrade.md and execute it"
```

cc can run these via the Bash tool. Output lands on disk; cc verifies.

**Setup:** none beyond `codex login`. Works today.

**Limitation:** No status polling. cc can't check "is Codex busy" without reading filesystem artifacts.

### Path 3 — OpenAI API direct (full control, most work)

Use the OpenAI SDK with the `gpt-5-codex` model (or equivalent). cc constructs prompts + receives responses programmatically.

**Trade-off:** Full API control but lose the Codex agent's built-in tooling (file editing, command execution, etc.). cc would have to rebuild the agent loop.

**Not recommended** unless Mike needs very custom behavior.

---

## Recommended setup (30 min, one-time)

1. **Verify CLI**: `codex --version && codex exec --help`
2. **Login**: `codex login` (opens browser)
3. **Test exec**: `codex exec "print hello"` — confirm you get a response
4. **Add to cc MCP config**: path 1 above
5. **Restart cc session** — cc sees `mcp__codex__*` tools
6. **First MCP task**: cc kicks off one of the pending briefs via MCP, monitors via `mcp__codex__status`, merges when done

After this, the manual "open Codex app → type prompt → approve dialogs" loop disappears. cc queues tasks programmatically and moves on.

---

## Project-workspace concern

The Codex desktop app ties "Projects" to specific directories. The CLI may or may not respect those project bindings — needs testing.

**Check:**
```bash
cd /Users/michaelhoydich/pointcast
codex exec "what directory am I working in? list files in docs/briefs/"
```

If the CLI respects `cwd`, point it at `/Users/michaelhoydich/pointcast` and it'll work on the correct repo. If not, Codex config has a `working_dir` or `project` flag.

---

## What cc can do after setup

- **Queue briefs programmatically** — `mcp__codex__exec({ file: 'docs/briefs/...' })` per tick
- **Check status** — `mcp__codex__status()` polled during ticks
- **Parallel briefs** — kick multiple Codex tasks concurrently (tier-permitting)
- **Auto-approve writes** — configurable via `-c approvals.auto=true` or similar flag
- **Retro-fire** — on Codex task completion, cc auto-writes a sprint retro

This is the architecture Mike's "proper programmatic connection" was asking about. Codex CLI + MCP = done.

---

## Open questions

- Does `codex mcp-server` work on macOS without elevated permissions?
- Does `codex exec` inherit the desktop app's project config, or is it separate?
- Are there rate limits on the CLI that differ from the desktop app?

cc can answer these by running the setup itself once Mike greenlights + ensures `codex login` is active.

---

Filed by cc, 2026-04-19 22:40 PT. Not a Codex brief — a Mike-setup playbook.

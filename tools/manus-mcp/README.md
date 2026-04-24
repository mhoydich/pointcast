# manus-mcp

A minimal MCP stdio server that wraps the Manus REST API. Exposes `manus_run_task` + `manus_task_status` as MCP tools so Claude Code can delegate to Manus on your Manus credit budget.

Ships as part of the pointcast.xyz repo; lives here so it's version-controlled + shareable. No npm dependencies — hand-rolled JSON-RPC 2.0 over stdio. Node 20+.

## Install

```bash
# From repo root:
cd tools/manus-mcp
chmod +x index.js

# Get API key: manus.im → Settings → API
export MANUS_API_KEY=sk-...

# Optional tuning:
export MANUS_AGENT_DEFAULT=manus-1.6-max     # default
export MANUS_POLL_INTERVAL_MS=3000            # default
export MANUS_MAX_POLL_SEC=600                 # default (10 min)

# Wire into Claude Code:
claude mcp add manus -e MANUS_API_KEY=$MANUS_API_KEY -- node /absolute/path/to/tools/manus-mcp/index.js

# Restart Claude Code
# Inside Claude Code, run:  /mcp
# You should see `manus` listed with two tools: manus_run_task + manus_task_status
```

## Env vars

| Var | Default | Purpose |
|---|---|---|
| `MANUS_API_KEY` | *(required)* | Your Manus API key |
| `MANUS_BASE_URL` | `https://api.manus.ai` | Override for self-hosted / staging / v2 prefix changes |
| `MANUS_AGENT_DEFAULT` | `manus-1.6-max` | Agent profile used when `agent` arg isn't passed |
| `MANUS_POLL_INTERVAL_MS` | `3000` | How often to poll task status |
| `MANUS_MAX_POLL_SEC` | `600` | Max wait before returning partial state |
| `MANUS_CREATE_PATH` | `/v2/tasks` | POST path for task creation |
| `MANUS_STATUS_PATH_TPL` | `/v2/tasks/{id}` | GET path template for status; `{id}` is replaced |
| `MANUS_AUTH_SCHEME` | `Bearer` | Auth header scheme. Set to `X-API-Key` to send as a header instead of `Authorization: Bearer …` |

**Path defaults are guesses** based on the public intro at `https://manus.im/docs/integrations/manus-api` and `https://api.manus.ai` (which describes the `{ ok, request_id, … }` envelope). If Manus uses different endpoint paths, override via the env vars above — no code change needed.

## Tools

### `manus_run_task`

Creates a task, polls until done, returns final result.

**Input:**
```json
{
  "prompt": "Research the current state of El Segundo's hemp-THC beverage distribution and return a markdown summary with 5 sources.",
  "files": ["optional-file-id-or-url"],
  "agent": "manus-1.6-max",
  "poll_timeout_sec": 600
}
```

**Returns:** `{ ok, task_id, status, result: {...full Manus response...} }`

If polling times out before terminal state, returns `{ ok: false, task_id, status: "running", note: "use manus_task_status" }` so you can check in later.

### `manus_task_status`

Check a task already in flight.

**Input:** `{ "task_id": "..." }`

**Returns:** `{ ok, task_id, status, raw: {...Manus response...} }`

## When to use Manus vs. Codex vs. cc

- **cc** — anything visitor-facing or small. Cheapest per minute.
- **Codex** — atomic single-file code specs. Proven reliable at low reasoning effort.
- **Manus** — long-horizon research, file-producing, web automation, tasks where the browser sandbox is actually the moat. Pay per credit, so be deliberate about what you hand it.

Pattern: Claude Code as orchestrator; delegate based on job shape.

## Debugging

Startup log goes to stderr (so it doesn't pollute the stdio JSON-RPC channel). Look for:

```
[manus-mcp] ready · base=https://api.manus.ai · agent=manus-1.6-max · poll=3000ms×600s · auth=Bearer · key-set
```

If you see `· KEY-MISSING`, `MANUS_API_KEY` didn't get through. Double-check the `-e` flag in your `claude mcp add` command.

If a task create returns 2xx but no task_id, the endpoint path or response shape is different from the defaults — check `MANUS_CREATE_PATH` and the Manus API docs for the actual JSON response envelope; the response is included in the error return.

## Future

- Webhook support (skip polling by registering a webhook on task create)
- File upload helper for attaching local files
- Streaming partial-output tool
- Prompt templates for repeated task shapes

Ship as needed.

— cc, 2026-04-20 · `tools/manus-mcp/` lives with the pointcast repo

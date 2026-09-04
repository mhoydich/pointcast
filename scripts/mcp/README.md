# pointcast-plates MCP server

A local stdio MCP server (`scripts/mcp/plates.mjs`) that lets a Claude Code
or Codex session on Mike's machine generate poster "plates" with OpenAI's
image model and write them straight into `public/images/` in this repo, plus
hand off repo edits to the `codex` CLI when needed.

Plain ESM JavaScript, no TypeScript, no build step. Run directly with:

```sh
node scripts/mcp/plates.mjs
```

(normally you don't run it by hand — your MCP client spawns it for you.)

## Tools

- **`plate_generate`** — calls `POST https://api.openai.com/v1/images/generations`
  (model `gpt-image-1` by default) and writes the PNG to a repo-relative
  path under `public/images/`. Inputs: `prompt`, `out` (`.png` path),
  `aspect` (`portrait` | `square` | `landscape`, default `portrait`),
  `model` (default `gpt-image-1`), `quality` (`low` | `medium` | `high`,
  default `high`), `webp` (default `true` — also writes a `.webp` twin at
  quality 82), `og` (optional `.png` path — also writes a 1200x630
  center-cropped OG variant). Requires network access to
  `api.openai.com` and `OPENAI_API_KEY`.
- **`plate_inspect`** — reads width/height/format/byte size of an image
  under `public/images/` via `sharp` metadata. Read-only.
- **`plate_list`** — lists image files (png/webp/jpg/svg) with sizes in a
  `public/images/` directory, non-recursive. Read-only.
- **`codex_exec`** — runs `codex exec --cd <cwd> <prompt>` against this
  repo. **Codex may edit files while executing** — this is not read-only.
  If the `codex` CLI isn't on `PATH`, the tool returns a clear message
  instead of throwing (install with `npm i -g @openai/codex`).

Every path in/out of `plate_generate`, `plate_inspect`, and `plate_list`
must be repo-relative and resolve inside `public/images/`; anything else
is refused with a clear error.

## Picking it up in Claude Code

Claude Code reads the repo-root `.mcp.json` automatically — nothing else
to configure. It already points at this server:

```json
{
  "mcpServers": {
    "pointcast-plates": {
      "command": "node",
      "args": ["scripts/mcp/plates.mjs"]
    }
  }
}
```

## Picking it up in Codex

Add a block to `~/.codex/config.toml` (run Codex from the repo root so
the relative script path resolves):

```toml
[mcp_servers.pointcast-plates]
command = "node"
args = ["scripts/mcp/plates.mjs"]
```

## Where the API key goes

Put `OPENAI_API_KEY=sk-...` in `.env.local` at the repo root (already
gitignored, same pattern as `MANUS_API_KEY` in `scripts/manus.mjs`), or
export it in your shell. The key is never logged or echoed back in any
tool result.

## Example call

Generate the HELLO faucet plates (portrait, high quality, with an OG
crop):

```json
{
  "tool": "plate_generate",
  "input": {
    "prompt": "HELLO — PointCast faucet poster plate, portrait",
    "out": "public/images/faucet/hello-poster.png",
    "og": "public/images/faucet/hello-og.png",
    "aspect": "portrait",
    "quality": "high"
  }
}
```

# PointCast Drum — MCP Server

PointCast exposes the drum hub as a Model Context Protocol (MCP)
server so any AI agent — Claude Desktop, Cursor, Claude Code, ChatGPT
custom GPTs, or anything else MCP-aware — can join the room, see who
is here, read the leaderboard, and play instruments alongside human
visitors.

- Endpoint: `https://pointcast.xyz/api/mcp`
- Transport: stateless POST, JSON-RPC 2.0
- Protocol version: `2024-11-05`
- Server name: `pointcast-drum` v0.1.0
- Auth: none. CORS open. Bring an MCP client.

## Tools

| Tool                  | Input                | What it does                                   |
| --------------------- | -------------------- | ---------------------------------------------- |
| `drum_list_rooms`     | none                 | Lists every `/drum*` surface and what it is    |
| `drum_who_is_here`    | none                 | Active visitors, agents, and noun ids          |
| `drum_top_drummers`   | none                 | Top of the leaderboard from `/api/drum/top`    |
| `drum_now_playing`    | none                 | Current Spotify track on `/drum-v3`            |
| `drum_global_count`   | none                 | Cumulative global drum-tap count               |
| `drum_tap`            | none                 | Tap a drum on classic `/drum`                  |
| `drum_play_instrument`| `{ instrument }`     | Fire an orchestra instrument (v4 / v7 / v8)    |
| `drum_sing_voice`     | `{ voice }`          | Fire a v6 choir voice                          |
| `drum_set_track`      | `{ trackId }`        | Set the v3 room's Spotify track                |

Read-only tools are safe to call freely. Write tools (`drum_tap`,
`drum_play_instrument`, `drum_sing_voice`, `drum_set_track`) post into
the live room — humans on the page will hear the agent's contribution
in the next 150ms poll.

## Resources

| URI                  | Mime                    | Body                              |
| -------------------- | ----------------------- | --------------------------------- |
| `drum://rooms`       | `text/markdown`         | Markdown list of all drum surfaces|
| `drum://now-playing` | `application/json`      | Current room track                 |
| `drum://leaderboard` | `application/json`      | Top 10 drummers                    |
| `drum://schema`      | `application/json`      | `/api/sounds` event schema         |

## Configuring clients

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`
on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows:

```json
{
  "mcpServers": {
    "pointcast-drum": {
      "url": "https://pointcast.xyz/api/mcp"
    }
  }
}
```

### Cursor

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "pointcast-drum": {
      "url": "https://pointcast.xyz/api/mcp"
    }
  }
}
```

### Claude Code

```bash
claude mcp add --transport http pointcast-drum https://pointcast.xyz/api/mcp
```

## Calling it directly

```bash
curl -s https://pointcast.xyz/api/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq
```

```bash
curl -s https://pointcast.xyz/api/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"drum_tap","arguments":{}}}' | jq
```

A `GET` against `/api/mcp` returns an HTML discovery page with the
same config snippets above.

## What's behind it

The MCP server is a thin JSON-RPC dispatcher in
[functions/api/mcp.ts](../../functions/api/mcp.ts) that wraps the
existing drum API endpoints (`/api/visit`, `/api/drum`,
`/api/drum/top`, `/api/drum/track`, `/api/sounds`). No new state. It
inherits the same KV store and 150ms polling cadence the human
surfaces use, so an agent's tap is indistinguishable from a human tap
on the wire.

SSE streaming is not enabled yet. If a client wants live event push
(beats, joins, leaves), it can poll `/api/sounds?since=…` directly —
that endpoint is already CORS-open.

# pointcast-bloom

Standalone Cloudflare Worker hosting the `BloomPartyRoom` Durable Object behind
**Bloom Party** — the PointCast party game at
[`/bloom-party`](https://pointcast.xyz/bloom-party).

Pages Functions cannot export Durable Objects, so the class lives here and the
Pages project binds to it by `script_name`. See the `BLOOM_ROOM` block in the
repo-root `wrangler.toml`.

## What it does

One Durable Object per six-letter room code. It owns the round state machine,
the roster, and the scoreboard.

It does **not** touch audio. A bloom crosses the wire as a ten-field spec and
every phone synthesizes it locally from a seeded PRNG, so a fifteen-phone room
costs exactly what a four-phone room costs. The shared vocabulary lives in
`src/lib/bloom-party.ts` at the repo root and is imported by this Worker, the
page, and the tests — one source of truth for both ends of the wire.

## Phase timing

Every phase deadline is a `ctx.storage.setAlarm()`, not a timer.
`setInterval` does not survive WebSocket hibernation, which is why this Worker
deliberately does not extend `MultiplayerRoom` from `src/lib/multiplayer.ts`.

`room_meta.phase_ends_at` is the authority; the alarm is only the wake-up. An
alarm that fires early re-arms instead of double-advancing, and a phase also
advances the moment every live player has acted — that early exit is what keeps
four players from waiting out a timer sized for fifteen.

## Limits

| Thing | Value |
|---|---|
| Players per room | 15 |
| Stage/observer sockets | 5 |
| Total sockets | 24 |
| Frame size | 1024 bytes |
| Messages per client per second | 10 (4 strikes → `close(1008)`) |
| Messages per room per second | 200 |
| Rounds per game | 5 |
| Idle room reaped after | 45 minutes |

## Deploy

Deploy this Worker **before** the Pages project, or the `script_name` binding
in the root `wrangler.toml` will not resolve.

```
npm install
npx wrangler deploy
npx wrangler tail
```

## Health check

```
curl 'https://pointcast.xyz/api/bloom/room?room=ABCDEF&stats=1'
```

Returns phase, round, connected players, and standings. There is no write path
from outside a WebSocket — the MCP surface (`bloom_party_state`) is read-only on
purpose, because an agent voting in a co-located party game is not a feature.

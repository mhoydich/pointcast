# pointcast-drum

Standalone Cloudflare Worker hosting the `DrumRoom` Durable Object.

## Why this exists

Cloudflare Pages can't host DurableObject classes directly inside `functions/`. The class needs to live in a Worker, and Pages binds to that Worker externally.

This Worker exists solely to define + host the `DrumRoom` DO. The Pages project (`pointcast`) proxies WebSocket upgrades to it via `functions/api/drum/room.ts`.

## Deploy

```bash
cd workers/pointcast-drum
wrangler deploy
```

You'll need to be logged in (`wrangler login`) and have Durable Objects enabled on your Cloudflare account (paid plan).

## After deploy — wire it to Pages

In the parent `wrangler.toml` (top-level `pointcast/wrangler.toml`), uncomment:

```toml
[[durable_objects.bindings]]
name = "DRUM_ROOM"
class_name = "DrumRoom"
script_name = "pointcast-drum"  # this Worker's name
```

Push to `main`. Pages picks up the binding on next deploy. `/api/drum/room` (which lives in the Pages project) starts proxying WebSocket upgrades to this Worker's DO.

## Verify

```bash
# Watch a sample DO instance's stats
curl https://pointcast-drum.<your-account>.workers.dev/stats
```

On `/drum-v7` and `/drum-v8`, the **STREAM** HUD card flips from amber `polling · 150ms` to green `WebSocket · ~30–60ms p50`.

## Architecture

```
Browser (v7/v8)
   │  ws://pointcast.xyz/api/drum/room
   ▼
Pages Function functions/api/drum/room.ts
   │  env.DRUM_ROOM.idFromName('main').fetch(req)
   ▼
Cloudflare Durable Object (this Worker)
   │  fan-out to all connected sockets
   ▼
Other browsers (v7/v8)
```

One global "main" room across all drum surfaces. Sharding (per surface, per geo) is a later optimization.

## Costs

DurableObjects are paid tier. At PointCast traffic, expect pennies/day. Per-request pricing applies; per-connection-second for WS keeps the math small.

## Source

The `DrumRoom` class definition mirrors `pointcast/functions/durable/drum-room.ts` in the parent project — identical implementation, just packaged as a deployable Worker. If you change one, change the other (or extract to a shared module).

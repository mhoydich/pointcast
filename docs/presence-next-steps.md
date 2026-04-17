# Presence layer — next steps

The PresenceRoom Durable Object is written (`functions/api/presence.ts`) but can't ship directly from Pages Functions — Cloudflare requires DOs to live in a standalone Worker that Pages references via `script_name`. Blocking deploy today.

## What ships now (graceful degrade)
- `PresenceBar.astro` renders in the masthead, attempts to open a WS to `/api/presence`, and silently hides if it fails. No visible "DISCONNECTED" state.
- Domain-locked: it only tries to connect on `pointcast.xyz` or `*.pages.dev`. Local dev gets hidden.

## To actually light up presence

1. **Create a standalone Worker** — `workers/presence/`:
   ```
   workers/presence/
     wrangler.toml       # name = "pointcast-presence", main = "src/index.ts"
     src/index.ts        # copy the `PresenceRoom` class + fetch handler
     package.json
   ```
2. **Deploy the Worker** — `cd workers/presence && npx wrangler deploy`. Grab its name.
3. **Reference from Pages** — in the root `wrangler.toml`, add:
   ```toml
   [[durable_objects.bindings]]
   name = "PRESENCE"
   class_name = "PresenceRoom"
   script_name = "pointcast-presence"
   ```
4. **Re-enable `functions/api/presence.ts`** — the `onRequest` handler already expects `ctx.env.PRESENCE`. Nothing to change.
5. **Redeploy Pages** — `npx wrangler pages deploy …`

## Quick alternative if DO friction is too high

Fall back to a **poll-based presence**: clients POST to `/api/presence` every 20s (updates a KV entry with 60s TTL), and GET returns a count from KV. Lower fidelity (2s update cadence, eventual consistency), no "live" feel, but ships on Pages Functions alone. Worth considering only if the DO path stays blocked.

## Why presence matters per BLOCKS.md + Mike's direction

Mike's direct ask: "that websockets presence feel". The `/status` open question in AGENTS.md — "a page that shows what each agent is currently doing, live, on pointcast.xyz itself" — converges on the same idea. Presence in the masthead is the Phase-1 version of the same thesis: the site shows you the machines working.

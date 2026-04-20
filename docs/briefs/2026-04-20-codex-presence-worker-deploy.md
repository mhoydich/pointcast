# Codex brief — ship the Presence DO as a companion Worker

**Audience:** Codex. Short, scoped task. Should be 30-60 min of real work, most of it adapting existing code.

**Context:** `PresenceRoom` DO class has been written for months in `functions/api/presence.ts` and enriched in Brief #6 (identity-per-visitor). Brief #7 (/here + /api/presence/snapshot) shipped but renders empty state — because the DO has never been bound. Cloudflare Pages Functions CANNOT export DO classes; DOs must live in a standalone Worker that Pages references via `script_name` binding.

See `docs/presence-next-steps.md` for the original plan (written months ago).

## Goal

After this ship, WebSocket connections to `wss://pointcast.xyz/api/presence` actually work. Visitors show up on VisitorHereStrip, PresenceBar, /here. `/api/presence/snapshot` returns real live data.

## Files to create

1. `workers/presence/wrangler.toml` — a separate Worker config with:
   ```toml
   name = "pointcast-presence"
   main = "src/index.ts"
   compatibility_date = "2024-11-01"

   [[durable_objects.bindings]]
   name = "PRESENCE"
   class_name = "PresenceRoom"

   [[migrations]]
   tag = "v1"
   new_sqlite_classes = ["PresenceRoom"]
   ```

2. `workers/presence/src/index.ts` — copy the `PresenceRoom` class + a `fetch` handler from `functions/api/presence.ts`. The Worker needs both (a) to EXPORT the class so Cloudflare recognizes it as a DO, and (b) to route incoming requests to the DO. The existing `onRequest` in the Pages Function becomes a standard `export default { fetch(request, env, ctx) }`.

3. `workers/presence/package.json` — minimal, just `"name": "pointcast-presence"` and a dev/deploy script.

## Files to modify

4. `/Users/michaelhoydich/pointcast/wrangler.toml` — add the DO binding block:
   ```toml
   [[durable_objects.bindings]]
   name = "PRESENCE"
   class_name = "PresenceRoom"
   script_name = "pointcast-presence"
   ```
   (Place AFTER existing kv_namespaces blocks, before the trailing presence-deferred comment. You can delete the "DEFERRED" comment once binding is live.)

5. `/Users/michaelhoydich/pointcast/functions/api/presence.ts` — the DO class can be REMOVED from here (now lives in the companion worker). Keep only the Pages Function wrapper: a thin `onRequest` that calls `env.PRESENCE.get(...)`.fetch(...). OR: keep the class here too as a ref/parity and just let the binding route through. Your call — but the cleaner path is "class lives in one place."

## Deploy sequence

After writing the files, the deploy sequence is:
1. `cd /Users/michaelhoydich/pointcast/workers/presence && npx wrangler deploy`
2. Back in the root: `cd /Users/michaelhoydich/pointcast && npx wrangler pages deploy dist --project-name pointcast`

Claude Code runs both (CC handles deploys per existing pattern). Your job ends at writing the files + a single sentence confirming the expected binding name matches on both sides (`PRESENCE` + `pointcast-presence`).

## Constraints

- VOICE.md: author: codex, source: this brief path.
- Do NOT touch HereGrid.astro, here.astro, snapshot.ts, VisitorHereStrip.astro, PresenceBar.astro — those are consumer-side and already correct.
- The DO class code does not need to change semantically — just relocation from Pages Function to standalone Worker. Identify / update / ping message handlers, the 90s idle timeout, sessions array, privacy (no sid broadcast) — all stay exactly as Brief #6 shipped them.
- Do NOT run npx astro build or npx wrangler deploy — cc handles both after files land.

## Verification (post-deploy)

1. `curl https://pointcast.xyz/api/presence/snapshot` returns real data (sessions array may be empty if no one connected, but no longer the "DO not bound" note).
2. Visit /here in a browser — connection opens, YOU appears. Open a second tab — count goes to 2. Close one — count returns to 1 within 90s.

---

Filed by cc. Source: the existing `docs/presence-next-steps.md` plan, promoted to active Codex brief now that /here + snapshot are live and ready to consume real data.

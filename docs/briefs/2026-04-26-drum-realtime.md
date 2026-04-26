# Drum Room · Real-time architecture audit + upgrade plan

**Date:** 2026-04-26
**Trigger:** Mike: *"have an overall site check on the websockets or whichever way you are sense and surfacing visitors, want to be real time collaborative"*
**Surfaces:** /drum, /drum-v2, /drum-v3, /drum-v4, /drum-v5, /drum-v6

## Current state — polling, not push

Two endpoints do the cross-visitor work:

- **`/api/sounds`** — KV-backed rolling buffer of the last 50 events under `sounds:buffer`. POST appends; GET with `?since=<ms>` returns events newer than the cutoff. Drum surfaces poll on `setInterval`.
- **`/api/visit`** — KV keys `present:<ipHash>` with TTL refresh on each ping. GET returns currently-present sessions. Drum surfaces poll on slower (~8s) interval.

Header comment in `functions/api/sounds.ts` already flags it: *"Durable Objects would give us true sub-second broadcast"* — the upgrade was acknowledged but never built.

## What just shipped (this PR — feat/nouns-cursor-realtime)

| Surface | Old `pollSounds` | New | Win |
|---|---|---|---|
| /drum-v2 | 300ms | 150ms | 2× |
| /drum-v3 | 300ms | 150ms | 2× |
| /drum-v4 | 350ms | 150ms | ~2.3× |
| /drum-v5 | 350ms | 150ms | ~2.3× |
| /drum-v6 | 400ms | 150ms | ~2.7× |

**Why 150ms and not lower:**
1. **Perceptual threshold for music collab.** Below ~200ms, two strangers tapping together feel like they're playing together. 150ms parks comfortably under that.
2. **KV read budget.** At 1M visitors × 6.6 polls/sec the cost adds up. 150ms is the floor I'm comfortable with on the current tier.
3. **Real-time without DO is fundamentally polling.** Going to 50ms would 3× cost without solving the architecture.

**Cursor lag fix in same PR.** v1 ran `document.elementFromPoint(x, y)` on every mousemove plus a CSS `transition: transform 60ms linear` that visibly trailed the pointer. v2:

- `requestAnimationFrame` batch — N mousemoves in one repaint frame produce one transform write
- Removed transition entirely; cursor matches pointer to the pixel
- Hover state moved to `mouseover/mouseout` event delegation (cost-free)
- Cursor switched from glasses-only SVG to a 32×32 Nouns avatar derived from the visitor's session id

## Upgrade path — three options

### Option A — Server-Sent Events (SSE) on Pages Functions

Cloudflare Pages Functions can stream `Response` bodies. `/api/sounds/stream` would hold a long connection per client, server-poll KV at 80ms, push new events.

**Latency:** ~110–180ms p50. Marginal vs. current 150ms client poll. **Not worth complexity unless we restructure the buffer.**

### Option B — Cloudflare Durable Objects + WebSocket  ← **recommended**

One DO per drum room. Clients connect via WebSocket. Posts route through the DO, which fans out to all attached sockets. KV becomes persistence (last-50 buffer for late joiners), DO is broadcast.

**Latency:** ~20–60ms p50. Sub-perceptual-threshold for music collab. Room actually feels live.

**Cost:** Paid tier. Pennies a day at PointCast traffic.

**Outline:**

```ts
export class DrumRoom {
  sockets = new Set<WebSocket>();
  recentEvents: Event[] = [];

  async fetch(req: Request) {
    if (req.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      this.sockets.add(server);
      for (const ev of this.recentEvents.slice(-10)) server.send(JSON.stringify(ev));
      server.addEventListener('message', (msg) => {
        const ev = JSON.parse(msg.data as string);
        this.recentEvents.push({ ...ev, t: Date.now() });
        this.recentEvents = this.recentEvents.slice(-50);
        for (const s of this.sockets) if (s !== server) s.send(JSON.stringify(ev));
      });
      server.addEventListener('close', () => this.sockets.delete(server));
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response('drumroom', { status: 200 });
  }
}
```

KV `sounds:buffer` stays as fallback for cross-Worker reads (e.g. homepage drum module).

### Option C — Stay on polling (current)

Accept ~150–200ms latency floor. Fine for casual drum room. Not fine for serious collab at 120+ BPM where 200ms is a 16th-note of slop.

## Recommendation

Ship 150ms poll cap now (this PR). Plan a follow-up sprint:

1. Add `[[durable_objects.bindings]]` to `wrangler.toml` for `DRUM_ROOM`.
2. Create `functions/api/drum/room.ts` proxying WebSocket upgrades to the DO.
3. Migrate `/drum-v4` first (highest event rate when auto-play is on); validate latency in production.
4. Roll the rest of the surfaces over once proven.
5. Keep `/api/sounds` polling as fallback for browsers without WebSocket and late-join catch-up.

Estimated effort: 1 evening of focused work + Manus testing.

## Other site-wide checks (no change needed)

- `/api/visit` 8s poll — presence isn't latency-sensitive.
- `/api/drum/track` 5s poll — track changes are rare.
- `/api/drum/top` 15s poll — leaderboard is fine.
- `/api/sounds` 50-event buffer TTL — fine; real-time clients won't hit it once on WebSocket.

## Cleanup once DO ships

- Drum surfaces all duplicate the `pollSounds` setInterval. Should become one shared `src/lib/drum-stream.ts` after the WebSocket migration — single connection per visitor regardless of how many drum surfaces they bounce between.
- `/drum` (v1) has its own 800ms poll inside `DrumModule.astro` — should also get the upgrade.

## Signed

Michael Hoydich · Claude Opus 4.7 (1M Max) · 2026-04-26

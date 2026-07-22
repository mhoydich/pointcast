# pointcast-drum

Standalone Cloudflare Worker for PointCast's realtime drum rooms. The Pages
project forwards `/api/drum/room` to this Worker through a Durable Object
binding.

## Current room contract

- One `DrumRoomV2` SQLite-backed Durable Object per normalized invite code.
- WebSocket Hibernation API, so idle connected rooms can sleep without
  dropping their visitors.
- Target: 100 visitors in one room. Safety ceiling: 125.
- Client frame ceiling: 512 bytes.
- Per-connection limit: 8 frames/second; room burst guard: 300 frames/second.
- Persisted room total and the latest 24 hits; presence stays ephemeral and
  anonymous.
- `welcome`, `presence`, `hit`, `reaction`, `pong`, and bounded error events.

The legacy `DrumRoom` export remains during the two-deploy transition so the
old Pages binding keeps working until Pages switches to `DrumRoomV2`.

## Verify

```bash
npm install
npm run verify
```

`npm run verify` checks generated bindings, strict TypeScript, Workers-runtime
tests (including 100 simultaneous sockets), and a Wrangler dry run.

For a running Worker:

```bash
node ../../scripts/load-drum-room.mjs \
  'ws://127.0.0.1:8787/?room=hundred-live' \
  --clients=100 --hold-ms=5000
```

## Deployment order

1. Deploy this Worker: `npm run deploy`.
2. Build PointCast and deploy Pages with the root binding set to
   `class_name = "DrumRoomV2"` and `script_name = "pointcast-drum"`.
3. Verify a real WebSocket welcome/fan-out and the Pages stats endpoint.
4. Run the 100-client harness against the immutable Pages deployment URL.

The order preserves the legacy class while Pages changes bindings, avoiding a
realtime outage during rollout.

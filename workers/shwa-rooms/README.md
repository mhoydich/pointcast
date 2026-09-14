# Shwa five-human rooms

A dedicated SQLite Durable Object per cryptographic invite token. No dependency on the voice trial, private PointCast sessions, or the public presence room. The Worker accepts PointCast and the two existing localhost preview origins. Browser names are self-selected. Anyone with a link can read/join; links expire after 24 hours.

The server enforces five seats and forty pieces, bounds payloads and per-socket message rate, hashes reconnect secrets, and persists before broadcasting. Hibernating sockets use automatic ping replies. Disconnected seats get ninety seconds to reconnect; explicit leave releases immediately and removes that participant’s votes. Board content and participant data are cleared at expiry, retaining only expiry/revision metadata so an expired link cannot be resurrected. Invocation URL logging is disabled. Creation has a per-IP edge limit of six per minute.

Resources (`house`, `own`, `x402`) are preferences only. No provider call, balance, purchase or wallet authorization is performed. Text enters this browser’s Shwa context only through the explicit Discuss button. Personal calls, images and Spotify are not broadcast.

From repository root, using the existing voice Worker toolchain:

```sh
node workers/shwa-voice/node_modules/wrangler/bin/wrangler.js types workers/shwa-rooms/worker-configuration.d.ts --config workers/shwa-rooms/wrangler.jsonc --include-runtime false --strict-vars false
node node_modules/typescript/bin/tsc -p workers/shwa-rooms/tsconfig.json
node --test workers/shwa-rooms/test/integration.mjs
node --test tests/shwa-shared-room.test.mjs
node workers/shwa-voice/node_modules/wrangler/bin/wrangler.js deploy --dry-run --config workers/shwa-rooms/wrangler.jsonc
```

Integration tests use the real local Workers runtime and SQLite storage, including concurrent joins, full-room rejection, room isolation, votes, authorization, reconnection, restart recovery, and expiry. Privileged expiry/pruning methods exist only in the test entry point. Deploy this Worker before the Pages UI using it.
